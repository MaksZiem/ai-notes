import { useState } from "react";
import axios from "axios";
import type { Editor } from "@tiptap/react";
import { Send, X, Loader2, Bot } from "lucide-react";
import { useAgentChat } from "../../hooks/useAgentChat";

function getErrorMessage(error: unknown): string {
  return axios.isAxiosError(error)
    ? (error.message ?? "Coś poszło nie tak, spróbuj ponownie.")
    : "Coś poszło nie tak, spróbuj ponownie.";
}

interface AgentPanelMessage {
  role: "user" | "assistant";
  content: string;
  steps?: { tool: string; args: unknown; result: unknown }[];
}

interface NoteAgentPanelProps {
  noteId: number;
  projectId?: number;
  editor: Editor;
  onTitleChange: (title: string) => void;
  onClose: () => void;
}

export function NoteAgentPanel({
  noteId,
  projectId,
  editor,
  onTitleChange,
  onClose,
}: NoteAgentPanelProps) {
  const [messages, setMessages] = useState<AgentPanelMessage[]>([]);
  const [input, setInput] = useState("");
  const agentChat = useAgentChat();

  const handleSend = () => {
    const question = input.trim();
    if (!question || agentChat.isPending) return;
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");

    agentChat.mutate(
      { message: question, noteId, projectId },
      {
        onSuccess: (result) => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: result.answer, steps: result.steps },
          ]);

          const updateStep = result.steps.find(
            (s) =>
              s.tool === "update_current_note" &&
              (s.result as { id?: number } | undefined)?.id === noteId,
          );
          if (updateStep) {
            const r = updateStep.result as { title: string; content: string };
            onTitleChange(r.title);
            editor.commands.setContent(r.content, { emitUpdate: false });
          }
        },
        onError: (error) => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: getErrorMessage(error) },
          ]);
        },
      },
    );
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-[400px] bg-[#15161c] border-l border-white/10 shadow-2xl z-40 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
          <Bot size={15} className="text-indigo-400" />
          Agent notatki
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-sm text-gray-600">
            Poproś agenta o zmiany w tej notatce, np. „napisz notatkę o top 3
            firmach IT w Polsce”.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-full rounded-xl px-3 py-2.5 text-sm ${
              m.role === "user"
                ? "self-end bg-indigo-600 text-white"
                : "self-start bg-[#1a1b23] border border-white/[0.06] text-gray-200"
            }`}
          >
            <p className="m-0 whitespace-pre-wrap">{m.content}</p>
            {m.steps && m.steps.length > 0 && (
              <div className="flex flex-col gap-1 mt-2 text-[11px] text-gray-500">
                {m.steps.map((s, i) => (
                  <span key={i}>🔧 {s.tool}({JSON.stringify(s.args)})</span>
                ))}
              </div>
            )}
          </div>
        ))}
        {agentChat.isPending && (
          <div className="self-start flex items-center gap-2 text-gray-500 text-sm">
            <Loader2 size={14} className="animate-spin" />
            Agent pracuje...
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-white/[0.06] flex items-center gap-2 flex-shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="Napisz polecenie dla agenta..."
          className="flex-1 bg-white/[0.04] border border-white/[0.07] focus:border-indigo-500/60 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none"
        />
        <button
          onClick={handleSend}
          disabled={agentChat.isPending || !input.trim()}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors duration-150"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
