import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Notification } from "../types/notification";
import { useAuth } from "../context/AuthContext";
import { getNotificationsSocket } from "../api/notificationsSocket";

const POLL_INTERVAL = 60_000;

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["notifications"] });

  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getNotificationsSocket();
    socket.on("notifications:changed", invalidate);
    return () => {
      socket.off("notifications:changed", invalidate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

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
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: invalidate,
  });

  const markAllAsRead = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: invalidate,
  });

  const acceptInvite = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/accept`),
    onSuccess: invalidate,
  });

  const declineInvite = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/decline`),
    onSuccess: invalidate,
  });

  return { notifications, unreadCount, markAsRead, markAllAsRead, acceptInvite, declineInvite };
}
