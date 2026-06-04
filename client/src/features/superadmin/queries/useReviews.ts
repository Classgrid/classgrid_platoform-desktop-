import { useQuery } from "@tanstack/react-query";
import { reviewsApi } from "../services/superAdminApi";

export const REVIEWS_KEY = ["super-admin", "reviews"] as const;

export function useReviews() {
  return useQuery({
    queryKey: REVIEWS_KEY,
    queryFn: () => reviewsApi.getAll(),
    staleTime: 60_000,
  });
}
