import axios from "axios";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../../context/AuthContext";
import { useFormWithMutation } from "../../hooks/useForm";
import AuthCard from "./AuthCard";
import Spinner from "../../components/ui/Spinner";

const schema = z
  .object({
    name: z.string().min(1, "Imię jest wymagane"),
    surname: z.string().min(1, "Nazwisko jest wymagane"),
    email: z.string().email("Nieprawidłowy email"),
    password: z.string().min(6, "Hasło musi mieć min. 6 znaków"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są zgodne",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const { form, onSubmit, isLoading, error } =
    useFormWithMutation<RegisterFormValues>(
      schema,
      ({ email, password, name, surname }) =>
        signup(email, password, name, surname),
      { onSuccess: () => navigate("/notes") }
    );

  const {
    register,
    formState: { errors },
  } = form;

  const inputClass =
    "bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition";

  return (
    <AuthCard>
      <div className="text-2xl font-semibold text-white text-center my-2 pb-3">
        Rejestracja
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-sm rounded-lg px-4 py-3">
          {axios.isAxiosError(error)
            ? error.message ?? "Wystąpił błąd rejestracji"
            : (error as Error).message}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Imię</label>
          <input
            type="text"
            placeholder="Jan"
            {...register("name")}
            className={inputClass}
          />
          {errors.name && (
            <span className="text-red-400 text-xs">{errors.name.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Nazwisko</label>
          <input
            type="text"
            placeholder="Kowalski"
            {...register("surname")}
            className={inputClass}
          />
          {errors.surname && (
            <span className="text-red-400 text-xs">
              {errors.surname.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Email</label>
          <input
            type="text"
            inputMode="email"
            autoComplete="email"
            placeholder="jan@example.com"
            {...register("email")}
            className={inputClass}
          />
          {errors.email && (
            <span className="text-red-400 text-xs">{errors.email.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Hasło</label>
          <input
            type="password"
            placeholder="••••••••"
            {...register("password")}
            className={inputClass}
          />
          {errors.password && (
            <span className="text-red-400 text-xs">
              {errors.password.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Potwierdź hasło</label>
          <input
            type="password"
            placeholder="••••••••"
            {...register("confirmPassword")}
            className={inputClass}
          />
          {errors.confirmPassword && (
            <span className="text-red-400 text-xs">
              {errors.confirmPassword.message}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-5 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 transition cursor-pointer"
        >
          {isLoading ? <Spinner /> : "Zarejestruj się"}
        </button>
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full text-sm text-gray-400"
        >
          Masz już konto?{" "}
          <span className="text-indigo-400 cursor-pointer">Zaloguj się</span>
        </button>
      </form>
    </AuthCard>
  );
}
