import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/user";

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  surname: string
}

export function useCurrentUser() {
  const { isAuthenticated } = useAuth();

  return useQuery<User>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data } = await api.get("/auth/context");
      return data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  });
}
