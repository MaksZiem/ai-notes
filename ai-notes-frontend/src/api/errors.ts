import axios from "axios";
import { useMessages, useTranslations } from "use-intl";

type ApiErrorMessages = ReturnType<typeof useMessages>["apiErrors"];
type ApiErrorCode = keyof ApiErrorMessages;

export function useApiErrorMessage() {
  const t = useTranslations("apiErrors");
  const known: ApiErrorMessages = useMessages().apiErrors;
  const isKnown = (code: unknown): code is ApiErrorCode =>
    typeof code === "string" && code in known;

  return (error: unknown, fallback: string): string => {
    if (!axios.isAxiosError(error)) return fallback;
    const code: unknown = error.response?.data?.code;
    return isKnown(code) ? t(code) : fallback;
  };
}
