export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="text-sm text-text-muted">{label}</div>
      <div className="mt-2 text-2xl font-bold text-text">{value}</div>
      {hint && <div className="mt-1 text-xs text-text-muted">{hint}</div>}
    </div>
  );
}
