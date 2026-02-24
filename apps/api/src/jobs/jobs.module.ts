import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from '../notifications/notifications.module';
import { PdfModule } from '../pdf/pdf.module';
import { CheckExpiredDocumentsJob } from './check-expired-documents.job';
import { CheckApproachingDeadlinesJob } from './check-approaching-deadlines.job';
import { CleanupRefreshTokensJob } from './cleanup-refresh-tokens.job';
import { CleanupOrphanAttachmentsJob } from './cleanup-orphan-attachments.job';
import { GeneratePendingPdfsJob } from './generate-pending-pdfs.job';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    NotificationsModule,
    PdfModule,
  ],
  providers: [
    CheckExpiredDocumentsJob,
    CheckApproachingDeadlinesJob,
    CleanupRefreshTokensJob,
    CleanupOrphanAttachmentsJob,
    GeneratePendingPdfsJob,
  ],
})
export class JobsModule {}
