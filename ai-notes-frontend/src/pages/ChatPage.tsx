import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Sparkles, Loader2 } from "lucide-react";
import Sidebar from "../components/layout/SideBar/SideBar";
import { useRagChat } from "../hooks/useRagChat";
import { useAgentChat } from "../hooks/useAgentChat";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: { id: number; title: string }[];
  steps?: { tool: string; args: unknown }[];
}

export default function ChatPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [agentMode, setAgentMode] = useState(false);
  const ragChat = useRagChat();
  const agentChat = useAgentChat();
  const isPending = ragChat.isPending || agentChat.isPending;

  const handleSend = () => {
    const question = input.trim();
    if (!question || isPending) return;
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");

    if (agentMode) {
      agentChat.mutate(question, {
        onSuccess: (result) => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: result.answer, steps: result.steps },
          ]);
        },
        onError: () => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Coś poszło nie tak, spróbuj ponownie." },
          ]);
        },
      });
    } else {
      ragChat.mutate(question, {
        onSuccess: (result) => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: result.answer, sources: result.sources },
          ]);
        },
        onError: () => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Coś poszło nie tak, spróbuj ponownie." },
          ]);
        },
      });
    }
  };

  return (
    <div className="flex h-screen bg-[#0f1014]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight leading-none m-0">
            Chat z notatkami
          </h1>
          <button
            onClick={() => setAgentMode((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              agentMode
                ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400"
                : "bg-white/[0.04] border-white/[0.07] text-gray-500 hover:text-gray-300"
            }`}
          >
            Tryb agenta {agentMode ? "(WŁ)" : "(WYŁ)"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-4">
          {messages.length === 0 && (
            <p className="text-sm text-gray-600">
              Zapytaj o coś z Twoich notatek, np. „co ustaliłem w projekcie X?”
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-2xl rounded-xl px-4 py-3 text-sm ${
                m.role === "user"
                  ? "self-end bg-indigo-600 text-white"
                  : "self-start bg-[#1a1b23] border border-white/[0.06] text-gray-200"
              }`}
            >
              <p className="m-0 whitespace-pre-wrap">{m.content}</p>
              {m.sources && m.sources.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {m.sources.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => navigate(`/notes/${s.id}`)}
                      className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-white/[0.06] text-gray-400 hover:text-indigo-400 transition-colors"
                    >
                      <Sparkles size={10} />
                      {s.title}
                    </button>
                  ))}
                </div>
              )}
              {m.steps && m.steps.length > 0 && (
                <div className="flex flex-col gap-1 mt-2 text-[11px] text-gray-500">
                  {m.steps.map((s, i) => (
                    <span key={i}>🔧 {s.tool}({JSON.stringify(s.args)})</span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isPending && (
            <div className="self-start flex items-center gap-2 text-gray-500 text-sm">
              <Loader2 size={14} className="animate-spin" />
              {agentMode ? "Agent pracuje..." : "Szukam w notatkach..."}
            </div>
          )}
        </div>

        <div className="px-8 py-5 border-t border-white/[0.06] flex items-center gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            placeholder="Zapytaj o swoje notatki..."
            className="flex-1 bg-white/[0.04] border border-white/[0.07] focus:border-indigo-500/60 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none"
          />
          <button
            onClick={handleSend}
            disabled={isPending || !input.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors duration-150"
          >
            <Send size={15} />
          </button>
        </div>
      </main>
    </div>
  );
}
