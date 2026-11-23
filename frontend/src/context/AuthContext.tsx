import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { api } from "../api/client"
import { disconnectNotificationsSocket } from "../api/notificationsSocket"

type AuthStatus = "checking" | "authenticated" | "anonymous"

interface AuthState {
  status: AuthStatus
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string, surname: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({children}: {children: ReactNode}) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AuthStatus>("checking")

  useEffect(() => {
    let active = true
    api
      .get("/auth/context", { skipAuthRedirect: true })
      .then(({ data }) => {
        if (!active) return
        queryClient.setQueryData(["currentUser"], data)
        setStatus("authenticated")
      })
      .catch(() => {
        if (active) setStatus("anonymous")
      })
    return () => {
      active = false
    }
  }, [queryClient])

  const claimPendingShareLink = async () => {
    const shareToken = new URLSearchParams(window.location.search).get('shareToken')
    if (!shareToken) return
    try {
      await api.post(`/shared/${shareToken}/claim`)
    } catch {
      // link mógł wygasnąć/zostać odwołany — nie blokujemy logowania z tego powodu
    }
  }

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/signin", { email, password }, { skipAuthRedirect: true })
    queryClient.setQueryData(["currentUser"], data)
    setStatus("authenticated")
    await claimPendingShareLink()
  }

  const signup = async (email: string, password: string, name: string, surname: string) => {
    const { data } = await api.post("/auth/signup", { email, password, name, surname }, { skipAuthRedirect: true })
    queryClient.setQueryData(["currentUser"], data)
    setStatus("authenticated")
    await claimPendingShareLink()
  }

  const logout = async () => {
    try {
      await api.post("/auth/signout", undefined, { skipAuthRedirect: true })
    } finally {
      disconnectNotificationsSocket()
      queryClient.clear()
      setStatus("anonymous")
    }
  }

  return (
    <AuthContext.Provider value={{ status, isAuthenticated: status === "authenticated", login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if(!ctx) throw new Error('Something went wrong')
  return ctx
}