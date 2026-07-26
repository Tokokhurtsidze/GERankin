export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-text-muted">{message}</p>
    </div>
  );
}
