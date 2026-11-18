import { useMutation } from "@tanstack/react-query";
import { api } from "../api/client";

export function useAiContinue() {
  return useMutation({
    mutationFn: async (text: string) => {
      const {data} = await api.post<{ continuation: string }>("/ai/continue", { text });
      return data.continuation
    }
  })
}