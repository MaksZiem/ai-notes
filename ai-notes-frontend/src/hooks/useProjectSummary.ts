import { useMutation } from "@tanstack/react-query";
import { api } from "../api/client";

export function useProjectSummary(projectId: number) {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ summary: string }>(
        `/ai/projects/${projectId}/summary`,
      );
      return data.summary;
    },
  });
}
