export function NoteCardSkeleton() {
  return (
    <div className="flex flex-col bg-[#1a1b23] border border-white/[0.06] rounded-2xl p-5 h-44 animate-pulse">
      <div className="h-3.5 w-2/3 bg-white/[0.07] rounded mb-3" />
      <div className="h-2.5 w-full bg-white/[0.05] rounded mb-1.5" />
      <div className="h-2.5 w-5/6 bg-white/[0.05] rounded mb-1.5" />
      <div className="h-2.5 w-4/6 bg-white/[0.05] rounded" />
      <div className="flex-1" />
      <div className="h-2 w-1/3 bg-white/[0.04] rounded mt-3" />
    </div>
  );
}