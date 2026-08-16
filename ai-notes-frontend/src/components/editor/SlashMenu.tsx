import { forwardRef, useImperativeHandle, useState } from "react";
import type { SlashCommandItem } from "./slashCommands";

interface SlashMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export interface SlashMenuHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const SlashMenu = forwardRef<SlashMenuHandle, SlashMenuProps>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [prevItems, setPrevItems] = useState(items);

  if (items !== prevItems) {
    setPrevItems(items);
    setSelectedIndex(0);
  }

  const select = (index: number) => {
    const item = items[index];
    if (item) command(item);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowDown") {
        setSelectedIndex((i) => (i + 1) % items.length);
        return true;
      }
      if (event.key === "ArrowUp") {
        setSelectedIndex((i) => (i - 1 + items.length) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        select(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="w-72 bg-[#1e1f29] border border-white/10 rounded-xl shadow-2xl p-3 text-xs text-gray-500">
        Brak pasujących komend
      </div>
    );
  }

  return (
    <div className="w-72 max-h-80 overflow-y-auto bg-[#1e1f29] border border-white/10 rounded-xl shadow-2xl p-1.5">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            key={item.title}
            type="button"
            onClick={() => select(index)}
            onMouseEnter={() => setSelectedIndex(index)}
            className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors ${
              index === selectedIndex ? "bg-indigo-500/15" : "hover:bg-white/5"
            }`}
          >
            <span className="w-8 h-8 rounded-md bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0 text-gray-300">
              <Icon size={15} />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-gray-200 truncate">{item.title}</span>
              <span className="block text-[11px] text-gray-500 truncate">{item.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
});
SlashMenu.displayName = "SlashMenu";
