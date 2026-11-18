import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { NoteShareLink } from "../types/note-share-links";

export function useNoteShareLinks(noteId: number) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    return queryClient.invalidateQueries({
      queryKey: ["notes", noteId, "share-links"],
    });
  };

  const shareLinks = useQuery<NoteShareLink[]>({
    queryKey: ["notes", noteId, "share-links"],
    queryFn: async () => {
      const {data} = await api.get(`/notes/${noteId}/share-links`)
      return data
    },
    enabled: !!noteId
  });

  const createShareLink = useMutation({
     mutationFn: (body: { accessLevel?: string; expiresInDays?: number; email?: string }) =>
      api.post(`/notes/${noteId}/share-links`, body),
     onSuccess: invalidate
  })

  const revokeShareLink = useMutation({
    mutationFn: (linkId: number) => 
      api.delete(`/notes/${noteId}/share-links/${linkId}`),
      onSuccess: invalidate
  })

  return {shareLinks, createShareLink, revokeShareLink}
}
