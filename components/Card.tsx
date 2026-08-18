import { ReactNode } from "react";

// Plain card boxto group related controls
export default function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">{children}</div>;
}
