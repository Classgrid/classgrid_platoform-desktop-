import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { FileText, Download, ExternalLink } from "lucide-react";
import { Spinner } from "@/components/marketing_ui/spinner";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Ensure worker is set up for Vite
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfAttachmentProps {
  url: string;
  filename: string;
  size: number;
  isSending?: boolean;
}

export function PdfAttachment({ url, filename, size, isSending }: PdfAttachmentProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState<boolean>(false);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col rounded-xl overflow-hidden bg-black/5 dark:bg-[#202C33] border border-black/5 dark:border-white/5 w-[300px] relative">
      {/* Thumbnail Preview Area */}
      <div className="w-full bg-white relative flex justify-center items-center min-h-[160px] overflow-hidden">
        {!error ? (
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={() => setError(true)}
            loading={
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <Spinner className="w-6 h-6 text-gray-400" />
              </div>
            }
          >
            <Page
              pageNumber={1}
              width={300}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-sm"
            />
          </Document>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 bg-gray-100 text-gray-500 w-full h-[160px]">
            <FileText className="w-12 h-12 mb-2 text-red-500/50" />
            <span className="text-sm font-medium">Preview not available</span>
          </div>
        )}
      </div>

      {/* Details Area */}
      <div className="p-3 bg-transparent">
        <div className="flex items-start gap-3">
          <div className="bg-red-500 text-white rounded shrink-0 w-10 h-10 flex items-center justify-center shadow-sm">
            <span className="text-xs font-bold tracking-wider">PDF</span>
          </div>
          
          <div className="flex flex-col min-w-0 justify-center">
            <span className="text-[15px] font-medium text-foreground truncate block">
              {filename}
            </span>
            <span className="text-[13px] text-muted-foreground block mt-0.5">
              {numPages ? `${numPages} page${numPages !== 1 ? "s" : ""} • ` : ""}
              PDF • {formatSize(size)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-black/5 dark:border-white/10 bg-transparent">
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-emerald-500 hover:text-emerald-400 text-[14px] font-medium transition-colors"
        >
          Open
        </a>
        <a 
          href={url} 
          download={filename}
          className="text-emerald-500 hover:text-emerald-400 text-[14px] font-medium transition-colors"
        >
          Save as...
        </a>
      </div>
      
      {/* Uploading — small progress bar instead of big dark overlay */}
      {isSending && (
        <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 bg-black/30 backdrop-blur-sm flex items-center gap-2 rounded-b-xl">
          <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full animate-pulse w-2/3" />
          </div>
          <span className="text-white text-[11px] font-medium shrink-0">Uploading...</span>
        </div>
      )}
    </div>
  );
}
