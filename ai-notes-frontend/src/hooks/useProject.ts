import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Project } from "../types/project";

export function useProject(projectId: number) {
  const queryClient = useQueryClient();

  const invalidateProject = () =>
    queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  const invalidateMembers = () =>
    queryClient.invalidateQueries({ queryKey: ["projects", projectId, "members"] });
  const invalidateAll = () => {
    invalidateProject();
    invalidateList();
  };

  const project = useQuery<Project>({
    queryKey: ["projects", projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}`);
      return data;
    },
    enabled: !!projectId,
  });

  const members = useQuery({
    queryKey: ["projects", projectId, "members"],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/members`);
      return data;
    },
    enabled: !!projectId,
  });

  const updateProject = useMutation({
    mutationFn: (body: { name?: string; description?: string }) =>
      api.patch(`/projects/${projectId}`, body),
    onSuccess: invalidateAll,
  });

  const deleteProject = useMutation({
    mutationFn: () => api.delete(`/projects/${projectId}`),
    onSuccess: invalidateAll,
  });

  const togglePin = useMutation({
    mutationFn: () => api.patch(`/projects/${projectId}/pin`),
    onSuccess: invalidateAll,
  });

  const toggleFavourite = useMutation({
    mutationFn: () => api.patch(`/projects/${projectId}/favourite`),
    onSuccess: invalidateAll,
  });

  const grantAccess = useMutation({
    mutationFn: ({ userId, accessLevel }: { userId: number; accessLevel?: string }) =>
      api.post(`/projects/${projectId}/members`, { userId, accessLevel }),
    onSuccess: invalidateMembers,
  });

  const revokeAccess = useMutation({
    mutationFn: (userId: number) =>
      api.delete(`/projects/${projectId}/members/${userId}`),
    onSuccess: invalidateMembers,
  });

  return { project, members, updateProject, deleteProject, togglePin, toggleFavourite, grantAccess, revokeAccess };
}