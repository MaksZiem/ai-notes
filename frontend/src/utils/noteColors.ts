const TAG_PALETTE = [
  { bg: "rgba(99,  102, 241, 0.12)", text: "#a5b4fc" },
  { bg: "rgba(139, 92,  246, 0.12)", text: "#c4b5fd" },
  { bg: "rgba(236, 72,  153, 0.12)", text: "#f9a8d4" },
  { bg: "rgba(20,  184, 166, 0.12)", text: "#5eead4" },
  { bg: "rgba(245, 158, 11,  0.12)", text: "#fcd34d" },
  { bg: "rgba(16,  185, 129, 0.12)", text: "#6ee7b7" },
  { bg: "rgba(14,  165, 233, 0.12)", text: "#7dd3fc" },
  { bg: "rgba(244, 63,  94,  0.12)", text: "#fda4af" },
  { bg: "rgba(168, 85,  247, 0.12)", text: "#d8b4fe" },
  { bg: "rgba(251, 146, 60,  0.12)", text: "#fdba74" },
];

export function tagColor(tag: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  }
  return TAG_PALETTE[hash % TAG_PALETTE.length];
}