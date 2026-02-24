import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { and, eq, isNull, lte, gte, notInArray } from 'drizzle-orm';
import { DRIZZLE } from '../database/drizzle.provider';
import type { DrizzleDB } from '../database/drizzle.provider';
import { issueReports } from '../database/schema';
import { NotificationsService } from '../notifications/notifications.service';

const CLOSED_STATUSES = ['RESOLVED', 'VERIFIED', 'CLOSED'];

@Injectable()
export class CheckApproachingDeadlinesJob {
  private readonly logger = new Logger(CheckApproachingDeadlinesJob.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron('0 9 * * *', { name: 'check-approaching-deadlines' })
  async handleCron(): Promise<void> {
    try {
      this.logger.log('Verificare termene limită care se apropie...');

      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + 3); // 3 days ahead

      const issues = await this.db.query.issueReports.findMany({
        where: and(
          isNull(issueReports.deletedAt),
          eq(issueReports.deadlineNotified, false),
          isNull(issueReports.resolvedAt),
          lte(issueReports.deadline, warningDate),
          gte(issueReports.deadline, new Date()),
        ),
      });

      const activeIssues = issues.filter((i) => !CLOSED_STATUSES.includes(i.status));

      this.logger.log(`Găsite ${activeIssues.length} probleme cu termen limită aproape`);

      for (const issue of activeIssues) {
        try {
          await this.notificationsService.create({
            companyId: issue.companyId,
            recipientId: issue.reportedBy,
            title: 'Termen limită aproape',
            body: `Problema "${issue.title}" are termenul limită la ${issue.deadline?.toLocaleDateString('ro-RO')}.`,
            notificationType: 'ISSUE_DEADLINE',
            referenceType: 'issue_report',
            referenceId: issue.id,
            sendEmail: true,
          });

          await this.db.update(issueReports)
            .set({ deadlineNotified: true })
            .where(eq(issueReports.id, issue.id));
        } catch (error) {
          this.logger.error(`Eroare la notificarea problemei ${issue.id}: ${error}`);
        }
      }

      this.logger.log('Verificare termene limită finalizată');
    } catch (error) {
      this.logger.error(`Eroare la verificarea termenelor limită: ${error}`);
    }
  }
}
