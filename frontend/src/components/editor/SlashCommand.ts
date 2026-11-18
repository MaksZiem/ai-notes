import { Extension } from "@tiptap/core";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import { SlashMenu, type SlashMenuHandle } from "./SlashMenu";
import { SLASH_COMMANDS, type SlashCommandItem } from "./slashCommands";
import pl from "../../../messages/pl.json";
import en from "../../../messages/en.json";

const suggestion: Partial<SuggestionOptions<SlashCommandItem, SlashCommandItem>> = {
  char: "/",
  startOfLine: false,
  items: ({ query }) => {
    const q = query.toLowerCase();
    return SLASH_COMMANDS.filter((item) =>
      [pl.slash[item.key].title, en.slash[item.key].title].some((title) =>
        title.toLowerCase().includes(q),
      ),
    );
  },
  command: ({ editor, range, props: item }) => {
    item.command({ editor, range });
  },
  render: () => {
    let component: ReactRenderer<SlashMenuHandle>;
    let unmount: (() => void) | undefined;

    return {
      onStart: (props) => {
        component = new ReactRenderer(SlashMenu, {
          props: { items: props.items, command: (item: SlashCommandItem) => props.command(item) },
          editor: props.editor,
        });
        unmount = props.mount(component.element as HTMLElement);
      },
      onUpdate: (props) => {
        component.updateProps({ items: props.items, command: (item: SlashCommandItem) => props.command(item) });
      },
      onKeyDown: (props) => {
        if (props.event.key === "Escape") {
          unmount?.();
          return true;
        }
        return component.ref?.onKeyDown(props) ?? false;
      },
      onExit: () => {
        unmount?.();
        component.destroy();
      },
    };
  },
};

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return { suggestion };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
