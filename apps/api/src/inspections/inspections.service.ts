import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { and, eq, isNull, ilike, count, desc } from 'drizzle-orm';
import type {
  AuthUser,
  InspectionDto,
  InspectionDetailDto,
  InspectionItemDto,
  InspectionReviewDto,
  CreateInspectionInput,
  UpdateInspectionDraftInput,
  PaginatedResponse,
  TemplateStructure,
  InspectionStatus,
  Severity,
} from '@ssm/shared';
import { calculateRiskScore, countComplianceStats } from '@ssm/shared';
import { DRIZZLE } from '../database/drizzle.provider';
import type { DrizzleDB } from '../database/drizzle.provider';
import {
  inspections,
  inspectionItems,
  inspectionReviews,
  inspectionTemplates,
  inspectionTemplateVersions,
  sites,
  users,
  employees,
} from '../database/schema';
import { parsePaginationQuery, buildPaginationMeta } from '../common/dto/pagination.dto';

@Injectable()
export class InspectionsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
  ) {}

  // ─── LIST ───────────────────────────────────────────────
  async list(
    authUser: AuthUser,
    rawQuery: Record<string, unknown>,
  ): Promise<PaginatedResponse<InspectionDto>> {
    const query = parsePaginationQuery(rawQuery);
    const offset = (query.page - 1) * query.limit;

    const baseConditions = [
      eq(inspections.companyId, authUser.companyId),
      isNull(inspections.deletedAt),
    ];

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
        baseConditions.push(eq(inspections.siteId, site.id));
      }
    }

    const status = rawQuery.status as string | undefined;
    if (status) {
      baseConditions.push(eq(inspections.status, status));
    }

    const whereClause = and(...baseConditions);

    const [countResult, rows] = await Promise.all([
      this.db.select({ value: count() }).from(inspections).where(whereClause),
      this.db
        .select({
          inspection: inspections,
          siteUuid: sites.uuid,
          templateName: inspectionTemplates.name,
          inspectorFirstName: employees.firstName,
          inspectorLastName: employees.lastName,
        })
        .from(inspections)
        .innerJoin(sites, eq(inspections.siteId, sites.id))
        .innerJoin(
          inspectionTemplateVersions,
          eq(inspections.templateVersionId, inspectionTemplateVersions.id),
        )
        .innerJoin(
          inspectionTemplates,
          eq(inspectionTemplateVersions.templateId, inspectionTemplates.id),
        )
        .innerJoin(users, eq(inspections.inspectorId, users.id))
        .innerJoin(employees, eq(users.employeeId, employees.id))
        .where(whereClause)
        .orderBy(desc(inspections.createdAt))
        .limit(query.limit)
        .offset(offset),
    ]);

    const total = countResult[0]?.value ?? 0;

    return {
      data: rows.map((r) =>
        this.toInspectionDto(
          r.inspection,
          r.siteUuid,
          r.templateName,
          `${r.inspectorLastName} ${r.inspectorFirstName}`,
        ),
      ),
      meta: buildPaginationMeta(total, query),
    };
  }

  // ─── CREATE ─────────────────────────────────────────────
  async create(authUser: AuthUser, input: CreateInspectionInput): Promise<InspectionDto> {
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

    // Resolve template → current version
    const template = await this.db.query.inspectionTemplates.findFirst({
      where: and(
        eq(inspectionTemplates.uuid, input.templateUuid),
        eq(inspectionTemplates.companyId, authUser.companyId),
        isNull(inspectionTemplates.deletedAt),
      ),
    });
    if (!template) {
      throw new NotFoundException('Șablonul de inspecție nu a fost găsit');
    }
    if (!template.currentVersionId) {
      throw new BadRequestException(
        'Șablonul nu are nicio versiune publicată',
      );
    }

    const result = await this.db.transaction(async (tx) => {
      const [inspection] = await tx
        .insert(inspections)
        .values({
          companyId: authUser.companyId,
          siteId: site.id,
          templateVersionId: template.currentVersionId!,
          inspectorId: authUser.userId,
          status: 'DRAFT',
          startedAt: new Date(),
          latitude: input.latitude?.toString() ?? null,
          longitude: input.longitude?.toString() ?? null,
          notes: input.notes ?? null,
        })
        .returning();

      // Insert items if provided
      if (input.items && input.items.length > 0) {
        await tx.insert(inspectionItems).values(
          input.items.map((item) => ({
            inspectionId: inspection!.id,
            sectionId: item.sectionId,
            questionId: item.questionId,
            answerType: item.answerType,
            answerBool: item.answerBool ?? null,
            answerText: item.answerText ?? null,
            answerNumber: item.answerNumber?.toString() ?? null,
            isCompliant: item.isCompliant ?? null,
            severity: item.severity ?? null,
            notes: item.notes ?? null,
          })),
        );
      }

      return inspection!;
    });

    // Fetch inspector name for DTO
    const inspector = await this.getInspectorName(authUser.userId);

    return this.toInspectionDto(result, site.uuid, template.name, inspector);
  }

  // ─── GET ONE (DETAIL) ──────────────────────────────────
  async findOne(authUser: AuthUser, uuid: string): Promise<InspectionDetailDto> {
    const row = await this.db
      .select({
        inspection: inspections,
        siteUuid: sites.uuid,
        templateName: inspectionTemplates.name,
        templateUuid: inspectionTemplates.uuid,
        versionNumber: inspectionTemplateVersions.versionNumber,
        templateStructure: inspectionTemplateVersions.structure,
        inspectorFirstName: employees.firstName,
        inspectorLastName: employees.lastName,
      })
      .from(inspections)
      .innerJoin(sites, eq(inspections.siteId, sites.id))
      .innerJoin(
        inspectionTemplateVersions,
        eq(inspections.templateVersionId, inspectionTemplateVersions.id),
      )
      .innerJoin(
        inspectionTemplates,
        eq(inspectionTemplateVersions.templateId, inspectionTemplates.id),
      )
      .innerJoin(users, eq(inspections.inspectorId, users.id))
      .innerJoin(employees, eq(users.employeeId, employees.id))
      .where(
        and(
          eq(inspections.uuid, uuid),
          eq(inspections.companyId, authUser.companyId),
          isNull(inspections.deletedAt),
        ),
      );

    if (row.length === 0) {
      throw new NotFoundException('Inspecția nu a fost găsită');
    }

    const r = row[0]!;

    // Fetch items and reviews
    const [items, reviews] = await Promise.all([
      this.db.query.inspectionItems.findMany({
        where: and(
          eq(inspectionItems.inspectionId, r.inspection.id),
          isNull(inspectionItems.deletedAt),
        ),
      }),
      this.db
        .select({
          review: inspectionReviews,
          reviewerFirstName: employees.firstName,
          reviewerLastName: employees.lastName,
        })
        .from(inspectionReviews)
        .innerJoin(users, eq(inspectionReviews.reviewerId, users.id))
        .innerJoin(employees, eq(users.employeeId, employees.id))
        .where(
          and(
            eq(inspectionReviews.inspectionId, r.inspection.id),
            isNull(inspectionReviews.deletedAt),
          ),
        )
        .orderBy(desc(inspectionReviews.reviewedAt)),
    ]);

    const baseDto = this.toInspectionDto(
      r.inspection,
      r.siteUuid,
      r.templateName,
      `${r.inspectorLastName} ${r.inspectorFirstName}`,
    );

    return {
      ...baseDto,
      templateUuid: r.templateUuid,
      templateVersionNumber: r.versionNumber,
      templateStructure: r.templateStructure as TemplateStructure,
      items: items.map((i) => this.toItemDto(i)),
      reviews: reviews.map((rv) => this.toReviewDto(
        rv.review,
        `${rv.reviewerLastName} ${rv.reviewerFirstName}`,
      )),
    };
  }

  // ─── UPDATE DRAFT ───────────────────────────────────────
  async updateDraft(
    authUser: AuthUser,
    uuid: string,
    input: UpdateInspectionDraftInput,
  ): Promise<InspectionDetailDto> {
    const inspection = await this.resolveInspection(authUser, uuid);
    this.assertStatus(inspection, 'DRAFT');
    this.assertOwner(inspection, authUser);

    const updateData: Record<string, unknown> = {};
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.latitude !== undefined) updateData.latitude = input.latitude?.toString() ?? null;
    if (input.longitude !== undefined) updateData.longitude = input.longitude?.toString() ?? null;

    await this.db.transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await tx
          .update(inspections)
          .set(updateData)
          .where(eq(inspections.id, inspection.id));
      }

      // Replace items if provided
      if (input.items !== undefined) {
        // Delete existing items
        await tx
          .delete(inspectionItems)
          .where(eq(inspectionItems.inspectionId, inspection.id));

        // Insert new items
        if (input.items.length > 0) {
          await tx.insert(inspectionItems).values(
            input.items.map((item) => ({
              inspectionId: inspection.id,
              sectionId: item.sectionId,
              questionId: item.questionId,
              answerType: item.answerType,
              answerBool: item.answerBool ?? null,
              answerText: item.answerText ?? null,
              answerNumber: item.answerNumber?.toString() ?? null,
              isCompliant: item.isCompliant ?? null,
              severity: item.severity ?? null,
              notes: item.notes ?? null,
            })),
          );
        }
      }
    });

    return this.findOne(authUser, uuid);
  }

  // ─── SOFT DELETE ────────────────────────────────────────
  async remove(authUser: AuthUser, uuid: string): Promise<void> {
    const inspection = await this.resolveInspection(authUser, uuid);
    this.assertStatus(inspection, 'DRAFT');
    this.assertOwner(inspection, authUser);

    await this.db
      .update(inspections)
      .set({ deletedAt: new Date() })
      .where(eq(inspections.id, inspection.id));
  }

  // ─── SUBMIT ─────────────────────────────────────────────
  async submit(authUser: AuthUser, uuid: string): Promise<InspectionDetailDto> {
    const inspection = await this.resolveInspection(authUser, uuid);
    this.assertStatus(inspection, 'DRAFT');
    this.assertOwner(inspection, authUser);

    // Check items exist
    const items = await this.db.query.inspectionItems.findMany({
      where: and(
        eq(inspectionItems.inspectionId, inspection.id),
        isNull(inspectionItems.deletedAt),
      ),
    });

    if (items.length === 0) {
      throw new BadRequestException(
        'Inspecția trebuie să conțină cel puțin un element înainte de trimitere',
      );
    }

    // Calculate risk score and compliance stats
    const riskItems = items.map((item) => ({
      isCompliant: item.isCompliant,
      riskScore: item.riskScore ? Number(item.riskScore) : null,
      severity: item.severity as Severity | null,
    }));

    const riskScore = calculateRiskScore(riskItems);
    const stats = countComplianceStats(riskItems);

    await this.db
      .update(inspections)
      .set({
        status: 'SUBMITTED',
        submittedAt: new Date(),
        riskScore: riskScore.toString(),
        totalItems: stats.total,
        compliantItems: stats.compliant,
        nonCompliantItems: stats.nonCompliant,
      })
      .where(eq(inspections.id, inspection.id));

    return this.findOne(authUser, uuid);
  }

  // ─── REVISE ─────────────────────────────────────────────
  async revise(authUser: AuthUser, uuid: string): Promise<InspectionDetailDto> {
    const inspection = await this.resolveInspection(authUser, uuid);
    this.assertStatus(inspection, 'NEEDS_REVISION');
    this.assertOwner(inspection, authUser);

    await this.db
      .update(inspections)
      .set({
        status: 'DRAFT',
        submittedAt: null,
        riskScore: null,
      })
      .where(eq(inspections.id, inspection.id));

    return this.findOne(authUser, uuid);
  }

  // ─── CLOSE ──────────────────────────────────────────────
  async close(authUser: AuthUser, uuid: string): Promise<InspectionDetailDto> {
    const inspection = await this.resolveInspection(authUser, uuid);
    this.assertStatus(inspection, 'APPROVED');

    await this.db
      .update(inspections)
      .set({
        status: 'CLOSED',
        completedAt: new Date(),
      })
      .where(eq(inspections.id, inspection.id));

    return this.findOne(authUser, uuid);
  }

  // ─── HELPERS ────────────────────────────────────────────

  async resolveInspection(authUser: AuthUser, uuid: string) {
    const inspection = await this.db.query.inspections.findFirst({
      where: and(
        eq(inspections.uuid, uuid),
        eq(inspections.companyId, authUser.companyId),
        isNull(inspections.deletedAt),
      ),
    });
    if (!inspection) {
      throw new NotFoundException('Inspecția nu a fost găsită');
    }
    return inspection;
  }

  private assertStatus(
    inspection: typeof inspections.$inferSelect,
    expected: InspectionStatus,
  ) {
    if (inspection.status !== expected) {
      throw new BadRequestException(
        `Operația nu este permisă — inspecția are statusul ${inspection.status}`,
      );
    }
  }

  private assertOwner(
    inspection: typeof inspections.$inferSelect,
    authUser: AuthUser,
  ) {
    if (inspection.inspectorId !== authUser.userId) {
      throw new ForbiddenException(
        'Doar inspectorul care a creat inspecția poate efectua această operație',
      );
    }
  }

  private async getInspectorName(userId: number): Promise<string> {
    const row = await this.db
      .select({
        firstName: employees.firstName,
        lastName: employees.lastName,
      })
      .from(users)
      .innerJoin(employees, eq(users.employeeId, employees.id))
      .where(eq(users.id, userId));

    if (row.length === 0) return 'Necunoscut';
    return `${row[0]!.lastName} ${row[0]!.firstName}`;
  }

  private toInspectionDto(
    insp: typeof inspections.$inferSelect,
    siteUuid: string,
    templateName: string,
    inspectorName: string,
  ): InspectionDto {
    return {
      uuid: insp.uuid,
      siteUuid,
      templateName,
      inspectorName,
      status: insp.status as InspectionStatus,
      riskScore: insp.riskScore ? Number(insp.riskScore) : null,
      totalItems: insp.totalItems,
      compliantItems: insp.compliantItems,
      nonCompliantItems: insp.nonCompliantItems,
      startedAt: insp.startedAt?.toISOString() ?? null,
      completedAt: insp.completedAt?.toISOString() ?? null,
      submittedAt: insp.submittedAt?.toISOString() ?? null,
      notes: insp.notes,
      createdAt: insp.createdAt.toISOString(),
    };
  }

  private toItemDto(item: typeof inspectionItems.$inferSelect): InspectionItemDto {
    return {
      sectionId: item.sectionId,
      questionId: item.questionId,
      answerType: item.answerType as InspectionItemDto['answerType'],
      answerBool: item.answerBool,
      answerText: item.answerText,
      answerNumber: item.answerNumber ? Number(item.answerNumber) : null,
      isCompliant: item.isCompliant,
      severity: item.severity as InspectionItemDto['severity'],
      riskScore: item.riskScore ? Number(item.riskScore) : null,
      notes: item.notes,
    };
  }

  private toReviewDto(
    review: typeof inspectionReviews.$inferSelect,
    reviewerName: string,
  ): InspectionReviewDto {
    return {
      reviewerName,
      decision: review.decision as InspectionReviewDto['decision'],
      reason: review.reason,
      reviewedAt: review.reviewedAt.toISOString(),
    };
  }
}
