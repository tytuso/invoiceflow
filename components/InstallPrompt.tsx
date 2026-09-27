"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

export function InstallPrompt() {
  const [event, setEvent] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("bizdocs-install-dismissed");
    if (dismissed) return;
    const handler = (e: any) => { e.preventDefault(); setEvent(e); setVisible(true); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !event) return null;

  async function install() {
    event.prompt();
    await event.userChoice;
    localStorage.setItem("bizdocs-install-dismissed", "1");
    setVisible(false);
  }

  function dismiss() {
    localStorage.setItem("bizdocs-install-dismissed", "1");
    setVisible(false);
  }

  return (
    <div className="fixed bottom-5 right-5 z-[70] w-[min(360px,calc(100vw-40px))] rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_18px_48px_rgba(20,30,50,.16)]">
      <button onClick={dismiss} className="absolute right-3 top-3 text-[var(--text-soft)]" aria-label="Dismiss"><X size={17}/></button>
      <div className="pr-6">
        <div className="flex items-center gap-2 font-semibold text-[var(--text-strong)]"><Download size={17} className="text-[var(--brand)]"/> Take BizDocs with you</div>
        <p className="mt-1.5 text-sm leading-5 text-[var(--text-muted)]">Install the app for faster access from your phone or desktop.</p>
      </div>
      <button onClick={install} className="mt-3 w-full rounded-xl bg-[var(--brand)] px-3 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5">Install BizDocs</button>
    </div>
  );
}