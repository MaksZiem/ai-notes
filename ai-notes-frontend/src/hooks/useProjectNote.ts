import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Note } from "../types/note";

// useProjectNote wszystkie operacje na pojedynczej notatce w projekcie
export function useProjectNote(projectId: number, noteId: number) {
  const queryClient = useQueryClient();
  const base = `/projects/${projectId}/notes`;

  const invalidateNote = () =>
    queryClient.invalidateQueries({ queryKey: ["notes", "project", projectId, noteId] });
  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: ["notes", "project", projectId] });
  const invalidateAll = () => {
    invalidateNote();
    invalidateList();
  };

  const note = useQuery<Note>({
    queryKey: ["notes", "project", projectId, noteId],
    queryFn: async () => {
      const { data } = await api.get(`${base}/${noteId}`);
      return data;
    },
    enabled: !!projectId && !!noteId,
  });

  const members = useQuery({
    queryKey: ["notes", "project", projectId, noteId, "members"],
    queryFn: async () => {
      const { data } = await api.get(`${base}/${noteId}/members`);
      return data;
    },
    enabled: !!projectId && !!noteId,
  });

  const updateNote = useMutation({
    mutationFn: (body: { title?: string; content?: string }) =>
      api.patch(`${base}/${noteId}`, body),
    onSuccess: invalidateAll,
  });

  const deleteNote = useMutation({
    mutationFn: () => api.delete(`${base}/${noteId}`),
    onSuccess: invalidateAll,
  });

  const grantAccess = useMutation({
    mutationFn: ({ userId, accessLevel }: { userId: number; accessLevel?: string }) =>
      api.post(`${base}/${noteId}/members`, { userId, accessLevel }),
    onSuccess: invalidateNote,
  });

  const revokeAccess = useMutation({
    mutationFn: (userId: number) =>
      api.delete(`${base}/${noteId}/members/${userId}`),
    onSuccess: invalidateNote,
  });

  const togglePin = useMutation({
    mutationFn: () => api.patch(`${base}/${noteId}/pin`),
    onSuccess: invalidateAll,
  });

  const toggleFavourite = useMutation({
    mutationFn: () => api.patch(`${base}/${noteId}/favourite`),
    onSuccess: invalidateAll,
  });

  return { note, members, updateNote, deleteNote, grantAccess, revokeAccess, togglePin, toggleFavourite };
}