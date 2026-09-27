import type { DocumentType } from "./types";

export const DOCUMENT_TYPES: { type: DocumentType; label: string; description: string }[] = [
  { type: "invoice", label: "Invoice", description: "Request payment for products or services." },
  { type: "quotation", label: "Quotation", description: "Present pricing before work begins." },
  { type: "receipt", label: "Receipt", description: "Confirm payment has been received." },
  { type: "delivery_note", label: "Delivery Note", description: "Record a product or service delivery." },
  { type: "purchase_order", label: "Purchase Order", description: "Place a formal order with a supplier." },
  { type: "statement", label: "Statement", description: "Summarize balances and account activity." },
];

export const PREFIXES: Record<DocumentType, string> = {
  invoice: "INV",
  quotation: "QUO",
  receipt: "REC",
  delivery_note: "DN",
  purchase_order: "PO",
  statement: "ST",
};

export const CURRENCIES = [
  { code: "UGX", symbol: "UGX", locale: "en-UG", decimals: 0 },
  { code: "KES", symbol: "KES", locale: "en-KE", decimals: 0 },
  { code: "NGN", symbol: "₦", locale: "en-NG", decimals: 2 },
  { code: "ZAR", symbol: "R", locale: "en-ZA", decimals: 2 },
  { code: "USD", symbol: "$", locale: "en-US", decimals: 2 },
  { code: "EUR", symbol: "€", locale: "en-GB", decimals: 2 },
  { code: "GBP", symbol: "£", locale: "en-GB", decimals: 2 },
];

export function documentLabel(type: DocumentType) {
  return DOCUMENT_TYPES.find((x) => x.type === type)?.label ?? "Document";
}

export function formatMoney(value: number, currency = "UGX") {
  const meta = CURRENCIES.find((x) => x.code === currency);
  return new Intl.NumberFormat(meta?.locale ?? "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: meta?.decimals ?? 2,
    maximumFractionDigits: meta?.decimals ?? 2,
  }).format(Number.isFinite(value) ? value : 0);
}
