import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { and, eq, isNull, lt } from 'drizzle-orm';
import { DRIZZLE } from '../database/drizzle.provider';
import type { DrizzleDB } from '../database/drizzle.provider';
import { attachments } from '../database/schema';
import { STORAGE_SERVICE, StorageService } from '../storage/storage.interface';

@Injectable()
export class CleanupOrphanAttachmentsJob {
  private readonly logger = new Logger(CleanupOrphanAttachmentsJob.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  @Cron('30 3 * * *', { name: 'cleanup-orphan-attachments' })
  async handleCron(): Promise<void> {
    try {
      this.logger.log('Curățare atașamente orfane...');

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const orphans = await this.db.query.attachments.findMany({
        where: and(
          isNull(attachments.inspectionId),
          isNull(attachments.inspectionItemId),
          isNull(attachments.trainingId),
          isNull(attachments.trainingMaterialId),
          isNull(attachments.issueReportId),
          isNull(attachments.issueCommentId),
          isNull(attachments.employeeDocumentId),
          isNull(attachments.deletedAt),
          lt(attachments.createdAt, twentyFourHoursAgo),
        ),
      });

      this.logger.log(`Găsite ${orphans.length} atașamente orfane`);

      for (const orphan of orphans) {
        try {
          await this.storage.delete(orphan.fileUrl);
        } catch (error) {
          this.logger.error(`Eroare la ștergerea fișierului ${orphan.uuid}: ${error}`);
        }

        await this.db.update(attachments)
          .set({ deletedAt: new Date() })
          .where(eq(attachments.id, orphan.id));
      }

      this.logger.log('Curățare atașamente orfane finalizată');
    } catch (error) {
      this.logger.error(`Eroare la curățarea atașamentelor orfane: ${error}`);
    }
  }
}
