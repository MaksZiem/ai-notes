import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Note } from "../types/note";

// useProjectNotes lista notatek w projekcie + createNote
export function useProjectNotes(projectId: number, filters?: { pinned?: boolean; favourite?: boolean }) {
  const queryClient = useQueryClient();
  const base = `/projects/${projectId}/notes`;
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["notes", "project", projectId] });

  const notes = useQuery<Note[]>({
    queryKey: ["notes", "project", projectId, filters],
    queryFn: async () => {
      const { data } = await api.get(base, { params: filters });
      return data;
    },
    enabled: !!projectId,
  });

  const createNote = useMutation({
    mutationFn: (body: { title: string; content?: string }) =>
      api.post(base, body),
    onSuccess: invalidate,
  });

  return { notes, createNote };
}