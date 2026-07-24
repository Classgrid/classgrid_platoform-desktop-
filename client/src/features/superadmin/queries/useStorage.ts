import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  storageApi,
  type AnalyticsFileQuery,
  type StorageUploadProgressHandler,
} from "../services/storageApi";
import { toast } from "sonner";

function storageErrorMessage(error: unknown, fallback: string) {
  return error && typeof error === "object" && "message" in error && typeof error.message === "string"
    ? error.message
    : fallback;
}

export const storageKeys = {
  all: ["storage"] as const,
  lists: () => [...storageKeys.all, "list"] as const,
  list: (prefix: string, search?: string) => [...storageKeys.lists(), prefix, search] as const,
  analytics: () => [...storageKeys.all, "analytics"] as const,
  analyticsSummary: () => [...storageKeys.all, "analytics", "summary"] as const,
  analyticsFiles: (params?: AnalyticsFileQuery) => [...storageKeys.all, "analytics", "files", params] as const,
  analyticsBreakdown: () => [...storageKeys.all, "analytics", "breakdown"] as const,
  configuration: () => [...storageKeys.all, "configuration"] as const,
};

export function useStorageObjects(prefix: string, search?: string) {
  return useQuery({
    queryKey: storageKeys.list(prefix, search),
    queryFn: () => storageApi.listObjects(prefix, 1000, undefined, search),
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, prefix, onUploadProgress }: {
      file: File;
      prefix: string;
      onUploadProgress?: StorageUploadProgressHandler;
    }) =>
      storageApi.uploadFile(file, prefix, onUploadProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: storageKeys.analytics() });
      toast.success("File uploaded successfully.");
    },
    onError: (error: unknown) => {
      toast.error(storageErrorMessage(error, "Failed to upload file."));
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ folderName, prefix }: { folderName: string; prefix: string }) =>
      storageApi.createFolder(folderName, prefix),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: storageKeys.analytics() });
      toast.success("Folder created successfully.");
    },
    onError: (error: unknown) => {
      toast.error(storageErrorMessage(error, "Failed to create folder."));
    },
  });
}

export function useDeleteObject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => storageApi.deleteObject(key),
    onSuccess: (_, key) => {
      queryClient.invalidateQueries({ queryKey: storageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: storageKeys.analytics() });
      const isFolder = key.endsWith('/');
      toast.success(isFolder ? "Folder deleted successfully." : "File deleted successfully.");
    },
    onError: (error: unknown, key) => {
      const isFolder = key.endsWith('/');
      toast.error(storageErrorMessage(error, isFolder ? "Failed to delete folder." : "Failed to delete file."));
    },
  });
}

export function useDeleteObjects() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keys: string[]) => storageApi.deleteObjects(keys),
    onSuccess: (_, keys) => {
      queryClient.invalidateQueries({ queryKey: storageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: storageKeys.analytics() });
      const hasFiles = keys.some(k => !k.endsWith('/'));
      const hasFolders = keys.some(k => k.endsWith('/'));
      const count = keys.length;
      let msg = `${count} items deleted successfully.`;
      if (hasFiles && !hasFolders) msg = `${count} file${count !== 1 ? 's' : ''} deleted successfully.`;
      else if (!hasFiles && hasFolders) msg = `${count} folder${count !== 1 ? 's' : ''} deleted successfully.`;
      toast.success(msg);
    },
    onError: (error: unknown) => {
      toast.error(storageErrorMessage(error, "Failed to delete items."));
    },
  });
}

export function useRenameObject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sourceKey, destinationKey }: { sourceKey: string; destinationKey: string }) =>
      storageApi.renameObject(sourceKey, destinationKey),
    onSuccess: (_, { sourceKey }) => {
      queryClient.invalidateQueries({ queryKey: storageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: storageKeys.analytics() });
      const isFolder = sourceKey.endsWith('/');
      toast.success(isFolder ? "Folder renamed successfully." : "File renamed successfully.");
    },
    onError: (error: unknown, { sourceKey }) => {
      const isFolder = sourceKey.endsWith('/');
      toast.error(storageErrorMessage(error, isFolder ? "Failed to rename folder." : "Failed to rename file."));
    },
  });
}

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: storageKeys.analyticsSummary(),
    queryFn: () => storageApi.getAnalyticsSummary(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useAnalyticsFiles(params?: AnalyticsFileQuery) {
  return useQuery({
    queryKey: storageKeys.analyticsFiles(params),
    queryFn: () => storageApi.getAnalyticsFiles(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useAnalyticsBreakdown() {
  return useQuery({
    queryKey: storageKeys.analyticsBreakdown(),
    queryFn: () => storageApi.getAnalyticsBreakdown(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useStorageConfiguration() {
  return useQuery({
    queryKey: storageKeys.configuration(),
    queryFn: () => storageApi.getConfiguration(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useTestStorageConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => storageApi.testConnection(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: storageKeys.configuration() });
      if (result.connected) {
        toast.success(`S3 connection healthy (${result.latencyMs} ms).`);
      } else {
        toast.warning(result.message || "S3 connection test failed.");
      }
    },
    onError: (error: unknown) => {
      toast.error(storageErrorMessage(error, "Connection test failed."));
    },
  });
}
