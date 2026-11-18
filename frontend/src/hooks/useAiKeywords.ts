import { useMutation } from "@tanstack/react-query";
import { api } from "../api/client";

export function useAiKeywords() {
  return useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post<{ keywords: string[] }>("/ai/keywords", {
        content,
      });
      return data.keywords;
    },
  });
}
