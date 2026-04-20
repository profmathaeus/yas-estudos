"use client";

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  colorClass?: string;
}

export function ProgressBar({ value, max, label, colorClass = "bg-yas-burgundy" }: ProgressBarProps) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-xs font-body text-yas-ink/60">{label}</span>
          <span className="text-xs font-body font-semibold text-yas-ink/80">{pct}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-yas-lavender/20 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
