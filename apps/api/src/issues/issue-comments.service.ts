import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, isNull, desc } from 'drizzle-orm';
import type { AuthUser, IssueCommentDto, CreateIssueCommentInput } from '@ssm/shared';
import { DRIZZLE } from '../database/drizzle.provider';
import type { DrizzleDB } from '../database/drizzle.provider';
import {
  issueReports,
  issueComments,
  users,
  employees,
} from '../database/schema';

@Injectable()
export class IssueCommentsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
  ) {}

  // ─── LIST COMMENTS ──────────────────────────────────────
  async list(authUser: AuthUser, issueUuid: string): Promise<IssueCommentDto[]> {
    const issue = await this.resolveIssue(authUser, issueUuid);

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
          eq(issueComments.issueId, issue.id),
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

  // ─── CREATE COMMENT ─────────────────────────────────────
  async create(
    authUser: AuthUser,
    issueUuid: string,
    input: CreateIssueCommentInput,
  ): Promise<IssueCommentDto> {
    const issue = await this.resolveIssue(authUser, issueUuid);

    const [comment] = await this.db
      .insert(issueComments)
      .values({
        issueId: issue.id,
        authorId: authUser.userId,
        content: input.content,
        isSystem: false,
      })
      .returning();

    const emp = await this.db.query.employees.findFirst({
      where: eq(employees.id, authUser.employeeId),
      columns: { firstName: true, lastName: true },
    });

    return {
      authorName: emp ? `${emp.lastName} ${emp.firstName}` : 'Necunoscut',
      content: comment!.content,
      isSystem: comment!.isSystem,
      createdAt: comment!.createdAt.toISOString(),
    };
  }

  // ─── SYSTEM COMMENT (used by IssuesService in transactions) ──
  async createSystemComment(
    tx: Parameters<Parameters<DrizzleDB['transaction']>[0]>[0],
    issueId: number,
    userId: number,
    content: string,
  ): Promise<void> {
    await tx.insert(issueComments).values({
      issueId,
      authorId: userId,
      content,
      isSystem: true,
    });
  }

  // ─── HELPERS ────────────────────────────────────────────

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
}
