import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { and, eq, isNull, ilike, inArray, count, desc, sql } from 'drizzle-orm';
import type {
  AuthUser,
  InspectionTemplateDto,
  InspectionTemplateDetailDto,
  InspectionTemplateVersionDto,
  CreateTemplateInput,
  UpdateTemplateInput,
  PublishTemplateVersionInput,
  PaginatedResponse,
  TemplateStructure,
} from '@ssm/shared';
import { DRIZZLE } from '../database/drizzle.provider';
import type { DrizzleDB } from '../database/drizzle.provider';
import {
  inspectionTemplates,
  inspectionTemplateVersions,
  inspections,
} from '../database/schema';
import { escapeLike } from '../common/utils/query.util';
import { parsePaginationQuery, buildPaginationMeta } from '../common/dto/pagination.dto';

@Injectable()
export class InspectionTemplatesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
  ) {}

  // ─── LIST ───────────────────────────────────────────────
  async list(
    authUser: AuthUser,
    rawQuery: Record<string, unknown>,
  ): Promise<PaginatedResponse<InspectionTemplateDto>> {
    const query = parsePaginationQuery(rawQuery);
    const offset = (query.page - 1) * query.limit;

    const baseWhere = and(
      eq(inspectionTemplates.companyId, authUser.companyId),
      isNull(inspectionTemplates.deletedAt),
    );

    let searchWhere = baseWhere;
    if (query.search) {
      searchWhere = and(
        baseWhere,
        ilike(inspectionTemplates.name, `%${escapeLike(query.search)}%`),
      );
    }

    const category = rawQuery.category as string | undefined;
    if (category) {
      searchWhere = and(
        searchWhere,
        eq(inspectionTemplates.category, category),
      );
    }

    const [countResult, rows] = await Promise.all([
      this.db.select({ value: count() }).from(inspectionTemplates).where(searchWhere),
      this.db
        .select({
          template: inspectionTemplates,
          currentVersionNumber: inspectionTemplateVersions.versionNumber,
        })
        .from(inspectionTemplates)
        .leftJoin(
          inspectionTemplateVersions,
          eq(inspectionTemplates.currentVersionId, inspectionTemplateVersions.id),
        )
        .where(searchWhere)
        .orderBy(desc(inspectionTemplates.createdAt))
        .limit(query.limit)
        .offset(offset),
    ]);

    const total = countResult[0]?.value ?? 0;

    return {
      data: rows.map((r) => this.toTemplateDto(r.template, r.currentVersionNumber)),
      meta: buildPaginationMeta(total, query),
    };
  }

  // ─── CREATE ─────────────────────────────────────────────
  async create(authUser: AuthUser, input: CreateTemplateInput): Promise<InspectionTemplateDto> {
    const [inserted] = await this.db
      .insert(inspectionTemplates)
      .values({
        companyId: authUser.companyId,
        name: input.name,
        description: input.description ?? null,
        category: input.category ?? null,
        createdBy: authUser.userId,
      })
      .returning();

    return this.toTemplateDto(inserted!, null);
  }

  // ─── GET ONE (DETAIL) ──────────────────────────────────
  async findOne(authUser: AuthUser, uuid: string): Promise<InspectionTemplateDetailDto> {
    const template = await this.resolveTemplate(authUser, uuid);

    // Fetch all versions
    const versions = await this.db.query.inspectionTemplateVersions.findMany({
      where: and(
        eq(inspectionTemplateVersions.templateId, template.id),
        isNull(inspectionTemplateVersions.deletedAt),
      ),
      orderBy: (v, { desc: d }) => [d(v.versionNumber)],
    });

    // Find current version structure
    const currentVersion = template.currentVersionId
      ? versions.find((v) => v.id === template.currentVersionId)
      : null;

    return {
      ...this.toTemplateDto(template, currentVersion?.versionNumber ?? null),
      currentStructure: currentVersion
        ? (currentVersion.structure as TemplateStructure)
        : null,
      versions: versions.map((v) => this.toVersionDto(v)),
    };
  }

  // ─── UPDATE ─────────────────────────────────────────────
  async update(
    authUser: AuthUser,
    uuid: string,
    input: UpdateTemplateInput,
  ): Promise<InspectionTemplateDto> {
    const template = await this.resolveTemplate(authUser, uuid);

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    if (Object.keys(updateData).length === 0) {
      return this.toTemplateDto(template, null);
    }

    await this.db
      .update(inspectionTemplates)
      .set(updateData)
      .where(eq(inspectionTemplates.id, template.id));

    // Re-fetch for accurate DTO
    const updated = await this.resolveTemplate(authUser, uuid);
    const currentVersion = updated.currentVersionId
      ? await this.db.query.inspectionTemplateVersions.findFirst({
          where: eq(inspectionTemplateVersions.id, updated.currentVersionId),
        })
      : null;

    return this.toTemplateDto(updated, currentVersion?.versionNumber ?? null);
  }

  // ─── SOFT DELETE ────────────────────────────────────────
  async remove(authUser: AuthUser, uuid: string): Promise<void> {
    const template = await this.resolveTemplate(authUser, uuid);

    // Get all version IDs for this template
    const templateVersionIds = await this.db
      .select({ id: inspectionTemplateVersions.id })
      .from(inspectionTemplateVersions)
      .where(eq(inspectionTemplateVersions.templateId, template.id));

    const versionIds = templateVersionIds.map((v) => v.id);

    if (versionIds.length > 0) {
      // Check if any inspections reference these versions
      const refInspection = await this.db.query.inspections.findFirst({
        where: and(
          inArray(inspections.templateVersionId, versionIds),
          isNull(inspections.deletedAt),
        ),
        columns: { id: true },
      });

      if (refInspection) {
        throw new ConflictException(
          'Nu se poate șterge șablonul — există inspecții care îl folosesc',
        );
      }
    }

    await this.db
      .update(inspectionTemplates)
      .set({ deletedAt: new Date() })
      .where(eq(inspectionTemplates.id, template.id));
  }

  // ─── PUBLISH VERSION ────────────────────────────────────
  async publishVersion(
    authUser: AuthUser,
    uuid: string,
    input: PublishTemplateVersionInput,
  ): Promise<InspectionTemplateVersionDto> {
    const template = await this.resolveTemplate(authUser, uuid);

    const newVersionNumber = template.versionCount + 1;

    // Transaction: insert version + update template
    const result = await this.db.transaction(async (tx) => {
      const [version] = await tx
        .insert(inspectionTemplateVersions)
        .values({
          templateId: template.id,
          versionNumber: newVersionNumber,
          structure: input.structure,
          changeNotes: input.changeNotes ?? null,
          publishedAt: new Date(),
          publishedBy: authUser.userId,
        })
        .returning();

      await tx
        .update(inspectionTemplates)
        .set({
          currentVersionId: version!.id,
          versionCount: newVersionNumber,
        })
        .where(eq(inspectionTemplates.id, template.id));

      return version!;
    });

    return this.toVersionDto(result);
  }

  // ─── HELPERS ────────────────────────────────────────────

  async resolveTemplate(authUser: AuthUser, uuid: string) {
    const template = await this.db.query.inspectionTemplates.findFirst({
      where: and(
        eq(inspectionTemplates.uuid, uuid),
        eq(inspectionTemplates.companyId, authUser.companyId),
        isNull(inspectionTemplates.deletedAt),
      ),
    });
    if (!template) {
      throw new NotFoundException('Șablonul de inspecție nu a fost găsit');
    }
    return template;
  }

  private toTemplateDto(
    t: typeof inspectionTemplates.$inferSelect,
    currentVersionNumber: number | null,
  ): InspectionTemplateDto {
    return {
      uuid: t.uuid,
      name: t.name,
      description: t.description,
      category: t.category,
      isActive: t.isActive,
      versionCount: t.versionCount,
      currentVersionNumber,
      createdAt: t.createdAt.toISOString(),
    };
  }

  private toVersionDto(
    v: typeof inspectionTemplateVersions.$inferSelect,
  ): InspectionTemplateVersionDto {
    return {
      versionNumber: v.versionNumber,
      structure: v.structure as TemplateStructure,
      changeNotes: v.changeNotes,
      publishedAt: v.publishedAt?.toISOString() ?? null,
      createdAt: v.createdAt.toISOString(),
    };
  }
}
