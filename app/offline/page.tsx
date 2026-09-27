import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--bg)] px-5 text-center">
      <div className="max-w-md">
        <div className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand)]">
          BizDocs AI
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
          You’re offline
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
          BizDocs keeps your saved drafts on this device. Reconnect to load your
          workspace data and sync changes.
        </p>
        <Link href="/" className="btn-primary mt-6">
          Return home
        </Link>
      </div>
    </main>
  );
}
