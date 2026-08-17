import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Note } from "../types/note";

export function useSemanticSearch(query: string, projectId?: number, enabled = true) {
  return useQuery<Note[]>({
    queryKey: ["notes", "semantic-search", query, projectId],
    queryFn: async () => {
      const { data } = await api.get("/notes/search", { params: { q: query, projectId } });
      return data;
    },
    enabled: enabled && query.trim().length > 0,
  });
}
