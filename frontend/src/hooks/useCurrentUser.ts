import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/user";

interface User {
  id: number;
  email: string;
  role: UserRole;
  name: string;
  surname: string
}

export function useCurrentUser() {
  const { token } = useAuth();

  return useQuery<User>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data } = await api.get("/auth/context");
      return data;
    },
    enabled: !!token,
    staleTime: 5 * 60_000,
  });
}
