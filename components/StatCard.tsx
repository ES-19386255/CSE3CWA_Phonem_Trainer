import { ReactNode } from "react";

type Props = {
  label: string;
  value: ReactNode;
  note?: string;
};

// One headline number on the dashboard, with a small label above it.
export default function StatCard({ label, value, note }: Props) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-sm font-medium text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {note && <p className="mt-1 text-xs text-[var(--text-muted)]">{note}</p>}
    </div>
  );
}
