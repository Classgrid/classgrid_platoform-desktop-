import { apiClient } from "@/lib/apiClient";

export interface StorageObject {
  key: string;
  name: string;
  size: number;
  lastModified: string | null;
  contentType: string;
  cdnUrl: string;
}

export interface StorageFolder {
  prefix: string;
  name: string;
}

export interface ListObjectsResponse {
  folders: StorageFolder[];
  files: StorageObject[];
  nextCursor: string | null;
  totalSize: number;
}

export interface UploadFileResponse {
  key: string;
  cdnUrl: string;
  size: number;
  contentType: string;
}

export interface AnalyticsSummaryResponse {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  averageFileSize: number;
  largestFile: StorageObject | null;
  smallestFile: StorageObject | null;
  zeroByteFiles: number;
  unknownContentTypeFiles: number;
  filesAboveOneGb: number;
  generatedAt: string;
  cacheAgeSeconds: number;
}

export interface AnalyticsFilesResponse {
  files: (StorageObject & { 
    rank: number; 
    folder: string; 
    relativeToLargestPercentage: number; 
    percentageOfTotal: number; 
  })[];
  nextCursor: string | null;
  totalMatchingFiles: number;
  largestFileSize: number;
  totalStorageSize: number;
  generatedAt: string;
}

export interface AnalyticsBreakdownResponse {
  byType: { type: string; fileCount: number; size: number; percentage: number }[];
  byFolder: { prefix: string; name: string; fileCount: number; size: number; percentage: number }[];
  bySizeRange: { range: string; label: string; fileCount: number; size: number }[];
  recentFiles: StorageObject[];
  oldestFiles: StorageObject[];
  generatedAt: string;
}

export interface StorageConfiguration {
  provider: string;
  connected: boolean;
  endpoint: string;
  bucket: string;
  region: string;
  cdnBaseUrl: string;
  maxUploadBytes: number;
  multipartThresholdBytes: number;
  presignedUrlExpirySeconds: number;
  uploadRateLimitPerMinute: number;
  credentialsConfigured: boolean;
  auditLoggingEnabled: boolean;
  protectedPrefixes: string[];
  checkedAt: string;
  latencyMs: number;
}

export interface StorageConnectionTestResult {
  connected: boolean;
  message?: string;
  checkedAt: string;
  latencyMs: number;
}

export const storageApi = {
  listObjects: async (prefix = "", limit = 100, cursor?: string, search?: string) => {
    const params = new URLSearchParams();
    if (prefix) params.append("prefix", prefix);
    if (limit) params.append("limit", limit.toString());
    if (cursor) params.append("cursor", cursor);
    if (search) params.append("search", search);

    const response = await apiClient.get<{ data: ListObjectsResponse }>(`/api/super-admin/storage/objects?${params.toString()}`);
    return response.data.data;
  },

  uploadFile: async (file: File, prefix = "", onUploadProgress?: (progressEvent: any) => void) => {
    const formData = new FormData();
    formData.append("file", file);

    const params = new URLSearchParams();
    if (prefix) params.append("prefix", prefix);

    const response = await apiClient.post<{ data: UploadFileResponse }>(
      `/api/super-admin/storage/upload?${params.toString()}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress,
      }
    );
    return response.data.data;
  },

  deleteObject: async (key: string) => {
    const response = await apiClient.delete("/api/super-admin/storage/object", { data: { key } });
    return response.data.data;
  },

  deleteObjects: async (keys: string[]) => {
    const response = await apiClient.delete("/api/super-admin/storage/objects", { data: { keys } });
    return response.data.data;
  },

  createFolder: async (folderName: string, prefix = "") => {
    const response = await apiClient.post("/api/super-admin/storage/folder", { folderName, prefix });
    return response.data.data;
  },

  renameObject: async (sourceKey: string, destinationKey: string) => {
    const response = await apiClient.post("/api/super-admin/storage/rename", { sourceKey, destinationKey });
    return response.data.data;
  },

  getPresignedUrl: async (key: string) => {
    const response = await apiClient.post("/api/super-admin/storage/presigned-url", { key });
    return response.data.data;
  },

  getAnalyticsSummary: async (forceRefresh?: boolean) => {
    const params = forceRefresh ? "?refresh=true" : "";
    const response = await apiClient.get<{ data: AnalyticsSummaryResponse }>(`/api/super-admin/storage/analytics/summary${params}`);
    return response.data.data;
  },

  getAnalyticsFiles: async (params?: { sort?: string; type?: string; prefix?: string; search?: string; limit?: number; cursor?: string }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          searchParams.append(key, value.toString());
        }
      });
    }
    const response = await apiClient.get<{ data: AnalyticsFilesResponse }>(`/api/super-admin/storage/analytics/files?${searchParams.toString()}`);
    return response.data.data;
  },

  getAnalyticsBreakdown: async () => {
    const response = await apiClient.get<{ data: AnalyticsBreakdownResponse }>("/api/super-admin/storage/analytics/breakdown");
    return response.data.data;
  },

  getConfiguration: async () => {
    const response = await apiClient.get<{ data: StorageConfiguration }>("/api/super-admin/storage/configuration");
    return response.data.data;
  },

  getHealth: async () => {
    const response = await apiClient.get<{ data: StorageConfiguration }>("/api/super-admin/storage/health");
    return response.data.data;
  },

  testConnection: async () => {
    const response = await apiClient.post<{ data: StorageConnectionTestResult }>("/api/super-admin/storage/test-connection");
    return response.data.data;
  },
};
