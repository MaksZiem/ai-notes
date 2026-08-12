import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Note } from "../types/note";

// useNote wszystkie operacje na pojedynczej notatce bez projektu
export function useNote(noteId: number) {
  const queryClient = useQueryClient();

  const invalidateNote = () =>
    queryClient.invalidateQueries({ queryKey: ["notes", noteId] });
  const invalidateAll = () => {
    invalidateNote();
    queryClient.invalidateQueries({ queryKey: ["notes", "all"] });
  };

  const note = useQuery<Note>({
    queryKey: ["notes", noteId],
    queryFn: async () => {
      const { data } = await api.get(`/notes/${noteId}`);
      return data;
    },
    enabled: !!noteId,
  });

  const members = useQuery({
    queryKey: ["notes", noteId, "members"],
    queryFn: async () => {
      const { data } = await api.get(`/notes/${noteId}/members`);
      return data;
    },
    enabled: !!noteId,
  });

  const updateNote = useMutation({
    mutationFn: (body: { title?: string; content?: string }) =>
      api.patch(`/notes/${noteId}`, body),
    onSuccess: invalidateAll,
  });

  const deleteNote = useMutation({
    mutationFn: () => api.delete(`/notes/${noteId}`),
    onSuccess: invalidateAll,
  });

  const grantAccess = useMutation({
    mutationFn: ({ userId, accessLevel }: { userId: number; accessLevel?: string }) =>
      api.post(`/notes/${noteId}/members`, { userId, accessLevel }),
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

  return { note, members, updateNote, deleteNote, grantAccess, revokeAccess, togglePin, toggleFavourite };
}