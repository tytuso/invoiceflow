"use client";

import Link from "next/link";
import { FileText, Plus, Search, Trash2, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { documentLabel, formatMoney } from "@/lib/constants";

type SortKey = "newest" | "oldest" | "amount" | "client";

export function DocumentsList({ rows }: { rows: any[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [items, setItems] = useState(rows);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const result = items.filter((doc) => {
      const haystack = [
        doc.number,
        doc.client?.name,
        doc.client?.company,
        String(doc.total ?? ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!q || haystack.includes(q)) &&
        (type === "all" || doc.type === type) &&
        (status === "all" || doc.status === status)
      );
    });

    return [...result].sort((a, b) => {
      if (sort === "amount") return Number(b.total ?? 0) - Number(a.total ?? 0);

      if (sort === "client") {
        const aName = String(a.client?.company || a.client?.name || "").toLowerCase();
        const bName = String(b.client?.company || b.client?.name || "").toLowerCase();
        return aName.localeCompare(bName);
      }

      const aDate = new Date(a.created_at || 0).getTime();
      const bDate = new Date(b.created_at || 0).getTime();
      return sort === "oldest" ? aDate - bDate : bDate - aDate;
    });
  }, [items, query, type, status, sort]);

  async function remove(id: string) {
    if (!window.confirm("Delete this document? This action cannot be easily undone.")) return;

    const supabase = createClient();
    const result = await supabase.from("bizdocs_documents").delete().eq("id", id);

    if (!result.error) {
      setItems((current) => current.filter((doc) => doc.id !== id));
    }
  }

  return (
    <div className="mx-auto max-w-[1220px] px-4 py-7 sm:px-6 lg:px-8">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_140px_140px]">
        <div className="relative">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-3 text-[var(--text-soft)]"
          />
          <label htmlFor="document-search" className="sr-only">
            Search documents
          </label>
          <input
            id="document-search"
            className="field pl-9"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search number, client or amount"
          />
        </div>

        <label className="sr-only" htmlFor="document-type-filter">
          Filter by document type
        </label>
        <select
          id="document-type-filter"
          className="field"
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          <option value="all">All types</option>
          <option value="invoice">Invoice</option>
          <option value="quotation">Quotation</option>
          <option value="receipt">Receipt</option>
          <option value="delivery_note">Delivery note</option>
          <option value="purchase_order">Purchase order</option>
          <option value="statement">Statement</option>
        </select>

        <label className="sr-only" htmlFor="document-status-filter">
          Filter by status
        </label>
        <select
          id="document-status-filter"
          className="field"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">All status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <label className="sr-only" htmlFor="document-sort">
          Sort documents
        </label>
        <select
          id="document-sort"
          className="field"
          value={sort}
          onChange={(event) => setSort(event.target.value as SortKey)}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="amount">Amount</option>
          <option value="client">Client</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-16 text-center shadow-[var(--shadow)]">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--accent)] text-[var(--brand)]">
            <FileText size={22} aria-hidden="true" />
          </div>
          <h2 className="mt-5 font-semibold text-[var(--text-strong)]">
            {items.length ? "No documents match" : "No documents yet"}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[var(--text-muted)]">
            {items.length
              ? "Try adjusting your search or filters."
              : "Create your first professional business document in seconds."}
          </p>
          <Link href="/app/documents/new" className="btn-primary mt-5">
            <Plus size={15} aria-hidden="true" />
            Create Document
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)]">
          <div className="hidden grid-cols-[1.1fr_.8fr_.65fr_.5fr_auto] border-b border-[var(--line)] px-5 py-3 text-[10px] font-bold uppercase tracking-[.09em] text-[var(--text-soft)] sm:grid">
            <span>Document</span>
            <span>Client</span>
            <span>Amount</span>
            <span>Status</span>
            <span className="sr-only">Actions</span>
          </div>

          <div className="divide-y divide-[var(--line)]">
            {filtered.map((doc) => {
              const clientName = doc.client?.company || doc.client?.name || "No client";

              return (
                <div
                  key={doc.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 transition-colors hover:bg-[var(--surface-2)] sm:grid-cols-[1.1fr_.8fr_.65fr_.5fr_auto] sm:px-5"
                >
                  <Link
                    href={"/app/documents/" + doc.id}
                    className="min-w-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2"
                  >
                    <div className="truncate text-sm font-semibold text-[var(--text-strong)]">
                      {documentLabel(doc.type)}
                    </div>
                    <div className="mt-1 truncate text-xs text-[var(--text-soft)]">
                      {doc.number} ·{" "}
                      {doc.issue_date
                        ? new Date(String(doc.issue_date) + "T00:00:00").toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )
                        : "No date"}
                    </div>
                  </Link>

                  <div className="hidden truncate text-sm text-[var(--text-muted)] sm:block">
                    {clientName}
                  </div>

                  <div className="text-right text-sm font-semibold text-[var(--text-strong)] sm:text-left">
                    {formatMoney(Number(doc.total ?? 0), doc.currency)}
                  </div>

                  <div className="hidden sm:block">
                    <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[10px] font-bold capitalize text-[var(--text-muted)]">
                      {doc.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={"/app/documents/" + doc.id}
                      className="grid h-9 w-9 place-items-center rounded-xl text-[var(--text-muted)] transition hover:bg-[var(--bg)] hover:text-[var(--text-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                      aria-label={"Open " + doc.number}
                      title="Open"
                    >
                      <ExternalLink size={15} aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(doc.id)}
                      className="grid h-9 w-9 place-items-center rounded-xl text-[var(--text-soft)] transition hover:bg-red-50 hover:text-[var(--danger)] focus:outline-none focus:ring-2 focus:ring-[var(--danger)]"
                      title="Delete"
                      aria-label={"Delete " + doc.number}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
