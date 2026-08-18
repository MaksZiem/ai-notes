import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Notification } from "../types/notification";

// na razie polling zamiast websocketów — do wymiany później
const POLL_INTERVAL = 30_000;

export function useNotifications() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const notifications = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get("/notifications");
      return data;
    },
    refetchInterval: POLL_INTERVAL,
    refetchOnWindowFocus: true,
  });

  const unreadCount = useQuery<{ count: number }>({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const { data } = await api.get("/notifications/unread-count");
      return data;
    },
    refetchInterval: POLL_INTERVAL,
    refetchOnWindowFocus: true,
  });

  const markAsRead = useMutation({
    mutationFn: (id: number) => api.patch(`/notifications/${id}/read`),
    onSuccess: invalidate,
  });

  const markAllAsRead = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: invalidate,
  });

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}
