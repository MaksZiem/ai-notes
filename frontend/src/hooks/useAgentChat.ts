import { useMutation } from "@tanstack/react-query";
import { api } from "../api/client";

export interface AgentStep {
  tool: string;
  args: unknown;
  result: unknown;
}

interface AgentChatResult {
  answer: string;
  steps: AgentStep[];
}

interface AgentChatPayload {
  message: string;
  noteId?: number;
  projectId?: number;
}

export function useAgentChat() {
  return useMutation({
    mutationFn: async (payload: AgentChatPayload) => {
      const { data } = await api.post<AgentChatResult>("/agent/chat", payload);
      return data;
    },
  });
}
