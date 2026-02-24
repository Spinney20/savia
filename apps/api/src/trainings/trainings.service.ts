import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { and, eq, isNull, count, desc, inArray } from 'drizzle-orm';
import type {
  AuthUser,
  TrainingDto,
  TrainingDetailDto,
  TrainingParticipantDto,
  CreateTrainingInput,
  ConfirmParticipationInput,
  UpdateParticipantsInput,
  PaginatedResponse,
  TrainingType,
  ConfirmationMethod,
} from '@ssm/shared';
import { isRoleAtLeast } from '@ssm/shared';
import { DRIZZLE } from '../database/drizzle.provider';
import type { DrizzleDB } from '../database/drizzle.provider';
import {
  trainings,
  trainingParticipants,
  sites,
  users,
  employees,
} from '../database/schema';
import { parsePaginationQuery, buildPaginationMeta } from '../common/dto/pagination.dto';
import { getUserSiteIds } from '../common/utils/site-filter.util';

@Injectable()
export class TrainingsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
  ) {}

  // ─── LIST ───────────────────────────────────────────────
  async list(
    authUser: AuthUser,
    rawQuery: Record<string, unknown>,
  ): Promise<PaginatedResponse<TrainingDto>> {
    const query = parsePaginationQuery(rawQuery);
    const offset = (query.page - 1) * query.limit;

    const baseConditions = [
      eq(trainings.companyId, authUser.companyId),
      isNull(trainings.deletedAt),
    ];

    // Site-level isolation for roles below SEF_AGENTIE
    if (!isRoleAtLeast(authUser.role, 'SEF_AGENTIE')) {
      const siteIds = await getUserSiteIds(this.db, authUser.employeeId);
      if (siteIds.length === 0) {
        return { data: [], meta: buildPaginationMeta(0, query) };
      }
      baseConditions.push(inArray(trainings.siteId, siteIds));
    }

    const siteUuid = rawQuery.siteUuid as string | undefined;
    if (siteUuid) {
      const site = await this.db.query.sites.findFirst({
        where: and(
          eq(sites.uuid, siteUuid),
          eq(sites.companyId, authUser.companyId),
          isNull(sites.deletedAt),
        ),
        columns: { id: true },
      });
      if (site) {
        baseConditions.push(eq(trainings.siteId, site.id));
      }
    }

    const trainingType = rawQuery.trainingType as string | undefined;
    if (trainingType) {
      baseConditions.push(eq(trainings.trainingType, trainingType));
    }

    const whereClause = and(...baseConditions);

    const [countResult, rows] = await Promise.all([
      this.db.select({ value: count() }).from(trainings).where(whereClause),
      this.db
        .select({
          training: trainings,
          siteUuid: sites.uuid,
          conductorFirstName: employees.firstName,
          conductorLastName: employees.lastName,
        })
        .from(trainings)
        .innerJoin(sites, eq(trainings.siteId, sites.id))
        .innerJoin(users, eq(trainings.conductorId, users.id))
        .innerJoin(employees, eq(users.employeeId, employees.id))
        .where(whereClause)
        .orderBy(desc(trainings.createdAt))
        .limit(query.limit)
        .offset(offset),
    ]);

    const total = countResult[0]?.value ?? 0;

    // Fetch participant counts for all trainings in one query
    const trainingIds = rows.map((r) => r.training.id);
    let participantCounts: Map<number, number> = new Map();

    if (trainingIds.length > 0) {
      const countRows = await this.db
        .select({
          trainingId: trainingParticipants.trainingId,
          value: count(),
        })
        .from(trainingParticipants)
        .where(
          and(
            inArray(trainingParticipants.trainingId, trainingIds),
            isNull(trainingParticipants.deletedAt),
          ),
        )
        .groupBy(trainingParticipants.trainingId);

      participantCounts = new Map(
        countRows.map((r) => [r.trainingId, r.value]),
      );
    }

    return {
      data: rows.map((r) =>
        this.toTrainingDto(
          r.training,
          r.siteUuid,
          `${r.conductorLastName} ${r.conductorFirstName}`,
          participantCounts.get(r.training.id) ?? 0,
        ),
      ),
      meta: buildPaginationMeta(total, query),
    };
  }

  // ─── CREATE ─────────────────────────────────────────────
  async create(authUser: AuthUser, input: CreateTrainingInput): Promise<TrainingDetailDto> {
    // Resolve site
    const site = await this.db.query.sites.findFirst({
      where: and(
        eq(sites.uuid, input.siteUuid),
        eq(sites.companyId, authUser.companyId),
        isNull(sites.deletedAt),
      ),
    });
    if (!site) {
      throw new NotFoundException('Șantierul nu a fost găsit');
    }

    // Resolve participant employees
    const employeeRows = await this.db.query.employees.findMany({
      where: and(
        inArray(employees.uuid, input.participantEmployeeUuids),
        eq(employees.companyId, authUser.companyId),
        isNull(employees.deletedAt),
      ),
    });

    if (employeeRows.length !== input.participantEmployeeUuids.length) {
      const foundUuids = new Set(employeeRows.map((e) => e.uuid));
      const missing = input.participantEmployeeUuids.filter((u) => !foundUuids.has(u));
      throw new NotFoundException(
        `Angajații nu au fost găsiți: ${missing.join(', ')}`,
      );
    }

    // Map UUIDs to IDs preserving order
    const uuidToId = new Map(employeeRows.map((e) => [e.uuid, e.id]));

    const result = await this.db.transaction(async (tx) => {
      const [training] = await tx
        .insert(trainings)
        .values({
          companyId: authUser.companyId,
          siteId: site.id,
          conductorId: authUser.userId,
          trainingType: input.trainingType,
          title: input.title,
          description: input.description ?? null,
          conductedAt: new Date(input.conductedAt),
          durationMinutes: input.durationMinutes ?? null,
          latitude: input.latitude?.toString() ?? null,
          longitude: input.longitude?.toString() ?? null,
        })
        .returning();

      // Insert all participants with PENDING status
      await tx.insert(trainingParticipants).values(
        input.participantEmployeeUuids.map((uuid) => ({
          trainingId: training!.id,
          employeeId: uuidToId.get(uuid)!,
          confirmationMethod: 'PENDING',
        })),
      );

      return training!;
    });

    return this.findOne(authUser, result.uuid);
  }

  // ─── GET ONE (DETAIL) ──────────────────────────────────
  async findOne(authUser: AuthUser, uuid: string): Promise<TrainingDetailDto> {
    const row = await this.db
      .select({
        training: trainings,
        siteUuid: sites.uuid,
        conductorFirstName: employees.firstName,
        conductorLastName: employees.lastName,
      })
      .from(trainings)
      .innerJoin(sites, eq(trainings.siteId, sites.id))
      .innerJoin(users, eq(trainings.conductorId, users.id))
      .innerJoin(employees, eq(users.employeeId, employees.id))
      .where(
        and(
          eq(trainings.uuid, uuid),
          eq(trainings.companyId, authUser.companyId),
          isNull(trainings.deletedAt),
        ),
      );

    if (row.length === 0) {
      throw new NotFoundException('Instructajul nu a fost găsit');
    }

    const r = row[0]!;

    // Fetch participants with employee names
    const participants = await this.db
      .select({
        participant: trainingParticipants,
        employeeUuid: employees.uuid,
        firstName: employees.firstName,
        lastName: employees.lastName,
      })
      .from(trainingParticipants)
      .innerJoin(employees, eq(trainingParticipants.employeeId, employees.id))
      .where(
        and(
          eq(trainingParticipants.trainingId, r.training.id),
          isNull(trainingParticipants.deletedAt),
        ),
      );

    const t = r.training;

    return {
      uuid: t.uuid,
      siteUuid: r.siteUuid,
      conductorName: `${r.conductorLastName} ${r.conductorFirstName}`,
      trainingType: t.trainingType as TrainingType,
      title: t.title,
      description: t.description,
      conductedAt: t.conductedAt.toISOString(),
      durationMinutes: t.durationMinutes,
      participantCount: participants.length,
      createdAt: t.createdAt.toISOString(),
      latitude: t.latitude ? Number(t.latitude) : null,
      longitude: t.longitude ? Number(t.longitude) : null,
      participants: participants.map((p) => this.toParticipantDto(
        p.participant,
        p.employeeUuid,
        `${p.lastName} ${p.firstName}`,
      )),
    };
  }

  // ─── SOFT DELETE ────────────────────────────────────────
  async remove(authUser: AuthUser, uuid: string): Promise<void> {
    const training = await this.resolveTraining(authUser, uuid);

    await this.db
      .update(trainings)
      .set({ deletedAt: new Date() })
      .where(eq(trainings.id, training.id));
  }

  // ─── CONFIRM (WORKER SELF-CONFIRM) ─────────────────────
  async confirm(
    authUser: AuthUser,
    uuid: string,
    input: ConfirmParticipationInput,
  ): Promise<TrainingParticipantDto> {
    const training = await this.resolveTraining(authUser, uuid);

    // Find participant record matching authUser's employeeId
    const participant = await this.db.query.trainingParticipants.findFirst({
      where: and(
        eq(trainingParticipants.trainingId, training.id),
        eq(trainingParticipants.employeeId, authUser.employeeId),
        isNull(trainingParticipants.deletedAt),
      ),
    });

    if (!participant) {
      throw new NotFoundException(
        'Nu sunteți participant la acest instructaj',
      );
    }

    if (participant.confirmationMethod !== 'PENDING') {
      throw new BadRequestException(
        'Participarea a fost deja confirmată sau marcată',
      );
    }

    const [updated] = await this.db
      .update(trainingParticipants)
      .set({
        confirmationMethod: 'SELF_CONFIRMED',
        confirmedAt: new Date(),
        notes: input.notes ?? null,
      })
      .where(eq(trainingParticipants.id, participant.id))
      .returning();

    // Get employee info for DTO
    const emp = await this.db.query.employees.findFirst({
      where: eq(employees.id, authUser.employeeId),
      columns: { uuid: true, firstName: true, lastName: true },
    });

    return this.toParticipantDto(
      updated!,
      emp!.uuid,
      `${emp!.lastName} ${emp!.firstName}`,
    );
  }

  // ─── UPDATE PARTICIPANTS (CONDUCTOR BATCH) ──────────────
  async updateParticipants(
    authUser: AuthUser,
    uuid: string,
    input: UpdateParticipantsInput,
  ): Promise<TrainingDetailDto> {
    const training = await this.resolveTraining(authUser, uuid);

    // Resolve employee UUIDs to IDs
    const employeeUuids = input.participants.map((p) => p.employeeUuid);
    const employeeRows = await this.db.query.employees.findMany({
      where: and(
        inArray(employees.uuid, employeeUuids),
        eq(employees.companyId, authUser.companyId),
        isNull(employees.deletedAt),
      ),
    });

    const uuidToId = new Map(employeeRows.map((e) => [e.uuid, e.id]));

    // Verify all employees found
    const missingUuids = employeeUuids.filter((u) => !uuidToId.has(u));
    if (missingUuids.length > 0) {
      throw new NotFoundException(
        `Angajații nu au fost găsiți: ${missingUuids.join(', ')}`,
      );
    }

    // Fetch existing participants for this training
    const existingParticipants = await this.db.query.trainingParticipants.findMany({
      where: and(
        eq(trainingParticipants.trainingId, training.id),
        isNull(trainingParticipants.deletedAt),
      ),
    });
    const employeeIdToParticipant = new Map(
      existingParticipants.map((p) => [p.employeeId, p]),
    );

    // Update each participant
    for (const update of input.participants) {
      const employeeId = uuidToId.get(update.employeeUuid)!;
      const participant = employeeIdToParticipant.get(employeeId);

      if (!participant) {
        throw new NotFoundException(
          `Angajatul ${update.employeeUuid} nu este participant la acest instructaj`,
        );
      }

      await this.db
        .update(trainingParticipants)
        .set({
          confirmationMethod: update.confirmationMethod,
          confirmedAt: update.confirmationMethod === 'MANUAL' ? new Date() : null,
          notes: update.notes ?? participant.notes,
        })
        .where(eq(trainingParticipants.id, participant.id));
    }

    return this.findOne(authUser, uuid);
  }

  // ─── PDF (STUB) ────────────────────────────────────────
  async getPdf(authUser: AuthUser, uuid: string): Promise<string> {
    const training = await this.resolveTraining(authUser, uuid);

    if (!training.pdfUrl) {
      throw new NotFoundException('PDF-ul nu a fost generat încă');
    }

    return training.pdfUrl;
  }

  // ─── HELPERS ────────────────────────────────────────────

  private async resolveTraining(authUser: AuthUser, uuid: string) {
    const training = await this.db.query.trainings.findFirst({
      where: and(
        eq(trainings.uuid, uuid),
        eq(trainings.companyId, authUser.companyId),
        isNull(trainings.deletedAt),
      ),
    });
    if (!training) {
      throw new NotFoundException('Instructajul nu a fost găsit');
    }
    return training;
  }

  private toTrainingDto(
    t: typeof trainings.$inferSelect,
    siteUuid: string,
    conductorName: string,
    participantCount: number,
  ): TrainingDto {
    return {
      uuid: t.uuid,
      siteUuid,
      conductorName,
      trainingType: t.trainingType as TrainingType,
      title: t.title,
      description: t.description,
      conductedAt: t.conductedAt.toISOString(),
      durationMinutes: t.durationMinutes,
      participantCount,
      createdAt: t.createdAt.toISOString(),
    };
  }

  private toParticipantDto(
    p: typeof trainingParticipants.$inferSelect,
    employeeUuid: string,
    employeeName: string,
  ): TrainingParticipantDto {
    return {
      employeeUuid,
      employeeName,
      confirmationMethod: p.confirmationMethod as ConfirmationMethod,
      confirmedAt: p.confirmedAt?.toISOString() ?? null,
      notes: p.notes,
    };
  }
}
