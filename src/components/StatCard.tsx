export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "brand" | "amber" | "gray";
}) {
  const accentClass =
    accent === "brand"
      ? "text-brand-600"
      : accent === "amber"
        ? "text-amber-600"
        : "text-gray-900";

  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accentClass}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
