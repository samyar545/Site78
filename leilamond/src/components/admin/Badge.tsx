import clsx from "clsx";

const TONE: Record<string, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
  muted: "bg-muted text-text-muted",
  primary: "bg-primary/10 text-primary",
};

export function Badge({ children, tone = "muted" }: { children: React.ReactNode; tone?: keyof typeof TONE }) {
  return (
    <span className={clsx("inline-block rounded-full px-2.5 py-1 text-xs font-medium", TONE[tone])}>
      {children}
    </span>
  );
}
