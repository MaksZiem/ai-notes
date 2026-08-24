import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "./client";

let socket: Socket | null = null;
let socketToken: string | null = null;

export function getNotificationsSocket(token: string): Socket {
  if (socket && socketToken === token) return socket;

  socket?.disconnect();
  socketToken = token;
  socket = io(`${API_BASE_URL}/notifications`, {
    auth: { token },
    transports: ["websocket"],
  });
  return socket;
}

export function disconnectNotificationsSocket() {
  socket?.disconnect();
  socket = null;
  socketToken = null;
}
