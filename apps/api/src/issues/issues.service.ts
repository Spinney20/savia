import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { and, eq, isNull, inArray, count, desc, asc } from 'drizzle-orm';
import type {
  AuthUser,
  IssueReportDto,
  IssueDetailDto,
  IssueCommentDto,
  IssueAssignmentDto,
  IssueStatusHistoryDto,
  IssueCategoryDto,
  CreateIssueInput,
  UpdateIssueStatusInput,
  AssignIssueInput,
  IssueStatus,
  PaginatedResponse,
  Severity,
} from '@ssm/shared';
import { ISSUE_VALID_TRANSITIONS, isRoleAtLeast } from '@ssm/shared';
import { DRIZZLE } from '../database/drizzle.provider';
import type { DrizzleDB } from '../database/drizzle.provider';
import {
  issueReports,
  issueAssignments,
  issueComments,
  issueStatusHistory,
  issueCategories,
  sites,
  users,
  employees,
} from '../database/schema';
import { parsePaginationQuery, buildPaginationMeta } from '../common/dto/pagination.dto';
import { getUserSiteIds } from '../common/utils/site-filter.util';
import { IssueCommentsService } from './issue-comments.service';

@Injectable()
export class IssuesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly commentsService: IssueCommentsService,
  ) {}

  // ─── CATEGORIES ─────────────────────────────────────────
  async listCategories(authUser: AuthUser): Promise<IssueCategoryDto[]> {
    const rows = await this.db
      .select()
      .from(issueCategories)
      .where(
        and(
          eq(issueCategories.companyId, authUser.companyId),
          eq(issueCategories.isActive, true),
          isNull(issueCategories.deletedAt),
        ),
      )
      .orderBy(asc(issueCategories.sortOrder), asc(issueCategories.name));

    return rows.map((c) => ({
      uuid: c.uuid,
      name: c.name,
      description: c.description,
      icon: c.icon,
      color: c.color,
      sortOrder: c.sortOrder,
    }));
  }

  // ─── LIST ───────────────────────────────────────────────
  async list(
    authUser: AuthUser,
    rawQuery: Record<string, unknown>,
  ): Promise<PaginatedResponse<IssueReportDto>> {
    const query = parsePaginationQuery(rawQuery);
    const offset = (query.page - 1) * query.limit;

    const baseConditions = [
      eq(issueReports.companyId, authUser.companyId),
      isNull(issueReports.deletedAt),
    ];

    // Site-level isolation for roles below SEF_AGENTIE
    if (!isRoleAtLeast(authUser.role, 'SEF_AGENTIE')) {
      const siteIds = await getUserSiteIds(this.db, authUser.employeeId);
      if (siteIds.length === 0) {
        return { data: [], meta: buildPaginationMeta(0, query) };
      }
      baseConditions.push(inArray(issueReports.siteId, siteIds));
    }

    const siteUuid = rawQuery.siteUuid as string | undefined;
    if (siteUuid) {
      const site = await this.resolveSite(authUser, siteUuid);
      if (site) {
        baseConditions.push(eq(issueReports.siteId, site.id));
      }
    }

    const status = rawQuery.status as string | undefined;
    if (status) {
      baseConditions.push(eq(issueReports.status, status));
    }

    const severity = rawQuery.severity as string | undefined;
    if (severity) {
      baseConditions.push(eq(issueReports.severity, severity));
    }

    const whereClause = and(...baseConditions);

    const [countResult, rows] = await Promise.all([
      this.db.select({ value: count() }).from(issueReports).where(whereClause),
      this.db
        .select({
          issue: issueReports,
          siteUuid: sites.uuid,
          categoryName: issueCategories.name,
          reporterFirstName: employees.firstName,
          reporterLastName: employees.lastName,
        })
        .from(issueReports)
        .innerJoin(sites, eq(issueReports.siteId, sites.id))
        .innerJoin(users, eq(issueReports.reportedBy, users.id))
        .innerJoin(employees, eq(users.employeeId, employees.id))
        .leftJoin(issueCategories, eq(issueReports.categoryId, issueCategories.id))
        .where(whereClause)
        .orderBy(desc(issueReports.createdAt))
        .limit(query.limit)
        .offset(offset),
    ]);

    const total = countResult[0]?.value ?? 0;

    return {
      data: rows.map((r) =>
        this.toIssueDto(
          r.issue,
          r.siteUuid,
          r.categoryName,
          `${r.reporterLastName} ${r.reporterFirstName}`,
        ),
      ),
      meta: buildPaginationMeta(total, query),
    };
  }

  // ─── CREATE ─────────────────────────────────────────────
  async create(authUser: AuthUser, input: CreateIssueInput): Promise<IssueDetailDto> {
    const site = await this.resolveSite(authUser, input.siteUuid);
    if (!site) {
      throw new NotFoundException('Șantierul nu a fost găsit');
    }

    let categoryId: number | null = null;
    if (input.categoryUuid) {
      const category = await this.db.query.issueCategories.findFirst({
        where: and(
          eq(issueCategories.uuid, input.categoryUuid),
          eq(issueCategories.companyId, authUser.companyId),
          isNull(issueCategories.deletedAt),
        ),
        columns: { id: true },
      });
      if (!category) {
        throw new NotFoundException('Categoria nu a fost găsită');
      }
      categoryId = category.id;
    }

    const result = await this.db.transaction(async (tx) => {
      const [issue] = await tx
        .insert(issueReports)
        .values({
          companyId: authUser.companyId,
          siteId: site.id,
          categoryId,
          reportedBy: authUser.userId,
          title: input.title,
          description: input.description,
          severity: input.severity ?? 'MEDIUM',
          status: 'REPORTED',
          latitude: input.latitude?.toString() ?? null,
          longitude: input.longitude?.toString() ?? null,
        })
        .returning();

      // Initial status history entry (null → REPORTED)
      await tx.insert(issueStatusHistory).values({
        issueId: issue!.id,
        fromStatus: null,
        toStatus: 'REPORTED',
        changedBy: authUser.userId,
        reason: null,
      });

      return issue!;
    });

    return this.findOne(authUser, result.uuid);
  }

  // ─── GET ONE (DETAIL) ──────────────────────────────────
  async findOne(authUser: AuthUser, uuid: string): Promise<IssueDetailDto> {
    const row = await this.db
      .select({
        issue: issueReports,
        siteUuid: sites.uuid,
        categoryName: issueCategories.name,
        categoryUuid: issueCategories.uuid,
        reporterFirstName: employees.firstName,
        reporterLastName: employees.lastName,
      })
      .from(issueReports)
      .innerJoin(sites, eq(issueReports.siteId, sites.id))
      .innerJoin(users, eq(issueReports.reportedBy, users.id))
      .innerJoin(employees, eq(users.employeeId, employees.id))
      .leftJoin(issueCategories, eq(issueReports.categoryId, issueCategories.id))
      .where(
        and(
          eq(issueReports.uuid, uuid),
          eq(issueReports.companyId, authUser.companyId),
          isNull(issueReports.deletedAt),
        ),
      );

    if (row.length === 0) {
      throw new NotFoundException('Raportarea nu a fost găsită');
    }

    const r = row[0]!;
    const issueId = r.issue.id;

    // Fetch assignments, comments, status history in parallel
    const [assignmentRows, commentRows, historyRows] = await Promise.all([
      this.fetchAssignments(issueId),
      this.fetchComments(issueId),
      this.fetchStatusHistory(issueId),
    ]);

    const i = r.issue;

    return {
      uuid: i.uuid,
      siteUuid: r.siteUuid,
      categoryName: r.categoryName,
      categoryUuid: r.categoryUuid,
      reporterName: `${r.reporterLastName} ${r.reporterFirstName}`,
      title: i.title,
      description: i.description,
      severity: i.severity as Severity,
      status: i.status as IssueStatus,
      latitude: i.latitude ? Number(i.latitude) : null,
      longitude: i.longitude ? Number(i.longitude) : null,
      reportedAt: i.reportedAt.toISOString(),
      resolvedAt: i.resolvedAt?.toISOString() ?? null,
      deadline: i.deadline?.toISOString() ?? null,
      createdAt: i.createdAt.toISOString(),
      assignments: assignmentRows,
      comments: commentRows,
      statusHistory: historyRows,
    };
  }

  // ─── UPDATE STATUS ──────────────────────────────────────
  async updateStatus(
    authUser: AuthUser,
    uuid: string,
    input: UpdateIssueStatusInput,
  ): Promise<IssueDetailDto> {
    const issue = await this.resolveIssue(authUser, uuid);
    const currentStatus = issue.status as IssueStatus;
    const newStatus = input.status;

    const allowed = ISSUE_VALID_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Tranziția de la ${currentStatus} la ${newStatus} nu este permisă`,
      );
    }

    await this.db.transaction(async (tx) => {
      // Build the update set for timestamp fields
      const updateSet: Record<string, unknown> = { status: newStatus };

      if (newStatus === 'RESOLVED') {
        updateSet.resolvedAt = new Date();
      } else if (newStatus === 'VERIFIED') {
        updateSet.verifiedAt = new Date();
      } else if (newStatus === 'CLOSED') {
        updateSet.closedAt = new Date();
      } else if (newStatus === 'REOPENED') {
        updateSet.resolvedAt = null;
        updateSet.verifiedAt = null;
        updateSet.closedAt = null;
      }

      await tx
        .update(issueReports)
        .set(updateSet)
        .where(eq(issueReports.id, issue.id));

      // Insert status history record
      await tx.insert(issueStatusHistory).values({
        issueId: issue.id,
        fromStatus: currentStatus,
        toStatus: newStatus,
        changedBy: authUser.userId,
        reason: input.reason ?? null,
      });

      // System comment
      await this.commentsService.createSystemComment(
        tx,
        issue.id,
        authUser.userId,
        `Status schimbat: ${currentStatus} → ${newStatus}${input.reason ? ` — ${input.reason}` : ''}`,
      );
    });

    return this.findOne(authUser, uuid);
  }

  // ─── ASSIGN ─────────────────────────────────────────────
  async assign(
    authUser: AuthUser,
    uuid: string,
    input: AssignIssueInput,
  ): Promise<IssueDetailDto> {
    const issue = await this.resolveIssue(authUser, uuid);

    // Resolve assignee (must be in same company, active)
    const assignee = await this.db
      .select({
        user: users,
        firstName: employees.firstName,
        lastName: employees.lastName,
      })
      .from(users)
      .innerJoin(employees, eq(users.employeeId, employees.id))
      .where(
        and(
          eq(users.uuid, input.assignedToUuid),
          eq(users.companyId, authUser.companyId),
          eq(users.isActive, true),
          isNull(users.deletedAt),
        ),
      );

    if (assignee.length === 0) {
      throw new NotFoundException('Utilizatorul de atribuit nu a fost găsit');
    }

    const target = assignee[0]!;
    const assigneeName = `${target.lastName} ${target.firstName}`;

    await this.db.transaction(async (tx) => {
      // Deactivate previous active assignment
      await tx
        .update(issueAssignments)
        .set({ isActive: false })
        .where(
          and(
            eq(issueAssignments.issueId, issue.id),
            eq(issueAssignments.isActive, true),
          ),
        );

      // Insert new assignment
      await tx.insert(issueAssignments).values({
        issueId: issue.id,
        assignedTo: target.user.id,
        assignedBy: authUser.userId,
        deadline: input.deadline ? new Date(input.deadline) : null,
        notes: input.notes ?? null,
        isActive: true,
      });

      // Auto-transition REPORTED → ASSIGNED
      if (issue.status === 'REPORTED') {
        await tx
          .update(issueReports)
          .set({ status: 'ASSIGNED' })
          .where(eq(issueReports.id, issue.id));

        await tx.insert(issueStatusHistory).values({
          issueId: issue.id,
          fromStatus: 'REPORTED',
          toStatus: 'ASSIGNED',
          changedBy: authUser.userId,
          reason: 'Atribuire automată',
        });
      }

      // System comment
      await this.commentsService.createSystemComment(
        tx,
        issue.id,
        authUser.userId,
        `Atribuit lui ${assigneeName}`,
      );
    });

    return this.findOne(authUser, uuid);
  }

  // ─── SOFT DELETE ────────────────────────────────────────
  async remove(authUser: AuthUser, uuid: string): Promise<void> {
    const issue = await this.resolveIssue(authUser, uuid);

    await this.db
      .update(issueReports)
      .set({ deletedAt: new Date() })
      .where(eq(issueReports.id, issue.id));
  }

  // ─── HELPERS ────────────────────────────────────────────

  private async resolveSite(authUser: AuthUser, siteUuid: string) {
    return this.db.query.sites.findFirst({
      where: and(
        eq(sites.uuid, siteUuid),
        eq(sites.companyId, authUser.companyId),
        isNull(sites.deletedAt),
      ),
      columns: { id: true },
    });
  }

  private async resolveIssue(authUser: AuthUser, uuid: string) {
    const issue = await this.db.query.issueReports.findFirst({
      where: and(
        eq(issueReports.uuid, uuid),
        eq(issueReports.companyId, authUser.companyId),
        isNull(issueReports.deletedAt),
      ),
    });
    if (!issue) {
      throw new NotFoundException('Raportarea nu a fost găsită');
    }
    return issue;
  }

  private async fetchAssignments(issueId: number): Promise<IssueAssignmentDto[]> {
    const rows = await this.db
      .select({
        assignment: issueAssignments,
        assignedToFirstName: employees.firstName,
        assignedToLastName: employees.lastName,
      })
      .from(issueAssignments)
      .innerJoin(users, eq(issueAssignments.assignedTo, users.id))
      .innerJoin(employees, eq(users.employeeId, employees.id))
      .where(eq(issueAssignments.issueId, issueId))
      .orderBy(desc(issueAssignments.assignedAt));

    // For assignedByName we need a second lookup — batch it
    const assignedByIds = [...new Set(rows.map((r) => r.assignment.assignedBy))];
    const assignerMap = await this.buildUserNameMap(assignedByIds);

    return rows.map((r) => ({
      assignedToName: `${r.assignedToLastName} ${r.assignedToFirstName}`,
      assignedByName: assignerMap.get(r.assignment.assignedBy) ?? 'Necunoscut',
      deadline: r.assignment.deadline?.toISOString() ?? null,
      notes: r.assignment.notes,
      isActive: r.assignment.isActive,
      assignedAt: r.assignment.assignedAt.toISOString(),
    }));
  }

  private async fetchComments(issueId: number): Promise<IssueCommentDto[]> {
    const rows = await this.db
      .select({
        comment: issueComments,
        authorFirstName: employees.firstName,
        authorLastName: employees.lastName,
      })
      .from(issueComments)
      .innerJoin(users, eq(issueComments.authorId, users.id))
      .innerJoin(employees, eq(users.employeeId, employees.id))
      .where(
        and(
          eq(issueComments.issueId, issueId),
          isNull(issueComments.deletedAt),
        ),
      )
      .orderBy(desc(issueComments.createdAt));

    return rows.map((r) => ({
      authorName: `${r.authorLastName} ${r.authorFirstName}`,
      content: r.comment.content,
      isSystem: r.comment.isSystem,
      createdAt: r.comment.createdAt.toISOString(),
    }));
  }

  private async fetchStatusHistory(issueId: number): Promise<IssueStatusHistoryDto[]> {
    const rows = await this.db
      .select({
        history: issueStatusHistory,
        changedByFirstName: employees.firstName,
        changedByLastName: employees.lastName,
      })
      .from(issueStatusHistory)
      .innerJoin(users, eq(issueStatusHistory.changedBy, users.id))
      .innerJoin(employees, eq(users.employeeId, employees.id))
      .where(eq(issueStatusHistory.issueId, issueId))
      .orderBy(desc(issueStatusHistory.changedAt));

    return rows.map((r) => ({
      fromStatus: (r.history.fromStatus as IssueStatus) ?? null,
      toStatus: r.history.toStatus as IssueStatus,
      changedByName: `${r.changedByLastName} ${r.changedByFirstName}`,
      reason: r.history.reason,
      changedAt: r.history.changedAt.toISOString(),
    }));
  }

  private async buildUserNameMap(userIds: number[]): Promise<Map<number, string>> {
    if (userIds.length === 0) return new Map();

    const { inArray } = await import('drizzle-orm');
    const rows = await this.db
      .select({
        userId: users.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
      })
      .from(users)
      .innerJoin(employees, eq(users.employeeId, employees.id))
      .where(inArray(users.id, userIds));

    return new Map(rows.map((r) => [r.userId, `${r.lastName} ${r.firstName}`]));
  }

  private toIssueDto(
    i: typeof issueReports.$inferSelect,
    siteUuid: string,
    categoryName: string | null,
    reporterName: string,
  ): IssueReportDto {
    return {
      uuid: i.uuid,
      siteUuid,
      categoryName,
      reporterName,
      title: i.title,
      description: i.description,
      severity: i.severity as Severity,
      status: i.status as IssueStatus,
      latitude: i.latitude ? Number(i.latitude) : null,
      longitude: i.longitude ? Number(i.longitude) : null,
      reportedAt: i.reportedAt.toISOString(),
      resolvedAt: i.resolvedAt?.toISOString() ?? null,
      deadline: i.deadline?.toISOString() ?? null,
      createdAt: i.createdAt.toISOString(),
    };
  }
}
