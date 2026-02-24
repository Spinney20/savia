import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { and, eq, isNull, inArray } from 'drizzle-orm';
import { DRIZZLE } from '../database/drizzle.provider';
import type { DrizzleDB } from '../database/drizzle.provider';
import { inspections, trainings } from '../database/schema';
import { PdfService } from '../pdf/pdf.service';

@Injectable()
export class GeneratePendingPdfsJob {
  private readonly logger = new Logger(GeneratePendingPdfsJob.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly pdfService: PdfService,
  ) {}

  @Cron('0 2 * * *', { name: 'generate-pending-pdfs' })
  async handleCron(): Promise<void> {
    try {
      this.logger.log('Generare PDF-uri în așteptare...');

      await this.generateInspectionPdfs();
      await this.generateTrainingPdfs();

      this.logger.log('Generare PDF-uri finalizată');
    } catch (error) {
      this.logger.error(`Eroare la generarea PDF-urilor: ${error}`);
    }
  }

  private async generateInspectionPdfs(): Promise<void> {
    // Find APPROVED or CLOSED inspections without PDF
    const pending = await this.db.query.inspections.findMany({
      where: and(
        isNull(inspections.deletedAt),
        isNull(inspections.pdfUrl),
        inArray(inspections.status, ['APPROVED', 'CLOSED']),
      ),
    });

    this.logger.log(`Inspecții fără PDF: ${pending.length}`);

    for (const inspection of pending) {
      try {
        await this.pdfService.generateInspectionPdf(inspection.id);
      } catch (error) {
        this.logger.error(
          `Eroare la generarea PDF pentru inspecția ${inspection.uuid}: ${error}`,
        );
      }
    }
  }

  private async generateTrainingPdfs(): Promise<void> {
    // Find all trainings without PDF
    const pending = await this.db.query.trainings.findMany({
      where: and(
        isNull(trainings.deletedAt),
        isNull(trainings.pdfUrl),
      ),
    });

    this.logger.log(`Instructaje fără PDF: ${pending.length}`);

    for (const training of pending) {
      try {
        await this.pdfService.generateTrainingPdf(training.id);
      } catch (error) {
        this.logger.error(
          `Eroare la generarea PDF pentru instructajul ${training.uuid}: ${error}`,
        );
      }
    }
  }
}
