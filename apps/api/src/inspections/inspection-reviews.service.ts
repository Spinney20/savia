import {
  Inject,
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { and, eq, isNull, desc } from 'drizzle-orm';
import type {
  AuthUser,
  InspectionReviewDto,
  ReviewInspectionInput,
  InspectionDetailDto,
} from '@ssm/shared';
import { DRIZZLE } from '../database/drizzle.provider';
import type { DrizzleDB } from '../database/drizzle.provider';
import {
  inspections,
  inspectionReviews,
  users,
  employees,
} from '../database/schema';
import { InspectionsService } from './inspections.service';

@Injectable()
export class InspectionReviewsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly inspectionsService: InspectionsService,
  ) {}

  // ─── CREATE REVIEW ─────────────────────────────────────
  async createReview(
    authUser: AuthUser,
    inspectionUuid: string,
    input: ReviewInspectionInput,
  ): Promise<InspectionDetailDto> {
    const inspection = await this.inspectionsService.resolveInspection(
      authUser,
      inspectionUuid,
    );

    // Must be SUBMITTED
    if (inspection.status !== 'SUBMITTED') {
      throw new BadRequestException(
        'Doar inspecțiile cu status SUBMITTED pot fi evaluate',
      );
    }

    // Self-review prevention
    if (inspection.inspectorId === authUser.userId) {
      throw new ForbiddenException(
        'Nu puteți evalua propria inspecție',
      );
    }

    // Map decision → new inspection status
    const statusMap: Record<string, string> = {
      APPROVED: 'APPROVED',
      REJECTED: 'REJECTED',
      NEEDS_REVISION: 'NEEDS_REVISION',
    };
    const newStatus = statusMap[input.decision]!;

    await this.db.transaction(async (tx) => {
      // Insert review
      await tx.insert(inspectionReviews).values({
        inspectionId: inspection.id,
        reviewerId: authUser.userId,
        decision: input.decision,
        reason: input.reason ?? null,
        reviewedAt: new Date(),
      });

      // Update inspection status
      const updateData: Record<string, unknown> = {
        status: newStatus,
      };
      if (input.decision === 'APPROVED') {
        updateData.completedAt = new Date();
      }
      await tx
        .update(inspections)
        .set(updateData)
        .where(eq(inspections.id, inspection.id));
    });

    return this.inspectionsService.findOne(authUser, inspectionUuid);
  }

  // ─── LIST REVIEWS ──────────────────────────────────────
  async listReviews(
    authUser: AuthUser,
    inspectionUuid: string,
  ): Promise<InspectionReviewDto[]> {
    const inspection = await this.inspectionsService.resolveInspection(
      authUser,
      inspectionUuid,
    );

    const rows = await this.db
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
          eq(inspectionReviews.inspectionId, inspection.id),
          isNull(inspectionReviews.deletedAt),
        ),
      )
      .orderBy(desc(inspectionReviews.reviewedAt));

    return rows.map((r) => ({
      reviewerName: `${r.reviewerLastName} ${r.reviewerFirstName}`,
      decision: r.review.decision as InspectionReviewDto['decision'],
      reason: r.review.reason,
      reviewedAt: r.review.reviewedAt.toISOString(),
    }));
  }
}
