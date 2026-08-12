import { useFormWithMutation } from "../../hooks/useForm";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import axios from "axios";
import AuthCard from "./AuthCard";
import Spinner from "../../components/ui/Spinner";

const schema = z.object({
  email: z.string().email("Nieprawidłowy email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

type LoginFormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const { form, onSubmit, isLoading, error } =
    useFormWithMutation<LoginFormValues>(
      schema,
      ({ email, password }) => login(email, password),
      {
        onSuccess: () => navigate("/notes"),
      }
    );

  const {
    register,
    formState: { errors },
  } = form;

  return (
    <AuthCard>
      <div className="text-2xl font-semibold text-white text-center my-2 pb-3">
        Logowanie
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-sm rounded-lg px-4 py-3">
          {axios.isAxiosError(error)
            ? error.message ?? "Wystąpił błąd logowania"
            : (error as Error).message}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Email</label>
          <input
            type="email"
            {...register("email")}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            placeholder="jan@example.com"
          />
          {errors.email && (
            <span className="text-red-400 text-xs">{errors.email.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Hasło</label>
          <input
            type="password"
            {...register("password")}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            placeholder="••••••••"
          />
          {errors.password && (
            <span className="text-red-400 text-xs">
              {errors.password.message}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-5 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 transition cursor-pointer"
        >
          {isLoading ? <Spinner /> : "Zaloguj się"}
        </button>
        <button
          type="button"
          onClick={() => navigate("/register")}
          className="w-full text-sm text-gray-400"
        >
          Nie masz konta?{" "}
          <span className="text-indigo-400 cursor-pointer">Zarejestruj się</span>
        </button>
      </form>
    </AuthCard>
  );
}
