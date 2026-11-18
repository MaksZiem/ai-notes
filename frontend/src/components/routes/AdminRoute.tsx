import { Navigate, Outlet } from "react-router-dom"
import { useTranslations } from "use-intl"
import { usePermissions } from "../../context/PermissionsContext"

export function AdminRoute() {
  const t = useTranslations("common")
  const {isAdmin, isLoading} = usePermissions()
  if(isLoading) return <div>{t("loading")}</div>
  return isAdmin ? <Outlet /> : <Navigate to='/403' replace />
}