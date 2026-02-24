import { Modal } from '@/components/ui';
import { PdfViewer } from './PdfViewer';

interface PdfViewerModalProps {
  open: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  onDownload?: () => void;
}

export function PdfViewerModal({ open, onClose, url, title = 'PDF', onDownload }: PdfViewerModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="xl">
      <div className="h-[70vh]">
        <PdfViewer url={url} onDownload={onDownload} />
      </div>
    </Modal>
  );
}
