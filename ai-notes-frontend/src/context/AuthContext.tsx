import { createContext, useContext, useState, type ReactNode } from "react"
import { api } from "../api/client"

interface AuthState {
  token: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string, surname: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({children}: {children: ReactNode}) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('token')
  )

  const login = async (email: string, password: string) => {
    const {data } = await api.post('/auth/signin', {email, password})
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
  }

  const signup = async (email: string, password: string, name: string, surname: string) => {
    const { data } = await api.post('/auth/signup', { email, password, name, surname })
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{token, login, signup, logout}}>
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