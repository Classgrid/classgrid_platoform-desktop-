import { useState } from "react";
import { Download, FileText, FileSpreadsheet, FileIcon } from "lucide-react";
import { CgButton } from "./Button";

interface ExportMenuProps {
  onExport?: (type: "pdf" | "excel" | "csv") => void;
  onExportPdf?: () => void;
  onExportCsv?: () => void;
  onExportExcel?: () => void;
  data?: Record<string, unknown>[];
  filename?: string;
  columns?: string[];
}

export function ExportMenu({ onExport, onExportPdf, onExportCsv, onExportExcel, data, filename = "export", columns }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const downloadCsv = () => {
    if (!data?.length || typeof document === "undefined") return;

    const keys = columns?.length ? columns : Object.keys(data[0] ?? {});
    const rows = [
      keys.join(","),
      ...data.map((row) => keys.map((key) => JSON.stringify(row[key] ?? "")).join(",")),
    ].join("\n");

    const blob = new Blob([rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative inline-block text-left">
      <CgButton variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2">
        <Download className="w-4 h-4" />
        Export
      </CgButton>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-card border border-border z-20 overflow-hidden">
            <div className="py-1" role="menu" aria-orientation="vertical">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onExport?.("pdf");
                  onExportPdf?.();
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                role="menuitem"
              >
                <FileIcon className="w-4 h-4 text-red-500" />
                Download PDF
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onExport?.("excel");
                  onExportExcel?.();
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                role="menuitem"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                Download Excel
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onExport?.("csv");
                  onExportCsv?.();
                  downloadCsv();
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                role="menuitem"
              >
                <FileText className="w-4 h-4 text-blue-500" />
                Download CSV
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
