import { useMutation } from "@tanstack/react-query";
import { api } from "../api/client";

interface RagChatResult {
  answer: string;
  sources: { id: number; title: string }[];
}

export function useRagChat() {
  return useMutation({
    mutationFn: async (question: string) => {
      const { data } = await api.post<RagChatResult>("/notes/chat", { question });
      return data;
    },
  });
}
