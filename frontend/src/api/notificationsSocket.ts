import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "./client";

let socket: Socket | null = null;

export function getNotificationsSocket(): Socket {
  if (socket) return socket;
  socket = io(`${API_BASE_URL}/notifications`, {
    withCredentials: true,
    transports: ["websocket"],
  });
  return socket;
}

export function disconnectNotificationsSocket() {
  socket?.disconnect();
  socket = null;
}
