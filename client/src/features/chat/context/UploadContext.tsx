import React, { createContext, useContext, useRef, useState, useCallback } from "react";
import { getPresignedUrls } from "../services/chatApi";
import axios from "axios";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface UploadTask {
  threadId: string;
  tempId: string;        // matches the optimistic message id
  files: File[];
  message: string;
  replyTo: any;
  options: any;
  progress: number;      // 0-100
  status: 'uploading' | 'done' | 'failed';
  error?: string;
  // Resolved attachments after upload — used to finalize the server call
  preuploadedAttachments?: any[];
}

interface UploadContextValue {
  uploads: Record<string, UploadTask[]>; // keyed by threadId
  startUpload: (
    threadId: string,
    tempId: string,
    files: File[],
    message: string,
    replyTo: any,
    options: any,
    onDone: (attachments: any[]) => void,
    onFail: (tempId: string, error: string) => void,
  ) => void;
  retryUpload: (threadId: string, tempId: string) => void;
  clearUpload: (threadId: string, tempId: string) => void;
}

// ─── Context ────────────────────────────────────────────────────────────────

const UploadContext = createContext<UploadContextValue | null>(null);

export function useUploadContext() {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error("useUploadContext must be used inside UploadProvider");
  return ctx;
}

// ─── Provider ───────────────────────────────────────────────────────────────

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [uploads, setUploads] = useState<Record<string, UploadTask[]>>({});

  // Store callbacks in a ref so we don't lose them across re-renders
  const callbacksRef = useRef<Record<string, {
    onDone: (attachments: any[]) => void;
    onFail: (tempId: string, error: string) => void;
  }>>({});

  const setTaskField = useCallback((threadId: string, tempId: string, update: Partial<UploadTask>) => {
    setUploads(prev => {
      const threadUploads = prev[threadId] || [];
      return {
        ...prev,
        [threadId]: threadUploads.map(t => t.tempId === tempId ? { ...t, ...update } : t),
      };
    });
  }, []);

  const doUpload = useCallback(async (threadId: string, tempId: string, files: File[], message: string, replyTo: any, options: any) => {
    const callbackKey = `${threadId}:${tempId}`;
    const callbacks = callbacksRef.current[callbackKey];

    try {
      // Step 1: Get presigned URLs
      const fileData = files.map(f => ({
        fileName: f.name || 'upload.file',
        fileType: f.type || 'application/octet-stream',
        fileSize: f.size,
      }));
      const urls = await getPresignedUrls(threadId, fileData);

      // Step 2: Track cumulative progress across all files
      const fileSizes = files.map(f => f.size);
      const totalSize = fileSizes.reduce((a, b) => a + b, 0) || 1;
      const loadedPerFile: number[] = new Array(files.length).fill(0);

      const uploadPromises = files.map(async (file, index) => {
        const urlInfo = urls[index];
        await axios.put(urlInfo.uploadUrl, file, {
          headers: { 'Content-Type': urlInfo.fileType },
          transformRequest: [(data) => data], // No auth headers for R2
          onUploadProgress: (evt) => {
            loadedPerFile[index] = evt.loaded;
            const totalLoaded = loadedPerFile.reduce((a, b) => a + b, 0);
            const pct = Math.min(99, Math.round((totalLoaded / totalSize) * 100));
            setTaskField(threadId, tempId, { progress: pct });
          },
        });
        return {
          file_url: urlInfo.publicUrl,
          file_name: urlInfo.fileName,
          file_type: urlInfo.fileType,
          file_size: urlInfo.fileSize,
        };
      });

      const preuploadedAttachments = await Promise.all(uploadPromises);

      // Mark done at 100%
      setTaskField(threadId, tempId, { progress: 100, status: 'done', preuploadedAttachments });
      callbacks?.onDone(preuploadedAttachments);

    } catch (err: any) {
      const errMsg = err?.message || "Upload failed";
      setTaskField(threadId, tempId, { status: 'failed', error: errMsg });
      callbacks?.onFail(tempId, errMsg);
    }
  }, [setTaskField]);

  const startUpload = useCallback((
    threadId: string,
    tempId: string,
    files: File[],
    message: string,
    replyTo: any,
    options: any,
    onDone: (attachments: any[]) => void,
    onFail: (tempId: string, error: string) => void,
  ) => {
    const task: UploadTask = {
      threadId, tempId, files, message, replyTo, options,
      progress: 0, status: 'uploading',
    };

    // Register callbacks
    const callbackKey = `${threadId}:${tempId}`;
    callbacksRef.current[callbackKey] = { onDone, onFail };

    // Add to state
    setUploads(prev => ({
      ...prev,
      [threadId]: [...(prev[threadId] || []), task],
    }));

    // Start the upload immediately (runs globally, not tied to any component lifecycle)
    doUpload(threadId, tempId, files, message, replyTo, options);
  }, [doUpload]);

  const retryUpload = useCallback((threadId: string, tempId: string) => {
    setUploads(prev => {
      const task = (prev[threadId] || []).find(t => t.tempId === tempId);
      if (!task) return prev;
      const updated = { ...task, progress: 0, status: 'uploading' as const, error: undefined };
      doUpload(threadId, tempId, task.files, task.message, task.replyTo, task.options);
      return {
        ...prev,
        [threadId]: (prev[threadId] || []).map(t => t.tempId === tempId ? updated : t),
      };
    });
  }, [doUpload]);

  const clearUpload = useCallback((threadId: string, tempId: string) => {
    setUploads(prev => ({
      ...prev,
      [threadId]: (prev[threadId] || []).filter(t => t.tempId !== tempId),
    }));
    const callbackKey = `${threadId}:${tempId}`;
    delete callbacksRef.current[callbackKey];
  }, []);

  return (
    <UploadContext.Provider value={{ uploads, startUpload, retryUpload, clearUpload }}>
      {children}
    </UploadContext.Provider>
  );
}
