import { useState, useRef } from "react";
import { Loader2, UploadCloud, CheckCircle, FileText, AlertCircle } from "lucide-react";
import type { FormSchemaDocument } from "../types";
import { apiClient } from "@/lib/apiClient";

export type DocumentState = "missing" | "uploading" | "uploaded" | "verified" | "rejected";

export type DocumentRecord = {
  id: string;
  url?: string;
  state: DocumentState;
  rejection_reason?: string;
};

type CgDocumentEngineProps = {
  documentsSchema: FormSchemaDocument[];
  existingDocs?: Record<string, DocumentRecord>;
  onUpload?: (docId: string, file: File) => Promise<void>;
  onComplete: (docs: Record<string, DocumentRecord>) => void;
  isReadOnly?: boolean;
};

export function CgDocumentEngine({
  documentsSchema,
  existingDocs = {},
  onUpload,
  onComplete,
  isReadOnly = false,
}: CgDocumentEngineProps) {
  const [docs, setDocs] = useState<Record<string, DocumentRecord>>(() => {
    const init: Record<string, DocumentRecord> = {};
    documentsSchema.forEach((doc) => {
      init[doc.id] = existingDocs[doc.id] || { id: doc.id, state: "missing" as DocumentState };
    });
    return init;
  });
  
  const [globalError, setGlobalError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);

  const handleUploadClick = (docId: string) => {
    if (isReadOnly || !onUpload) return;
    setActiveUploadId(docId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const docId = activeUploadId;
    if (!file || !docId || !onUpload) return;

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setGlobalError("File size exceeds 5MB limit.");
      return;
    }

    setGlobalError("");
    setDocs((prev) => ({ ...prev, [docId]: { ...(prev[docId] || { id: docId }), state: "uploading" as DocumentState } }));

    try {
      await onUpload(docId, file);
      setDocs((prev) => ({
        ...prev,
        [docId]: { id: docId, state: "uploaded" as DocumentState },
      }));
      // trigger refresh in parent
      onComplete(docs);
    } catch (err: any) {
      setDocs((prev) => ({ ...prev, [docId]: { ...(prev[docId] || { id: docId }), state: "missing" as DocumentState } }));
      setGlobalError(`Failed to upload document: ${err.response?.data?.error || err.message}`);
    } finally {
      setActiveUploadId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isAllRequiredUploaded = documentsSchema.every(
    (schema) => !schema.required || docs[schema.id]?.state === "uploaded" || docs[schema.id]?.state === "verified"
  );

  return (
    <div className="cg-document-engine">
      <input
        type="file"
        ref={fileInputRef}
        className="cg-hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
      />

      {globalError && (
        <div className="cg-alert-error">
          <AlertCircle size={16} className="cg-alert-error__icon" />
          {globalError}
        </div>
      )}

      <div className="cg-document-list">
        {documentsSchema.map((schema) => {
          const doc = docs[schema.id] || { id: schema.id, state: "missing" as DocumentState };
          const isPending = doc.state === "uploading";
          const isUploaded = doc.state === "uploaded" || doc.state === "verified";
          const isRejected = doc.state === "rejected";

          return (
            <div key={schema.id} className="cg-document-item">
              <div>
                <div className="cg-document-label">
                  {schema.label}
                  {schema.required && (
                    <span className="cg-badge--required">
                      Required
                    </span>
                  )}
                  {isUploaded && <CheckCircle size={14} className="cg-color-success" />}
                </div>
                {isRejected && (
                  <div className="cg-document-rejection">
                    Rejected: {doc.rejection_reason || "Please upload a clearer copy."}
                  </div>
                )}
                {isUploaded && doc.url && (
                  <a href={doc.url} target="_blank" rel="noreferrer" className="cg-document-link">
                    <FileText size={12} /> View Document
                  </a>
                )}
              </div>
              
              <button
                type="button"
                className={`cg-btn cg-btn--sm ${isUploaded ? "cg-btn--outline" : "cg-btn--primary"}`}
                onClick={() => handleUploadClick(schema.id)}
                disabled={isReadOnly || isPending || doc.state === "verified"}
              >
                {isPending ? (
                  <><Loader2 size={14} className="cg-spin" /> Uploading...</>
                ) : isUploaded ? (
                  "Re-upload"
                ) : (
                  <><UploadCloud size={14} /> Upload</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {!isReadOnly && (
        <div className="cg-document-footer">
          <button
            type="button"
            className="cg-btn cg-btn--primary"
            onClick={() => onComplete(docs)}
            disabled={!isAllRequiredUploaded}
          >
            Submit Documents
          </button>
        </div>
      )}
      {!isAllRequiredUploaded && !isReadOnly && (
        <p className="cg-hint--right">
          Please upload all required documents to proceed.
        </p>
      )}
    </div>
  );
}
