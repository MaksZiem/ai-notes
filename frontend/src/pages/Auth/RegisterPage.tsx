import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useTranslations } from "use-intl";
import { useApiErrorMessage } from "../../api/errors";
import LocaleSwitcher from "../../components/layout/LocaleSwitcher";
import { useAuth } from "../../context/AuthContext";
import { useFormWithMutation } from "../../hooks/useForm";
import AuthCard from "./AuthCard";
import Spinner from "../../components/ui/Spinner";

const schema = z
  .object({
    name: z.string().min(1, "nameRequired"),
    surname: z.string().min(1, "surnameRequired"),
    email: z.string().email("emailInvalid"),
    password: z.string().min(6, "passwordMin"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof schema>;

type ErrorKey =
  | "nameRequired"
  | "surnameRequired"
  | "emailInvalid"
  | "passwordMin"
  | "passwordMismatch";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const apiErrorMessage = useApiErrorMessage();
  const fieldError = (message: string | undefined) =>
    message ? t(`errors.${message as ErrorKey}`) : null;
  const { signup } = useAuth();
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
    useFormWithMutation<RegisterFormValues>(
      schema,
      ({ email, password, name, surname }) =>
        signup(email, password, name, surname),
      { onSuccess: () => navigate(redirectTo) }
    );

  const {
    register,
    formState: { errors },
  } = form;

  const inputClass =
    "bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition";

  return (
    <AuthCard>
      <div className="flex justify-end">
        <LocaleSwitcher />
      </div>
      <div className="text-2xl font-semibold text-white text-center my-2 pb-3">
        {t("signUp.title")}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-sm rounded-lg px-4 py-3">
          {apiErrorMessage(error, t("signUp.failed"))}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">{t("fields.name")}</label>
          <input
            type="text"
            placeholder={t("fields.namePlaceholder")}
            {...register("name")}
            className={inputClass}
          />
          {errors.name && (
            <span className="text-red-400 text-xs">{fieldError(errors.name.message)}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">{t("fields.surname")}</label>
          <input
            type="text"
            placeholder={t("fields.surnamePlaceholder")}
            {...register("surname")}
            className={inputClass}
          />
          {errors.surname && (
            <span className="text-red-400 text-xs">
              {fieldError(errors.surname.message)}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">{t("fields.email")}</label>
          <input
            type="text"
            inputMode="email"
            autoComplete="email"
            placeholder={t("fields.emailPlaceholder")}
            {...register("email")}
            className={inputClass}
          />
          {errors.email && (
            <span className="text-red-400 text-xs">{fieldError(errors.email.message)}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">{t("fields.password")}</label>
          <input
            type="password"
            placeholder="••••••••"
            {...register("password")}
            className={inputClass}
          />
          {errors.password && (
            <span className="text-red-400 text-xs">
              {fieldError(errors.password.message)}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">{t("fields.confirmPassword")}</label>
          <input
            type="password"
            placeholder="••••••••"
            {...register("confirmPassword")}
            className={inputClass}
          />
          {errors.confirmPassword && (
            <span className="text-red-400 text-xs">
              {fieldError(errors.confirmPassword.message)}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-5 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 transition cursor-pointer"
        >
          {isLoading ? <Spinner /> : t("signUp.submit")}
        </button>
        <button
          type="button"
          onClick={() =>
            navigate(
              shareToken
                ? `/login?shareToken=${shareToken}`
                : projectInviteToken
                  ? `/login?projectInviteToken=${projectInviteToken}`
                  : "/login",
            )
          }
          className="w-full text-sm text-gray-400"
        >
          {t("signUp.hasAccount")}{" "}
          <span className="text-indigo-400 cursor-pointer">{t("signUp.toSignIn")}</span>
        </button>
      </form>
    </AuthCard>
  );
}
