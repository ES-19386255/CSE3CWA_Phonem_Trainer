type Props = {
  title: string;
  description?: string;
};

// A consistent title & description block for top of every page.
export default function PageTitle({ title, description }: Props) {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-8 pb-4">
      <h1 className="text-3xl font-bold text-[var(--primary)]">{title}</h1>
      {description && <p className="mt-1 text-[var(--text-muted)]">{description}</p>}
    </div>
  );
}
