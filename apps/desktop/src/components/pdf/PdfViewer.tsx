import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { Button } from '@/components/ui';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  onDownload?: () => void;
}

export function PdfViewer({ url, onDownload }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between bg-gray-100 rounded-t-xl px-4 py-2 border border-gray-200">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={ChevronLeft}
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
          />
          <span className="text-sm text-gray-600">
            {pageNumber} / {numPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            icon={ChevronRight}
            onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
            disabled={pageNumber >= numPages}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={ZoomOut}
            onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
          />
          <span className="text-xs text-gray-500">{Math.round(scale * 100)}%</span>
          <Button
            variant="ghost"
            size="sm"
            icon={ZoomIn}
            onClick={() => setScale((s) => Math.min(2, s + 0.1))}
          />
          {onDownload && (
            <Button variant="ghost" size="sm" icon={Download} onClick={onDownload} />
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-gray-200 flex justify-center p-4 rounded-b-xl border-x border-b border-gray-200">
        <Document
          file={url}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          loading={<p className="text-sm text-gray-500 py-8">Se încarcă PDF...</p>}
          error={<p className="text-sm text-danger py-8">Nu am putut încărca PDF-ul.</p>}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            className="shadow-lg"
          />
        </Document>
      </div>
    </div>
  );
}
