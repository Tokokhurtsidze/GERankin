interface Step {
  title: string;
  body: string;
}

export function HowItWorks({ label, steps }: { label: string; steps: Step[] }) {
  return (
    <div className="w-full max-w-3xl">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <ol className="mt-4 grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
        {steps.map((step, i) => (
          <li key={i} className="ink-border rounded-xl bg-surface p-5">
            <p className="font-semibold">{step.title}</p>
            <p className="mt-1.5 text-sm text-text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
