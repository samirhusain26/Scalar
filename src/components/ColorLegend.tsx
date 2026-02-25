const legend = [
  { color: 'bg-thermal-green', label: 'Exact' },
  { color: 'bg-thermal-orange', label: 'Hot' },
  { color: 'bg-amber-100 border border-dashed border-amber-400', label: 'Near' },
  { color: 'bg-white border border-charcoal/20', label: 'Miss' },
];

export function ColorLegend() {
  return (
    <div className="flex items-center justify-center gap-3 py-0 pb-1 mb-1 border-b border-graphite opacity-70">
      {legend.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1">
          <div className={`w-3 h-3 shrink-0 ${color}`} />
          <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal/50">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
