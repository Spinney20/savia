import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { and, eq, isNull, lte, gte } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/drizzle.provider';
import type { DrizzleDB } from '../database/drizzle.provider';
import { employeeDocuments, employees, users } from '../database/schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CheckExpiredDocumentsJob {
  private readonly logger = new Logger(CheckExpiredDocumentsJob.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron('0 8 * * *', { name: 'check-expired-documents' })
  async handleCron(): Promise<void> {
    try {
      this.logger.log('Verificare documente care expiră...');

      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + 30); // 30 days ahead

      const today = new Date().toISOString().split('T')[0]!;
      const warningDateStr = warningDate.toISOString().split('T')[0]!;

      const docs = await this.db
        .select({
          doc: employeeDocuments,
          employeeFirstName: employees.firstName,
          employeeLastName: employees.lastName,
        })
        .from(employeeDocuments)
        .innerJoin(employees, eq(employeeDocuments.employeeId, employees.id))
        .where(
          and(
            isNull(employeeDocuments.deletedAt),
            eq(employeeDocuments.expiryNotified, false),
            sql`${employeeDocuments.expiryDate} IS NOT NULL`,
            sql`${employeeDocuments.expiryDate} <= ${warningDateStr}`,
            sql`${employeeDocuments.expiryDate} >= ${today}`,
          ),
        );

      this.logger.log(`Găsite ${docs.length} documente care expiră`);

      for (const row of docs) {
        try {
          const user = await this.db.query.users.findFirst({
            where: and(
              eq(users.employeeId, row.doc.employeeId),
              isNull(users.deletedAt),
            ),
          });

          if (user) {
            await this.notificationsService.create({
              companyId: row.doc.companyId,
              recipientId: user.id,
              title: 'Document care expiră',
              body: `Documentul "${row.doc.title}" al angajatului ${row.employeeLastName} ${row.employeeFirstName} expiră la ${row.doc.expiryDate}.`,
              notificationType: 'DOCUMENT_EXPIRY',
              sendEmail: true,
            });
          }

          await this.db.update(employeeDocuments)
            .set({ expiryNotified: true })
            .where(eq(employeeDocuments.id, row.doc.id));
        } catch (error) {
          this.logger.error(`Eroare la notificarea documentului ${row.doc.id}: ${error}`);
        }
      }

      this.logger.log('Verificare documente finalizată');
    } catch (error) {
      this.logger.error(`Eroare la verificarea documentelor: ${error}`);
    }
  }
}
