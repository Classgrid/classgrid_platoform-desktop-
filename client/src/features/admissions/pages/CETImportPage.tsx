import { useState } from "react";
import { Loader2, UploadCloud, FileType, CheckCircle, AlertTriangle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CgPageShell, CgSectionPanel, CgAlert, CgBadge } from "@/components/classgrid";
import { importCETAllotments } from "../api";

export function CETImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const qc = useQueryClient();

  const importData = useMutation({
    mutationFn: (f: File) => importCETAllotments(f),
    onSuccess: () => {
      setFile(null);
      qc.invalidateQueries({ queryKey: ["admission-analytics"] });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (file) {
      importData.mutate(file);
    }
  };

  return (
    <CgPageShell
      title="CET Allotment Import"
      description="Upload government CET allotment PDFs or Excel sheets to sync with the admission engine."
      breadcrumbs={[
        { label: "Admissions", to: "/dept/admissions/dashboard" },
        { label: "CET Import" },
      ]}
    >
      {importData.isSuccess && (
        <CgAlert variant="success" title="Import Successful">
          Successfully processed {importData.data?.processed || 0} records.
          {importData.data?.duplicates > 0 && ` Skipped ${importData.data?.duplicates} duplicates.`}
        </CgAlert>
      )}

      {importData.isError && (
        <CgAlert variant="danger" title="Import Failed">
          {(importData.error as any)?.response?.data?.error || "Could not process the uploaded file. Please ensure it matches the standard format."}
        </CgAlert>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem", maxWidth: "800px" }}>
        <CgSectionPanel title="Upload File">
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <p style={{ fontSize: "0.9rem", color: "hsl(var(--muted-foreground))" }}>
              Upload the official allotment list provided by DTE/CET Cell. The system will parse EN Numbers, Names, Merit Scores, and Categories.
            </p>

            <div
              style={{
                border: "2px dashed hsl(var(--border))",
                borderRadius: "var(--radius)",
                padding: "3rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1rem",
                backgroundColor: "hsl(var(--background))",
                cursor: "pointer",
              }}
              onClick={() => document.getElementById("cet-file-upload")?.click()}
            >
              <input
                id="cet-file-upload"
                type="file"
                accept=".pdf,.csv,.xlsx,.xls"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              
              {file ? (
                <>
                  <FileType size={48} style={{ color: "hsl(var(--primary))" }} />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 600 }}>{file.name}</div>
                    <div style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))" }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <UploadCloud size={48} style={{ color: "hsl(var(--muted-foreground))" }} />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 600 }}>Click to select or drag and drop</div>
                    <div style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))" }}>
                      PDF, CSV, or Excel (Max 10MB)
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              {file && (
                <button
                  className="cg-btn cg-btn--outline"
                  onClick={() => setFile(null)}
                  disabled={importData.isPending}
                >
                  Clear
                </button>
              )}
              <button
                className="cg-btn cg-btn--primary"
                onClick={handleUpload}
                disabled={!file || importData.isPending}
              >
                {importData.isPending ? <Loader2 size={16} className="cg-spin" /> : <CheckCircle size={16} />}
                Start Import
              </button>
            </div>
          </div>
        </CgSectionPanel>

        <CgSectionPanel title="Data Validation Rules">
          <ul style={{ fontSize: "0.9rem", color: "hsl(var(--muted-foreground))", display: "flex", flexDirection: "column", gap: "0.5rem", paddingLeft: "1.5rem" }}>
            <li><CgBadge variant="info" size="sm">EN Number</CgBadge> acts as the unique identifier for all Engineering/Diploma candidates.</li>
            <li>Records with an existing EN Number in the database will be skipped (duplicates).</li>
            <li>Candidates will be able to log in to the portal using their EN Number and verify their email to proceed.</li>
            <li>Make sure the uploaded document contains clear headers if using Excel/CSV.</li>
          </ul>
        </CgSectionPanel>
      </div>
    </CgPageShell>
  );
}
