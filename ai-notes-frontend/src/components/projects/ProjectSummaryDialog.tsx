import { useEffect } from "react";
import { X, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useProjectSummary } from "../../hooks/useProjectSummary";

export function ProjectSummaryDialog({
  projectId,
  onClose,
}: {
  projectId: number;
  onClose: () => void;
}) {
  const { mutate, data, isPending, isError, error } = useProjectSummary(projectId);

  useEffect(() => {
    mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-3xl h-[85vh] flex flex-col rounded-xl border border-white/10 bg-[#15161c] p-6">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-400" />
            Podsumowanie projektu
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {isPending && (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-6 justify-center">
              <Loader2 size={16} className="animate-spin" />
              Analizuję notatki…
            </div>
          )}

          {isError && (
            <p className="text-sm text-red-400 py-2">
              {(error as { response?: { data?: { message?: string } } })
                ?.response?.data?.message ?? "Nie udało się wygenerować podsumowania."}
            </p>
          )}

          {!isPending && !isError && data && (
            <div className="text-sm text-gray-300 leading-relaxed">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-xl font-semibold text-white mt-5 mb-2 first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-base font-semibold text-white mt-5 mb-2 first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wide mt-5 mb-2 first:mt-0">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => <p className="mb-3">{children}</p>,
                  strong: ({ children }) => (
                    <strong className="font-semibold text-gray-100">{children}</strong>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-outside pl-5 mb-3 space-y-1.5">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-outside pl-5 mb-3 space-y-1.5">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => <li>{children}</li>,
                  hr: () => <hr className="border-white/10 my-5" />,
                  a: ({ children, href }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:underline"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {data}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
