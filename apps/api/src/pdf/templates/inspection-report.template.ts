import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import type { InspectionPdfData } from '../pdf.types';
import { companyHeader, pageFooter, defaultStyles } from './base.template';

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

function complianceLabel(val: boolean | null): string {
  if (val === true) return 'Conform';
  if (val === false) return 'Neconform';
  return '—';
}

function answerDisplay(item: InspectionPdfData['items'][number]): string {
  if (item.answerBool !== null) return item.answerBool ? 'Da' : 'Nu';
  if (item.answerText) return item.answerText;
  if (item.answerNumber !== null) return String(item.answerNumber);
  return '—';
}

export function buildInspectionReportDoc(data: InspectionPdfData): TDocumentDefinitions {
  const content: any[] = [
    ...companyHeader(data.companyName, data.companyAddress, data.companyCui),
    { text: 'RAPORT DE INSPECȚIE SSM', style: 'header', alignment: 'center', margin: [0, 10, 0, 15] },

    // Summary table
    {
      style: 'subheader',
      text: 'Informații generale',
    },
    {
      table: {
        widths: ['35%', '65%'],
        body: [
          ['Șantier', data.siteName],
          ['Adresă șantier', data.siteAddress ?? '—'],
          ['Șablon', data.templateName],
          ['Inspector', data.inspectorName],
          ['Status', data.status],
          ['Scor de risc', data.riskScore !== null ? `${data.riskScore}%` : '—'],
          ['Total puncte', `${data.totalItems} (conforme: ${data.compliantItems}, neconforme: ${data.nonCompliantItems})`],
          ['Început la', formatDate(data.startedAt)],
          ['Trimis la', formatDate(data.submittedAt)],
          ['Finalizat la', formatDate(data.completedAt)],
        ],
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 15],
    },
  ];

  // Notes
  if (data.notes) {
    content.push(
      { text: 'Observații', style: 'subheader' },
      { text: data.notes, margin: [0, 0, 0, 15] },
    );
  }

  // Items table
  if (data.items.length > 0) {
    content.push(
      { text: 'Puncte de verificare', style: 'subheader' },
      {
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', '*', 'auto', 'auto'],
          body: [
            [
              { text: 'Secțiune', style: 'tableHeader' },
              { text: 'Întrebare', style: 'tableHeader' },
              { text: 'Răspuns', style: 'tableHeader' },
              { text: 'Conformitate', style: 'tableHeader' },
              { text: 'Severitate', style: 'tableHeader' },
            ],
            ...data.items.map((item) => [
              item.sectionId,
              item.questionId,
              answerDisplay(item),
              complianceLabel(item.isCompliant),
              item.severity ?? '—',
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
