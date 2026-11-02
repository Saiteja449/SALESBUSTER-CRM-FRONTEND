export default function InsightCard({
  icon: Icon,
  title,
  category,
  prompt,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-3.5 rounded-2xl bg-bg-card hover:bg-bg-secondary/40 border border-border-main hover:border-purple-500/40 transition-all text-left flex items-start gap-3.5 group cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
    >
      <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 group-hover:scale-105 group-hover:bg-purple-600 group-hover:text-white transition-all">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-xs font-bold text-text-primary block leading-tight truncate">
            {title}
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-bg-secondary text-text-secondary font-medium shrink-0">
            {category}
          </span>
        </div>
        <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
          {prompt}
        </p>
      </div>
    </button>
  );
}
