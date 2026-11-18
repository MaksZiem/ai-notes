import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ProjectInvite } from "../types/project-share-links";

export function useSharedProject(token: string) {
  const invite = useQuery<ProjectInvite>({
    queryKey: ["project-invites", token],
    queryFn: async () => {
      const { data } = await api.get(`/project-invites/${token}`);
      return data;
    },
    enabled: !!token,
    retry: false,
  });

  const claim = useMutation({
    mutationFn: () => api.post(`/project-invites/${token}/claim`),
  });

  return { invite, claim };
}
