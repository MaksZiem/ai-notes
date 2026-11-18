import { useMutation } from "@tanstack/react-query";
import { api } from "../api/client";
import type { RewriteMode } from "../components/editor/AiRewriteButton";

export function useAiRewrite() {
  return useMutation({
    mutationFn: async ({
      text,
      mode,
      instruction,
    }: {
      text: string;
      mode: RewriteMode;
      instruction?: string;
    }) => {
      const { data } = await api.post<{ result: string }>("/ai/rewrite", {
        text,
        mode,
        instruction,
      });
      return data.result;
    },
  });
}
