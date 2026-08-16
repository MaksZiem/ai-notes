import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export function useNoteQuickActions(noteId: number) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notes"] });

  const togglePin = useMutation({
    mutationFn: () => api.patch(`/notes/${noteId}/pin`),
    onSuccess: invalidate,
  });

  const toggleFavourite = useMutation({
    mutationFn: () => api.patch(`/notes/${noteId}/favourite`),
    onSuccess: invalidate,
  });

  const deleteNote = useMutation({
    mutationFn: () => api.delete(`/notes/${noteId}`),
    onSuccess: invalidate,
  });

  return { togglePin, toggleFavourite, deleteNote };
}
