import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { and, eq, isNull, or, ilike, sql, count } from 'drizzle-orm';
import type {
  AuthUser,
  EmployeeDto,
  PaginatedResponse,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  CreateUserForEmployeeInput,
} from '@ssm/shared';
import { DRIZZLE } from '../database/drizzle.provider';
import type { DrizzleDB } from '../database/drizzle.provider';
import { employees, users, companies } from '../database/schema';
import { encryptCnp, hashCnp } from '../common/utils/crypto.util';
import { escapeLike } from '../common/utils/query.util';
import { parsePaginationQuery, buildPaginationMeta } from '../common/dto/pagination.dto';
import type { PaginationQuery } from '../common/dto/pagination.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  // ─── LIST ───────────────────────────────────────────────
  async list(
    authUser: AuthUser,
    rawQuery: Record<string, unknown>,
  ): Promise<PaginatedResponse<EmployeeDto>> {
    const query = parsePaginationQuery(rawQuery);
    const offset = (query.page - 1) * query.limit;

    const baseWhere = and(
      eq(employees.companyId, authUser.companyId),
      isNull(employees.deletedAt),
    );

    const searchWhere = query.search
      ? and(
          baseWhere,
          or(
            ilike(employees.firstName, `%${escapeLike(query.search)}%`),
            ilike(employees.lastName, `%${escapeLike(query.search)}%`),
          ),
        )
      : baseWhere;

    const [countResult, rows] = await Promise.all([
      this.db.select({ value: count() }).from(employees).where(searchWhere),
      this.db
        .select({
          employee: employees,
          companyUuid: companies.uuid,
          hasUser: sql<boolean>`EXISTS (
            SELECT 1 FROM users
            WHERE users.employee_id = ${employees.id}
            AND users.deleted_at IS NULL
          )`,
        })
        .from(employees)
        .innerJoin(companies, eq(employees.companyId, companies.id))
        .where(searchWhere)
        .orderBy(employees.lastName, employees.firstName)
        .limit(query.limit)
        .offset(offset),
    ]);

    const total = countResult[0]?.value ?? 0;

    return {
      data: rows.map((r) => this.toEmployeeDto(r.employee, r.companyUuid, r.hasUser)),
      meta: buildPaginationMeta(total, query),
    };
  }

  // ─── CREATE ─────────────────────────────────────────────
  async create(authUser: AuthUser, input: CreateEmployeeInput): Promise<EmployeeDto> {
    let cnpEncrypted: Buffer | null = null;
    let cnpHashValue: string | null = null;

    if (input.cnp) {
      const encKey = this.config.get<string>('ENCRYPTION_KEY');
      if (!encKey) {
        throw new BadRequestException('Cheia de criptare nu este configurată');
      }

      cnpHashValue = hashCnp(input.cnp);

      // Check uniqueness within company
      const existing = await this.db.query.employees.findFirst({
        where: and(
          eq(employees.companyId, authUser.companyId),
          eq(employees.cnpHash, cnpHashValue),
          isNull(employees.deletedAt),
        ),
      });
      if (existing) {
        throw new ConflictException('Un angajat cu acest CNP există deja în companie');
      }

      const result = encryptCnp(input.cnp, encKey);
      cnpEncrypted = result.encrypted;
    }

    const company = await this.db.query.companies.findFirst({
      where: eq(companies.id, authUser.companyId),
      columns: { uuid: true },
    });

    const [inserted] = await this.db
      .insert(employees)
      .values({
        companyId: authUser.companyId,
        firstName: input.firstName,
        lastName: input.lastName,
        cnpEncrypted,
        cnpHash: cnpHashValue,
        phone: input.phone ?? null,
        email: input.email ?? null,
        jobTitle: input.jobTitle ?? null,
        hireDate: input.hireDate ?? null,
      })
      .returning();

    return this.toEmployeeDto(inserted!, company!.uuid, false);
  }

  // ─── GET ONE ────────────────────────────────────────────
  async findOne(authUser: AuthUser, uuid: string): Promise<EmployeeDto> {
    const rows = await this.db
      .select({
        employee: employees,
        companyUuid: companies.uuid,
        hasUser: sql<boolean>`EXISTS (
          SELECT 1 FROM users
          WHERE users.employee_id = ${employees.id}
          AND users.deleted_at IS NULL
        )`,
      })
      .from(employees)
      .innerJoin(companies, eq(employees.companyId, companies.id))
      .where(
        and(
          eq(employees.uuid, uuid),
          eq(employees.companyId, authUser.companyId),
          isNull(employees.deletedAt),
        ),
      );

    if (rows.length === 0) {
      throw new NotFoundException('Angajatul nu a fost găsit');
    }

    const row = rows[0]!;
    return this.toEmployeeDto(row.employee, row.companyUuid, row.hasUser);
  }

  // ─── UPDATE ─────────────────────────────────────────────
  async update(authUser: AuthUser, uuid: string, input: UpdateEmployeeInput): Promise<EmployeeDto> {
    const emp = await this.resolveEmployee(authUser, uuid);

    const updateData: Record<string, unknown> = {};

    if (input.firstName !== undefined) updateData.firstName = input.firstName;
    if (input.lastName !== undefined) updateData.lastName = input.lastName;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.jobTitle !== undefined) updateData.jobTitle = input.jobTitle;
    if (input.hireDate !== undefined) updateData.hireDate = input.hireDate;
    if (input.terminationDate !== undefined) updateData.terminationDate = input.terminationDate;
    if (input.status !== undefined) updateData.status = input.status;

    if (input.cnp !== undefined) {
      const encKey = this.config.get<string>('ENCRYPTION_KEY');
      if (!encKey) {
        throw new BadRequestException('Cheia de criptare nu este configurată');
      }

      const newHash = hashCnp(input.cnp);
      const existing = await this.db.query.employees.findFirst({
        where: and(
          eq(employees.companyId, authUser.companyId),
          eq(employees.cnpHash, newHash),
          isNull(employees.deletedAt),
          sql`${employees.id} != ${emp.id}`,
        ),
      });
      if (existing) {
        throw new ConflictException('Un angajat cu acest CNP există deja în companie');
      }

      const result = encryptCnp(input.cnp, encKey);
      updateData.cnpEncrypted = result.encrypted;
      updateData.cnpHash = result.hash;
    }

    if (Object.keys(updateData).length === 0) {
      return this.findOne(authUser, uuid);
    }

    await this.db
      .update(employees)
      .set(updateData)
      .where(eq(employees.id, emp.id));

    return this.findOne(authUser, uuid);
  }

  // ─── SOFT DELETE ────────────────────────────────────────
  async remove(authUser: AuthUser, uuid: string): Promise<void> {
    const emp = await this.resolveEmployee(authUser, uuid);

    // Check if employee has an active user account
    const activeUser = await this.db.query.users.findFirst({
      where: and(
        eq(users.employeeId, emp.id),
        isNull(users.deletedAt),
      ),
    });
    if (activeUser) {
      throw new ConflictException(
        'Nu se poate șterge angajatul — are un cont de utilizator activ. Dezactivați mai întâi contul.',
      );
    }

    await this.db
      .update(employees)
      .set({ deletedAt: new Date() })
      .where(eq(employees.id, emp.id));
  }

  // ─── CREATE USER ACCOUNT ───────────────────────────────
  async createUserAccount(
    authUser: AuthUser,
    uuid: string,
    input: CreateUserForEmployeeInput,
  ): Promise<{ message: string }> {
    const emp = await this.resolveEmployee(authUser, uuid);

    // Check existing user for this employee
    const existingUser = await this.db.query.users.findFirst({
      where: and(
        eq(users.employeeId, emp.id),
        isNull(users.deletedAt),
      ),
    });
    if (existingUser) {
      throw new ConflictException('Angajatul are deja un cont de utilizator');
    }

    // Check email uniqueness
    const emailTaken = await this.db.query.users.findFirst({
      where: and(
        eq(users.email, input.email),
        isNull(users.deletedAt),
      ),
    });
    if (emailTaken) {
      throw new ConflictException('Adresa de email este deja folosită');
    }

    // Create user with temporary password hash and isActive: false
    const tempPassword = crypto.randomBytes(32).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

    const [newUser] = await this.db
      .insert(users)
      .values({
        employeeId: emp.id,
        companyId: authUser.companyId,
        email: input.email,
        passwordHash,
        role: input.role,
        isActive: false,
      })
      .returning();

    // Sign activation token (48h expiry)
    const activationToken = this.jwtService.sign(
      { userId: newUser!.id, purpose: 'activate' },
      { expiresIn: '48h' },
    );

    this.logger.log(`Cont creat pentru ${input.email} — link de activare generat`);

    return { message: `Cont creat pentru ${input.email}. Link-ul de activare a fost generat.` };
  }

  // ─── HELPERS ────────────────────────────────────────────

  /** Resolve employee by UUID + company scope. Throws 404 if not found. */
  async resolveEmployee(authUser: AuthUser, uuid: string) {
    const emp = await this.db.query.employees.findFirst({
      where: and(
        eq(employees.uuid, uuid),
        eq(employees.companyId, authUser.companyId),
        isNull(employees.deletedAt),
      ),
    });
    if (!emp) {
      throw new NotFoundException('Angajatul nu a fost găsit');
    }
    return emp;
  }

  private toEmployeeDto(
    emp: typeof employees.$inferSelect,
    companyUuid: string,
    hasUserAccount: boolean,
  ): EmployeeDto {
    return {
      uuid: emp.uuid,
      companyUuid,
      firstName: emp.firstName,
      lastName: emp.lastName,
      phone: emp.phone,
      email: emp.email,
      jobTitle: emp.jobTitle,
      hireDate: emp.hireDate,
      terminationDate: emp.terminationDate,
      status: emp.status as EmployeeDto['status'],
      hasUserAccount,
      createdAt: emp.createdAt.toISOString(),
    };
  }
}
