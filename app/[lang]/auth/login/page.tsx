import { signIn } from "@/lib/auth/auth";

export default async function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  return (
    <section className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-16 sm:py-24">
      <h1 className="text-4xl font-bold tracking-tight">Log in</h1>
      <p className="max-w-sm text-center text-sm text-text-muted">
        Startup Clash GE uses Google to sign in — no separate password to manage.
      </p>
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: `/${lang}` });
        }}
      >
        <button
          type="submit"
          className="ink-border flex items-center gap-3 rounded-lg bg-surface px-5 py-3 text-sm font-semibold hover:bg-border"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.92H1.3v3.09A12 12 0 0 0 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.31 14.32A7.2 7.2 0 0 1 4.93 12c0-.81.14-1.6.38-2.32V6.59H1.3A12 12 0 0 0 0 12c0 1.94.46 3.77 1.3 5.41z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.76 0 3.35.6 4.6 1.8l3.45-3.45C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.3 6.59l4.01 3.09C6.25 6.85 8.89 4.75 12 4.75z"
            />
          </svg>
          Continue with Google
        </button>
      </form>
    </section>
  );
}
