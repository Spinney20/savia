import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import type { TrainingPdfData } from '../pdf.types';
import { companyHeader, pageFooter, defaultStyles } from './base.template';

const TRAINING_TYPE_LABELS: Record<string, string> = {
  ANGAJARE: 'La angajare',
  PERIODIC: 'Periodic',
  SCHIMBARE_LOC_MUNCA: 'Schimbare loc de muncă',
  REVENIRE_MEDICAL: 'Revenire după concediu medical',
  SPECIAL: 'Special',
  ZILNIC: 'Zilnic',
};

const CONFIRMATION_LABELS: Record<string, string> = {
  PENDING: 'În așteptare',
  MANUAL: 'Manual',
  SELF_CONFIRMED: 'Auto-confirmat',
  ABSENT: 'Absent',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function buildTrainingRecordDoc(data: TrainingPdfData): TDocumentDefinitions {
  const content: any[] = [
    ...companyHeader(data.companyName, data.companyAddress, data.companyCui),
    { text: 'FIȘĂ DE INSTRUIRE SSM', style: 'header', alignment: 'center', margin: [0, 10, 0, 15] },

    // Summary
    {
      style: 'subheader',
      text: 'Informații generale',
    },
    {
      table: {
        widths: ['35%', '65%'],
        body: [
          ['Titlu', data.title],
          ['Tip instruire', TRAINING_TYPE_LABELS[data.trainingType] ?? data.trainingType],
          ['Șantier', data.siteName],
          ['Adresă șantier', data.siteAddress ?? '—'],
          ['Conductor', data.conductorName],
          ['Data desfășurării', formatDate(data.conductedAt)],
          ['Durată (minute)', data.durationMinutes !== null ? String(data.durationMinutes) : '—'],
        ],
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 15],
    },
  ];

  // Description
  if (data.description) {
    content.push(
      { text: 'Descriere', style: 'subheader' },
      { text: data.description, margin: [0, 0, 0, 15] },
    );
  }

  // Participants table
  if (data.participants.length > 0) {
    content.push(
      { text: `Participanți (${data.participants.length})`, style: 'subheader' },
      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', 'auto', 'auto'],
          body: [
            [
              { text: 'Nr.', style: 'tableHeader' },
              { text: 'Nume', style: 'tableHeader' },
              { text: 'Confirmare', style: 'tableHeader' },
              { text: 'Data confirmării', style: 'tableHeader' },
            ],
            ...data.participants.map((p, i) => [
              String(i + 1),
              p.employeeName,
              CONFIRMATION_LABELS[p.confirmationMethod] ?? p.confirmationMethod,
              formatDate(p.confirmedAt),
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 15],
      },
    );
  }

  return {
    content,
    defaultStyle: { fontSize: 10 },
    styles: defaultStyles,
    footer: pageFooter(),
    pageMargins: [40, 40, 40, 60],
  };
}
