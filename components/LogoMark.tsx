import Link from "next/link";
import { FileText } from "lucide-react";

export function LogoMark({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 group" aria-label="BizDocs AI home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand)] text-white shadow-[0_8px_22px_rgba(35,74,138,.25)] transition-transform group-hover:-translate-y-0.5">
        <FileText size={18} strokeWidth={2.2} />
      </span>
      {!compact && <span className="text-[17px] font-semibold tracking-[-0.02em] text-[var(--text-strong)]">BizDocs <span className="text-[var(--brand)]">AI</span></span>}
    </Link>
  );
}