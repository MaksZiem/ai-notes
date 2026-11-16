import { useFormWithMutation } from "../../hooks/useForm";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useTranslations } from "use-intl";
import { useApiErrorMessage } from "../../api/errors";
import LocaleSwitcher from "../../components/layout/LocaleSwitcher";
import AuthCard from "./AuthCard";
import Spinner from "../../components/ui/Spinner";

const schema = z.object({
  email: z.string().email("emailInvalid"),
  password: z.string().min(1, "passwordRequired"),
});

type LoginFormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const t = useTranslations("auth");
  const apiErrorMessage = useApiErrorMessage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shareToken = searchParams.get("shareToken");
  const projectInviteToken = searchParams.get("projectInviteToken");
  const redirectTo = shareToken
    ? `/shared/${shareToken}`
    : projectInviteToken
      ? `/project-invites/${projectInviteToken}`
      : "/notes";

  const { form, onSubmit, isLoading, error } =
    useFormWithMutation<LoginFormValues>(
      schema,
      ({ email, password }) => login(email, password),
      {
        onSuccess: () => navigate(redirectTo),
      }
    );

  const {
    register,
    formState: { errors },
  } = form;

  return (
    <AuthCard>
      <div className="flex justify-end">
        <LocaleSwitcher />
      </div>
      <div className="text-2xl font-semibold text-white text-center my-2 pb-3">
        {t("signIn.title")}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-sm rounded-lg px-4 py-3">
          {apiErrorMessage(error, t("signIn.failed"))}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">{t("fields.email")}</label>
          <input
            type="email"
            {...register("email")}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            placeholder={t("fields.emailPlaceholder")}
          />
          {errors.email && (
            <span className="text-red-400 text-xs">{t(`errors.${errors.email.message as "emailInvalid"}`)}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">{t("fields.password")}</label>
          <input
            type="password"
            {...register("password")}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            placeholder="••••••••"
          />
          {errors.password && (
            <span className="text-red-400 text-xs">
              {t(`errors.${errors.password.message as "passwordRequired"}`)}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-5 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 transition cursor-pointer"
        >
          {isLoading ? <Spinner /> : t("signIn.submit")}
        </button>
        <button
          type="button"
          onClick={() =>
            navigate(
              shareToken
                ? `/register?shareToken=${shareToken}`
                : projectInviteToken
                  ? `/register?projectInviteToken=${projectInviteToken}`
                  : "/register",
            )
          }
          className="w-full text-sm text-gray-400"
        >
          {t("signIn.noAccount")}{" "}
          <span className="text-indigo-400 cursor-pointer">{t("signIn.toSignUp")}</span>
        </button>
      </form>
    </AuthCard>
  );
}
