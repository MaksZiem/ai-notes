import { Navigate, Outlet } from "react-router-dom"
import { usePermissions } from "../../context/PermissionsContext"

export function AdminRoute() {
  const {isAdmin, isLoading} = usePermissions()
  if(isLoading) return <div>ladowanie...</div>
  return isAdmin ? <Outlet /> : <Navigate to='/403' replace />
}