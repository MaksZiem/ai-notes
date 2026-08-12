import { createContext, useContext, type ReactNode } from "react"
import { useCurrentUser } from "../hooks/useCurrentUser"

interface Permissions {
  isAdmin: boolean
  isLoading: boolean
}

const PermissionsContext = createContext<Permissions>({isAdmin: false, isLoading: false})

export function PermissionsProvider({children}: {children:  ReactNode}) {
  const {data: User, isLoading} = useCurrentUser()

  return (
    <PermissionsContext.Provider value={{ isAdmin: User?.role === 'ADMIN', isLoading }}>
      {children}
    </PermissionsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePermissions = () =>  useContext(PermissionsContext)