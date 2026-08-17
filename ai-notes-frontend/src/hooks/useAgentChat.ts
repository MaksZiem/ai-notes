import { useMutation } from "@tanstack/react-query";
import { api } from "../api/client";

interface AgentChatResult {
  answer: string;
  steps: { tool: string; args: unknown }[];
}

export function useAgentChat() {
  return useMutation({
    mutationFn: async (message: string) => {
      const { data } = await api.post<AgentChatResult>("/agent/chat", { message });
      return data;
    },
  });
}
