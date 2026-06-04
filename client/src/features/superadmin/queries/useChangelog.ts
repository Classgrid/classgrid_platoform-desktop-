import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { changelogApi } from "../services/superAdminApi";
import type { CreateChangelogPayload } from "../services/superAdminApi";

export const CHANGELOG_KEY = ["super-admin", "changelog"] as const;

export function useChangelog() {
  return useQuery({
    queryKey: CHANGELOG_KEY,
    queryFn: () => changelogApi.getAll(),
    staleTime: 60_000,
  });
}

export function useCreateChangelog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChangelogPayload) => changelogApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: CHANGELOG_KEY }),
  });
}

export function useUpdateChangelog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<CreateChangelogPayload>) =>
      changelogApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: CHANGELOG_KEY }),
  });
}

export function useDeleteChangelog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => changelogApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CHANGELOG_KEY }),
  });
}
