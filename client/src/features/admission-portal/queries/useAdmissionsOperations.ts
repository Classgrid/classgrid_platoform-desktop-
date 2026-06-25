import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/lib/apiClient";

export const useGeneratePRNs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicationIds: string[]) => {
      const { data } = await apiClient.post("/api/admission/generate-prns", {
        application_ids: applicationIds,
      });
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "PRNs generated successfully.");
      queryClient.invalidateQueries({ queryKey: ["admissions"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to generate PRNs.");
    },
  });
};

export const useAllocateDivisions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { hierarchy_id: string; method: string; divisions: { name: string; capacity: number }[] }) => {
      const { data } = await apiClient.post("/api/admission/allocate-divisions", payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Divisions allocated successfully.");
      queryClient.invalidateQueries({ queryKey: ["admissions"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to allocate divisions.");
    },
  });
};

export const useDownloadGovtExport = () => {
  return useMutation({
    mutationFn: async (exportType: "dte" | "saral" | "aicte" | "state-board") => {
      // For file downloads, we expect the backend to return JSON with { csv, filename } 
      // or we handle blob. The backend seems to return JSON { csv: "...", filename: "..." }
      const { data } = await apiClient.get(`/api/admission/export/${exportType}`);
      return data;
    },
    onSuccess: (data) => {
      if (data.csv && data.filename) {
        const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", data.filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Downloaded ${data.filename}`);
      } else {
        toast.error("Invalid export data received.");
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to download export.");
    },
  });
};
