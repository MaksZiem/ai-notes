import { useMutation } from "@tanstack/react-query";
import { api } from "../api/client";

export function useImageUpload() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post<{ url: string }>("/uploads/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return `${api.defaults.baseURL}${data.url}`;
    },
  });
}
