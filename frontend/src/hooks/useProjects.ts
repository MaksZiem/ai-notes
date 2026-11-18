import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Project } from "../types/project";

export function useProjects(filters?: { pinned?: boolean; favourite?: boolean }) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["projects"] });

  const projects = useQuery<Project[]>({
    queryKey: ["projects", filters],
    queryFn: async () => {
      const { data } = await api.get("/projects", { params: filters });
      return data;
    },
  });

  const recentProjects = useQuery<Project[]>({
    queryKey: ["projects", "recent"],
    queryFn: async () => {
      const { data } = await api.get("/projects/recent");
      return data;
    },
  });

  const createProject = useMutation({
    mutationFn: (body: { name: string; description?: string; color?: string }) =>
      api.post("/projects", body),
    onSuccess: invalidate,
  });

  return { projects, recentProjects, createProject };
}