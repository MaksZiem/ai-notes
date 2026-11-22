import ImageExtension from "@tiptap/extension-image";
import { toDisplayImageSrc, toStoredImageSrc } from "../../utils/uploadUrl";

export const NoteImage = ImageExtension.extend({
  addAttributes() {
    const parent = this.parent?.() ?? {};
    return {
      ...parent,
      src: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const src = element.getAttribute("src");
          return src ? toStoredImageSrc(src) : null;
        },
        renderHTML: (attributes: Record<string, unknown>) =>
          typeof attributes.src === "string" ? { src: toDisplayImageSrc(attributes.src) } : {},
      },
    };
  },
});
