import { useMutation } from "@tanstack/react-query";
import { api } from "../api/client";

export function useAiGenerate() {
  return useMutation({
    mutationFn: async (prompt: string) => {
      const { data } = await api.post<{ content: string }>("/ai/generate", { prompt });
      return data.content;
    }
  })
}
