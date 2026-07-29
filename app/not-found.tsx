import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-text-muted">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 text-text-muted">The page you&apos;re looking for doesn&apos;t exist or was moved.</p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-accent px-4 py-2.5 font-semibold text-white hover:bg-accent-hover"
      >
        Back to home
      </Link>
    </section>
  );
}
