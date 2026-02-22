import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import type { AuthUser, EmployeeDocumentDto, CreateEmployeeDocumentInput } from '@ssm/shared';
import { DRIZZLE } from '../database/drizzle.provider';
import type { DrizzleDB } from '../database/drizzle.provider';
import { employeeDocuments, employees } from '../database/schema';
import { EmployeesService } from './employees.service';

@Injectable()
export class EmployeeDocumentsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly employeesService: EmployeesService,
  ) {}

  // ─── LIST DOCUMENTS ─────────────────────────────────────
  async list(authUser: AuthUser, employeeUuid: string): Promise<EmployeeDocumentDto[]> {
    const emp = await this.employeesService.resolveEmployee(authUser, employeeUuid);

    const docs = await this.db.query.employeeDocuments.findMany({
      where: and(
        eq(employeeDocuments.employeeId, emp.id),
        isNull(employeeDocuments.deletedAt),
      ),
      orderBy: (d, { desc }) => [desc(d.createdAt)],
    });

    return docs.map((d) => this.toDocumentDto(d, employeeUuid));
  }

  // ─── CREATE DOCUMENT ────────────────────────────────────
  async create(
    authUser: AuthUser,
    employeeUuid: string,
    input: CreateEmployeeDocumentInput,
  ): Promise<EmployeeDocumentDto> {
    const emp = await this.employeesService.resolveEmployee(authUser, employeeUuid);

    const [doc] = await this.db
      .insert(employeeDocuments)
      .values({
        employeeId: emp.id,
        companyId: authUser.companyId,
        documentType: input.documentType,
        title: input.title,
        description: input.description ?? null,
        issuedDate: input.issuedDate ?? null,
        expiryDate: input.expiryDate ?? null,
        uploadedBy: authUser.userId,
      })
      .returning();

    return this.toDocumentDto(doc!, employeeUuid);
  }

  // ─── HELPERS ────────────────────────────────────────────

  private toDocumentDto(
    doc: typeof employeeDocuments.$inferSelect,
    employeeUuid: string,
  ): EmployeeDocumentDto {
    return {
      uuid: doc.uuid,
      employeeUuid,
      documentType: doc.documentType as EmployeeDocumentDto['documentType'],
      title: doc.title,
      description: doc.description,
      issuedDate: doc.issuedDate,
      expiryDate: doc.expiryDate,
      createdAt: doc.createdAt.toISOString(),
    };
  }
}
