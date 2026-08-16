import { useMutation } from "@tanstack/react-query";
import { api } from "../api/client";

export function useAiTitle() {
  return useMutation({
    mutationFn: async (content: string) => {
      const {data} = await api.post<{title: string}>("/ai/title", {content})
      return data.title
    }
  })
}