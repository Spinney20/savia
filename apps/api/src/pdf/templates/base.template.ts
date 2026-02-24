import type { StyleDictionary, TDocumentDefinitions } from 'pdfmake/interfaces';

export const defaultStyles: StyleDictionary = {
  header: { fontSize: 16, bold: true, margin: [0, 0, 0, 10] },
  subheader: { fontSize: 12, bold: true, margin: [0, 10, 0, 5] },
  tableHeader: { bold: true, fontSize: 10, fillColor: '#f0f0f0' },
  small: { fontSize: 8, color: '#666666' },
};

export function companyHeader(
  companyName: string,
  companyAddress: string | null,
  companyCui: string | null,
): any {
  const lines: any[] = [
    { text: companyName, style: 'header', alignment: 'center' },
  ];

  const details: string[] = [];
  if (companyCui) details.push(`CUI: ${companyCui}`);
  if (companyAddress) details.push(companyAddress);

  if (details.length > 0) {
    lines.push({
      text: details.join(' | '),
      style: 'small',
      alignment: 'center',
      margin: [0, 0, 0, 10],
    });
  }

  lines.push({
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }],
    margin: [0, 0, 0, 10],
  });

  return lines;
}

export function pageFooter(): TDocumentDefinitions['footer'] {
  return (currentPage: number, pageCount: number) => ({
    columns: [
      {
        text: `Generat automat — SSM App`,
        style: 'small',
        alignment: 'left',
        margin: [40, 10, 0, 0],
      },
      {
        text: `Pagina ${currentPage} / ${pageCount}`,
        style: 'small',
        alignment: 'right',
        margin: [0, 10, 40, 0],
      },
    ],
  });
}
