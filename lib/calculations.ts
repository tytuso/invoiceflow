import type { LineItem } from "./types";

export function calculateItem(item: Omit<LineItem, "amount"> | LineItem) {
  const gross = Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.unitPrice) || 0);
  const discount = Math.min(gross, Math.max(0, Number(item.discount) || 0));
  const taxable = Math.max(0, gross - discount);
  const tax = taxable * (Math.max(0, Number(item.taxRate) || 0) / 100);
  return { gross, discount, tax, amount: taxable + tax };
}

export function calculateTotals(items: LineItem[]) {
  return items.reduce(
    (acc, item) => {
      const x = calculateItem(item);
      acc.subtotal += x.gross;
      acc.discount += x.discount;
      acc.tax += x.tax;
      acc.total += x.amount;
      return acc;
    },
    { subtotal: 0, discount: 0, tax: 0, total: 0 },
  );
}
