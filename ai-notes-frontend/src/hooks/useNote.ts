import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Note } from "../types/note";
import type { NoteMember } from "../types/note-member";

// useNote wszystkie operacje na pojedynczej notatce bez projektu
export function useNote(noteId: number) {
  const queryClient = useQueryClient();

  const invalidateNote = () =>
    queryClient.invalidateQueries({ queryKey: ["notes", noteId] });
  // Tylko dane tej notatki (bez members/share-links) — używane przy
  // częstym autosave treści, gdzie pin/ulubione/lista notatek się nie zmieniają.
  const invalidateNoteOnly = () =>
    queryClient.invalidateQueries({ queryKey: ["notes", noteId], exact: true });
  const invalidateAll = () => {
    invalidateNote();
    queryClient.invalidateQueries({ queryKey: ["notes"] });
  };

  const note = useQuery<Note>({
    queryKey: ["notes", noteId],
    queryFn: async () => {
      const { data } = await api.get(`/notes/${noteId}`);
      return data;
    },
    enabled: !!noteId,
  });

  const members = useQuery<NoteMember[]>({
    queryKey: ["notes", noteId, "members"],
    queryFn: async () => {
      const { data } = await api.get(`/notes/${noteId}/members`);
      return data;
    },
    enabled: !!noteId,
  });

  const updateNote = useMutation({
    mutationFn: (body: {
      title?: string;
      content?: string;
      color?: string | null;
      keywords?: string[];
    }) => api.patch(`/notes/${noteId}`, body),
    onSuccess: invalidateNoteOnly,
  });

  const summarizeNote = useMutation({
    mutationFn: () =>
      api.post<{ summary: string }>(`/notes/${noteId}/summarize`),
  });

  const deleteNote = useMutation({
    mutationFn: () => api.delete(`/notes/${noteId}`),
    onSuccess: invalidateAll,
  });

  const grantAccess = useMutation({
    mutationFn: ({
      userId,
      accessLevel,
    }: {
      userId: number;
      accessLevel?: string;
    }) => api.post(`/notes/${noteId}/members`, { userId, accessLevel }),
    onSuccess: invalidateNote,
  });

  const revokeAccess = useMutation({
    mutationFn: (userId: number) =>
      api.delete(`/notes/${noteId}/members/${userId}`),
    onSuccess: invalidateNote,
  });

  const togglePin = useMutation({
    mutationFn: () => api.patch(`/notes/${noteId}/pin`),
    onSuccess: invalidateAll,
  });

  const toggleFavourite = useMutation({
    mutationFn: () => api.patch(`/notes/${noteId}/favourite`),
    onSuccess: invalidateAll,
  });

  const leaveNote = useMutation({
    mutationFn: () => api.delete(`/notes/${noteId}/leave`),
    onSuccess: invalidateAll,
  });

  const moveNote = useMutation({
    mutationFn: (projectId: number | null) =>
      api.patch(`/notes/${noteId}/move`, { projectId }),
    onSuccess: invalidateAll,
  });

  return {
    note,
    members,
    updateNote,
    summarizeNote,
    deleteNote,
    grantAccess,
    revokeAccess,
    togglePin,
    toggleFavourite,
    leaveNote,
    moveNote,
  };
}
