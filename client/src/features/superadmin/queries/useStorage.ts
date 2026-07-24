import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storageApi } from "../services/storageApi";
import { toast } from "sonner";

export const storageKeys = {
  all: ["storage"] as const,
  lists: () => [...storageKeys.all, "list"] as const,
  list: (prefix: string, search?: string) => [...storageKeys.lists(), prefix, search] as const,
  analyticsSummary: () => [...storageKeys.all, "analytics", "summary"] as const,
  analyticsFiles: (params?: any) => [...storageKeys.all, "analytics", "files", params] as const,
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
    mutationFn: ({ file, prefix, onUploadProgress }: { file: File; prefix: string; onUploadProgress?: (progressEvent: any) => void }) =>
      storageApi.uploadFile(file, prefix, onUploadProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageKeys.lists() });
      toast.success("File uploaded successfully.");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to upload file.");
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
      toast.success("Folder created successfully.");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create folder.");
    },
  });
}

export function useDeleteObject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => storageApi.deleteObject(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageKeys.lists() });
      toast.success("Object deleted successfully.");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete object.");
    },
  });
}

export function useDeleteObjects() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keys: string[]) => storageApi.deleteObjects(keys),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageKeys.lists() });
      toast.success("Objects deleted successfully.");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete objects.");
    },
  });
}

export function useRenameObject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sourceKey, destinationKey }: { sourceKey: string; destinationKey: string }) =>
      storageApi.renameObject(sourceKey, destinationKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageKeys.lists() });
      toast.success("Object renamed successfully.");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to rename object.");
    },
  });
}

export function useAnalyticsSummary(forceRefresh?: boolean) {
  return useQuery({
    queryKey: [...storageKeys.analyticsSummary(), forceRefresh],
    queryFn: () => storageApi.getAnalyticsSummary(forceRefresh),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useAnalyticsFiles(params?: { sort?: string; type?: string; prefix?: string; search?: string; limit?: number; cursor?: string }) {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageKeys.configuration() });
      toast.success("Connection test completed.");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Connection test failed.");
    },
  });
}
