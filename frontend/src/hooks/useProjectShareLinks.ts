import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ProjectShareLink } from "../types/project-share-links";

export function useProjectShareLinks(projectId: number) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["projects", projectId, "share-links"],
    });

  const shareLinks = useQuery<ProjectShareLink[]>({
    queryKey: ["projects", projectId, "share-links"],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/share-links`);
      return data;
    },
    enabled: !!projectId,
    refetchOnMount: "always",
    refetchInterval: 8_000,
  });

  const createShareLink = useMutation({
    mutationFn: (body: { accessLevel?: string; expiresInDays?: number; email?: string }) =>
      api.post(`/projects/${projectId}/share-links`, body),
    onSuccess: invalidate,
  });

  const revokeShareLink = useMutation({
    mutationFn: (linkId: number) =>
      api.delete(`/projects/${projectId}/share-links/${linkId}`),
    onSuccess: invalidate,
  });

  return { shareLinks, createShareLink, revokeShareLink };
}
