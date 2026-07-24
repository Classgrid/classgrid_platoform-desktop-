import React, { useState } from "react";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/marketing_ui/dialog";
import { FileUpload } from "@/components/marketing_ui/file-upload";
import { useUploadFile } from "../queries/useStorage";
import { ProgressOverlay } from "@/components/marketing_ui/ProgressOverlay";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefix: string;
}

export function FileUploadModal({ isOpen, onClose, prefix }: FileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customFileName, setCustomFileName] = useState("");
  const uploadFileMutation = useUploadFile();

  const handleFilesSelected = (files: File[]) => {
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setCustomFileName(files[0].name);
    } else {
      setSelectedFile(null);
      setCustomFileName("");
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setCustomFileName("");
    onClose();
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    let fileToUpload = selectedFile;
    const finalName = customFileName.trim() || selectedFile.name;
    
    if (finalName !== selectedFile.name) {
      fileToUpload = new File([selectedFile], finalName, { type: selectedFile.type });
    }

    uploadFileMutation.mutate(
      { file: fileToUpload, prefix },
      {
        onSuccess: () => {
          handleClose();
        }
      }
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>
              Select a file to upload to <span className="font-mono text-xs">{prefix || "root/"}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {!selectedFile ? (
              <FileUpload 
                onFilesSelected={handleFilesSelected}
                maxFiles={1}
                maxSizeMB={2000} // Our backend limit is 2GB
                title="Drop a file here to upload"
                description="Supports all file types up to 2GB"
              />
            ) : (
              <div className="space-y-4">
                <div className="bg-muted/30 border border-border rounded-xl p-4 flex items-center justify-between">
                  <div className="truncate flex-1 font-medium">
                    {selectedFile.name}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSelectedFile(null);
                      setCustomFileName("");
                    }}
                  >
                    Change File
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Rename file before uploading (optional)</label>
                  <Input 
                    value={customFileName} 
                    onChange={(e) => setCustomFileName(e.target.value)} 
                    placeholder="Enter a new name"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || uploadFileMutation.isPending}
            >
              {uploadFileMutation.isPending ? "Starting Upload..." : "Upload File"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {uploadFileMutation.isPending && (
        <ProgressOverlay 
          visible={true}
          title="Uploading File"
          message={`Uploading ${customFileName || selectedFile?.name} to S3...`}
          isIndeterminate={true} // For V1 we just show indeterminate since axios upload progress is not fully hooked to UI state
        />
      )}
    </>
  );
}
