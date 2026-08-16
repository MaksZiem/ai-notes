import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Note } from "../types/note";

// useNotes lista wszystkich notatek + createNote
export function useNotes(filters?: { pinned?: boolean; favourite?: boolean; limit?: number; search?: string }) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["notes", "all"] });

  const notes = useQuery<Note[]>({
    queryKey: ["notes", "all", filters],
    queryFn: async () => {
      const { data } = await api.get("/notes", { params: filters });
      return data;
    },
  });

  const createNote = useMutation({
    mutationFn: (body: { title: string; content?: string; projectId?: number; color?: string; keywords?: string[] }) =>
      api.post("/notes", body),
    onSuccess: invalidate,
  });

  return { notes, createNote };
}