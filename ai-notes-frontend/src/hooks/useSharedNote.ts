import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { AccessLevel } from "../types/note-share-links";
import type { NoteOwner } from "../types/note";

interface SharedNoteResponse {
  note: { id: number; title: string; content: string; owner?: NoteOwner };
  accessLevel: AccessLevel;
}

export function useSharedNote(token: string) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["shared", token] });

  const shared = useQuery<SharedNoteResponse>({
    queryKey: ["shared", token],
    queryFn: async () => {
      const { data } = await api.get(`/shared/${token}`);
      return data;
    },
    enabled: !!token,
    retry: false,
  });

  const save = useMutation({
    mutationFn: (body: { content: string }) =>
      api.patch(`/shared/${token}`, body),
    onSuccess: invalidate,
  });

  const claim = useMutation({
    mutationFn: () => api.post(`/shared/${token}/claim`),
  });

  return { shared, save, claim };
}
