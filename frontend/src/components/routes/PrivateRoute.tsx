import { Navigate, Outlet } from "react-router-dom"
import { useTranslations } from "use-intl"
import { useAuth } from "../../context/AuthContext"

export function PrivateRoute() {
  const t = useTranslations("common")
  const { status } = useAuth()
  if (status === "checking") return <div>{t("loading")}</div>
  return status === "authenticated" ? <Outlet /> : <Navigate to="/login" replace />
}
