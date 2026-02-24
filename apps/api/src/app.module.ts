import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { EmailModule } from './email/email.module';
import { EmployeesModule } from './employees/employees.module';
import { HealthModule } from './health/health.module';
import { InspectionsModule } from './inspections/inspections.module';
import { IssuesModule } from './issues/issues.module';
import { JobsModule } from './jobs/jobs.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PdfModule } from './pdf/pdf.module';
import { StorageModule } from './storage/storage.module';
import { TrainingsModule } from './trainings/trainings.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    DatabaseModule,
    StorageModule,
    EmailModule,
    AuthModule,
    HealthModule,
    EmployeesModule,
    InspectionsModule,
    TrainingsModule,
    IssuesModule,
    UploadModule,
    NotificationsModule,
    PdfModule,
    JobsModule,
  ],
})
export class AppModule {}
