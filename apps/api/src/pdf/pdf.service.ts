import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
// pdfmake CJS: Printer class is on .default
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PdfPrinter = require('pdfmake/js/Printer').default;
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE } from '../database/drizzle.provider';
import type { DrizzleDB } from '../database/drizzle.provider';
import {
  inspections,
  inspectionItems,
  inspectionTemplates,
  inspectionTemplateVersions,
  sites,
  users,
  employees,
  companies,
  trainings,
  trainingParticipants,
} from '../database/schema';
import { STORAGE_SERVICE, StorageService } from '../storage/storage.interface';
import { buildInspectionReportDoc } from './templates/inspection-report.template';
import { buildTrainingRecordDoc } from './templates/training-record.template';
import type { InspectionPdfData, InspectionItemPdfData, TrainingPdfData } from './pdf.types';

import * as path from 'node:path';

const FONT_DIR = path.join(
  path.dirname(require.resolve('pdfmake/package.json')),
  'build', 'fonts', 'Roboto',
);

const fonts = {
  Roboto: {
    normal: path.join(FONT_DIR, 'Roboto-Regular.ttf'),
    bold: path.join(FONT_DIR, 'Roboto-Medium.ttf'),
    italics: path.join(FONT_DIR, 'Roboto-Italic.ttf'),
    bolditalics: path.join(FONT_DIR, 'Roboto-MediumItalic.ttf'),
  },
};

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  async generateInspectionPdf(inspectionId: number): Promise<string> {
    // Fetch inspection with joins
    const row = await this.db
      .select({
        inspection: inspections,
        siteName: sites.name,
        siteAddress: sites.address,
        templateName: inspectionTemplates.name,
        inspectorFirstName: employees.firstName,
        inspectorLastName: employees.lastName,
        companyName: companies.name,
        companyAddress: companies.address,
        companyCui: companies.cui,
      })
      .from(inspections)
      .innerJoin(sites, eq(inspections.siteId, sites.id))
      .innerJoin(inspectionTemplateVersions, eq(inspections.templateVersionId, inspectionTemplateVersions.id))
      .innerJoin(inspectionTemplates, eq(inspectionTemplateVersions.templateId, inspectionTemplates.id))
      .innerJoin(users, eq(inspections.inspectorId, users.id))
      .innerJoin(employees, eq(users.employeeId, employees.id))
      .innerJoin(companies, eq(inspections.companyId, companies.id))
      .where(eq(inspections.id, inspectionId));

    if (row.length === 0) {
      throw new NotFoundException('Inspecția nu a fost găsită');
    }

    const r = row[0]!;

    // Fetch items
    const items = await this.db.query.inspectionItems.findMany({
      where: and(
        eq(inspectionItems.inspectionId, inspectionId),
        isNull(inspectionItems.deletedAt),
      ),
    });

    const pdfData: InspectionPdfData = {
      companyName: r.companyName,
      companyAddress: r.companyAddress,
      companyCui: r.companyCui,
      siteName: r.siteName,
      siteAddress: r.siteAddress,
      templateName: r.templateName,
      inspectorName: `${r.inspectorLastName} ${r.inspectorFirstName}`,
      status: r.inspection.status,
      riskScore: r.inspection.riskScore ? Number(r.inspection.riskScore) : null,
      totalItems: r.inspection.totalItems,
      compliantItems: r.inspection.compliantItems,
      nonCompliantItems: r.inspection.nonCompliantItems,
      startedAt: r.inspection.startedAt?.toISOString() ?? null,
      completedAt: r.inspection.completedAt?.toISOString() ?? null,
      submittedAt: r.inspection.submittedAt?.toISOString() ?? null,
      notes: r.inspection.notes,
      items: items.map((i): InspectionItemPdfData => ({
        sectionId: i.sectionId,
        questionId: i.questionId,
        answerType: i.answerType,
        answerBool: i.answerBool,
        answerText: i.answerText,
        answerNumber: i.answerNumber ? Number(i.answerNumber) : null,
        isCompliant: i.isCompliant,
        severity: i.severity,
        notes: i.notes,
      })),
    };

    const docDef = buildInspectionReportDoc(pdfData);
    const buffer = await this.generatePdfBuffer(docDef);

    const now = new Date();
    const key = `${r.inspection.companyId}/pdfs/inspections/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${r.inspection.uuid}.pdf`;

    await this.storage.upload({ key, buffer, mimeType: 'application/pdf' });

    // Update inspection with PDF URL
    await this.db.update(inspections)
      .set({ pdfUrl: key, pdfGeneratedAt: now })
      .where(eq(inspections.id, inspectionId));

    this.logger.log(`PDF inspecție generat: ${r.inspection.uuid}`);
    return key;
  }

  async generateTrainingPdf(trainingId: number): Promise<string> {
    const row = await this.db
      .select({
        training: trainings,
        siteName: sites.name,
        siteAddress: sites.address,
        conductorFirstName: employees.firstName,
        conductorLastName: employees.lastName,
        companyName: companies.name,
        companyAddress: companies.address,
        companyCui: companies.cui,
      })
      .from(trainings)
      .innerJoin(sites, eq(trainings.siteId, sites.id))
      .innerJoin(users, eq(trainings.conductorId, users.id))
      .innerJoin(employees, eq(users.employeeId, employees.id))
      .innerJoin(companies, eq(trainings.companyId, companies.id))
      .where(eq(trainings.id, trainingId));

    if (row.length === 0) {
      throw new NotFoundException('Instructajul nu a fost găsit');
    }

    const r = row[0]!;

    // Fetch participants with employee names
    const participants = await this.db
      .select({
        participant: trainingParticipants,
        firstName: employees.firstName,
        lastName: employees.lastName,
      })
      .from(trainingParticipants)
      .innerJoin(employees, eq(trainingParticipants.employeeId, employees.id))
      .where(
        and(
          eq(trainingParticipants.trainingId, trainingId),
          isNull(trainingParticipants.deletedAt),
        ),
      );

    const pdfData: TrainingPdfData = {
      companyName: r.companyName,
      companyAddress: r.companyAddress,
      companyCui: r.companyCui,
      siteName: r.siteName,
      siteAddress: r.siteAddress,
      conductorName: `${r.conductorLastName} ${r.conductorFirstName}`,
      trainingType: r.training.trainingType,
      title: r.training.title,
      description: r.training.description,
      conductedAt: r.training.conductedAt.toISOString(),
      durationMinutes: r.training.durationMinutes,
      participants: participants.map((p) => ({
        employeeName: `${p.lastName} ${p.firstName}`,
        confirmationMethod: p.participant.confirmationMethod,
        confirmedAt: p.participant.confirmedAt?.toISOString() ?? null,
      })),
    };

    const docDef = buildTrainingRecordDoc(pdfData);
    const buffer = await this.generatePdfBuffer(docDef);

    const now = new Date();
    const key = `${r.training.companyId}/pdfs/trainings/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${r.training.uuid}.pdf`;

    await this.storage.upload({ key, buffer, mimeType: 'application/pdf' });

    await this.db.update(trainings)
      .set({ pdfUrl: key, pdfGeneratedAt: now })
      .where(eq(trainings.id, trainingId));

    this.logger.log(`PDF instructaj generat: ${r.training.uuid}`);
    return key;
  }

  private generatePdfBuffer(docDef: TDocumentDefinitions): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const printer = new PdfPrinter(fonts);
      const doc = printer.createPdfKitDocument(docDef);
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });
  }
}
