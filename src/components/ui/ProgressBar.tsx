interface ProgressBarProps {
  value: number; // 0-100
  showLabel?: boolean;
}

export default function ProgressBar({ value, showLabel = true }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const color =
    clamped === 100
      ? "bg-emerald-500"
      : clamped >= 50
      ? "bg-teal-500"
      : "bg-emerald-400";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`${color} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-500 w-8 text-right font-medium">{clamped}%</span>
      )}
    </div>
  );
}
