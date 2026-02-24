import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, isNull, count, desc } from 'drizzle-orm';
import type { AuthUser } from '@ssm/shared';
import { DRIZZLE } from '../database/drizzle.provider';
import type { DrizzleDB } from '../database/drizzle.provider';
import { notifications, users } from '../database/schema';
import { EmailService } from '../email/email.service';
import { parsePaginationQuery, buildPaginationMeta } from '../common/dto/pagination.dto';
import type { PaginatedResponse } from '@ssm/shared';

export interface CreateNotificationInput {
  companyId: number;
  recipientId: number;
  title: string;
  body: string;
  notificationType: string;
  channel?: string;
  referenceType?: string;
  referenceId?: number;
  sendEmail?: boolean;
}

export interface NotificationDto {
  uuid: string;
  title: string;
  body: string;
  notificationType: string;
  readAt: string | null;
  referenceType: string | null;
  createdAt: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly emailService: EmailService,
  ) {}

  async create(input: CreateNotificationInput): Promise<void> {
    await this.db.insert(notifications).values({
      companyId: input.companyId,
      recipientId: input.recipientId,
      title: input.title,
      body: input.body,
      notificationType: input.notificationType,
      channel: input.channel ?? 'IN_APP',
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
    });

    if (input.sendEmail) {
      const user = await this.db.query.users.findFirst({
        where: eq(users.id, input.recipientId),
        columns: { email: true },
      });

      if (user) {
        await this.emailService.send({
          to: user.email,
          subject: input.title,
          text: input.body,
        });
      }
    }
  }

  async list(
    authUser: AuthUser,
    rawQuery: Record<string, unknown>,
  ): Promise<PaginatedResponse<NotificationDto>> {
    const query = parsePaginationQuery(rawQuery);
    const offset = (query.page - 1) * query.limit;

    const whereClause = and(
      eq(notifications.recipientId, authUser.userId),
      eq(notifications.companyId, authUser.companyId),
    );

    const [countResult, rows] = await Promise.all([
      this.db.select({ value: count() }).from(notifications).where(whereClause),
      this.db.query.notifications.findMany({
        where: whereClause,
        orderBy: [desc(notifications.createdAt)],
        limit: query.limit,
        offset,
      }),
    ]);

    const total = countResult[0]?.value ?? 0;

    return {
      data: rows.map((n) => ({
        uuid: n.uuid,
        title: n.title,
        body: n.body,
        notificationType: n.notificationType,
        readAt: n.readAt?.toISOString() ?? null,
        referenceType: n.referenceType,
        createdAt: n.createdAt.toISOString(),
      })),
      meta: buildPaginationMeta(total, query),
    };
  }

  async markAsRead(authUser: AuthUser, uuid: string): Promise<void> {
    const notification = await this.db.query.notifications.findFirst({
      where: and(
        eq(notifications.uuid, uuid),
        eq(notifications.recipientId, authUser.userId),
      ),
    });

    if (!notification) {
      throw new NotFoundException('Notificarea nu a fost găsită');
    }

    if (!notification.readAt) {
      await this.db.update(notifications)
        .set({ readAt: new Date() })
        .where(eq(notifications.id, notification.id));
    }
  }

  async getUnreadCount(authUser: AuthUser): Promise<number> {
    const result = await this.db
      .select({ value: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientId, authUser.userId),
          eq(notifications.companyId, authUser.companyId),
          isNull(notifications.readAt),
        ),
      );

    return result[0]?.value ?? 0;
  }
}
