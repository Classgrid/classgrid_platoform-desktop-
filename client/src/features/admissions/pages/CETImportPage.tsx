import { useState } from "react";
import { Loader2, UploadCloud, FileType, CheckCircle, AlertTriangle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { importCETAllotments } from "../api";

import { Button } from "@/components/marketing_ui/button";

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
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CET Allotment Import</h1>
          <p className="text-muted-foreground mt-1">Upload government CET allotment PDFs or Excel sheets to sync with the admission engine.</p>
        </div>
      </div>

      {importData.isSuccess && (
        <div className="bg-emerald-100 text-emerald-800 p-4 rounded-md border border-emerald-200">
          <strong>Import Successful</strong>
          <br/>
          Successfully processed {importData.data?.processed || 0} records.
          {importData.data?.duplicates > 0 && ` Skipped ${importData.data?.duplicates} duplicates.`}
        </div>
      )}

      {importData.isError && (
        <div className="bg-red-100 text-red-800 p-4 rounded-md border border-red-200">
          <strong>Import Failed</strong>
          <br/>
          {(importData.error as any)?.response?.data?.error || "Could not process the uploaded file. Please ensure it matches the standard format."}
        </div>
      )}

      <div >
        <div className="bg-card border border-border rounded-xl shadow-sm">
          <div className="p-5 border-b border-border">
            <h2 className="text-lg font-bold">Upload File</h2>
          </div>
          <div className="p-5" >
            <p >
              Upload the official allotment list provided by DTE/CET Cell. The system will parse EN Numbers, Names, Merit Scores, and Categories.
            </p>

            <div
              
              onClick={() => document.getElementById("cet-file-upload")?.click()}
            >
              <Input
                id="cet-file-upload"
                type="file"
                accept=".pdf,.csv,.xlsx,.xls"
                onChange={handleFileChange}
                
              />
              
              {file ? (
                <>
                  <FileType size={48}  />
                  <div >
                    <div >{file.name}</div>
                    <div >
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <UploadCloud size={48}  />
                  <div >
                    <div >Click to select or drag and drop</div>
                    <div >
                      PDF, CSV, or Excel (Max 10MB)
                    </div>
                  </div>
                </>
              )}
            </div>

            <div >
              {file && (
                <Button
                  variant="outline"
                  onClick={() => setFile(null)}
                  disabled={importData.isPending}
                >
                  Clear
                </Button>
              )}
              <Button
                variant="default"
                onClick={handleUpload}
                disabled={!file || importData.isPending}
              >
                {importData.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : <CheckCircle size={16} className="mr-2" />}
                Start Import
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm">
          <div className="p-5 border-b border-border">
            <h2 className="text-lg font-bold">Data Validation Rules</h2>
          </div>
          <div className="p-5">
            <ul >
              <li><span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800">EN Number</span> acts as the unique identifier for all Engineering/Diploma candidates.</li>
              <li>Records with an existing EN Number in the database will be skipped (duplicates).</li>
              <li>Candidates will be able to log in to the portal using their EN Number and verify their email to proceed.</li>
              <li>Make sure the uploaded document contains clear headers if using Excel/CSV.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
