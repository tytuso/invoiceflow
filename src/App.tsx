import { ChangeEvent, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

type CurrencyCode = "USD" | "UGX" | "KES" | "EUR" | "GBP";
type DiscountType = "percent" | "fixed";

type InvoiceData = {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  businessLogo: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: CurrencyCode;
  taxRate: number;
  discountType: DiscountType;
  discountValue: number;
  paymentDetails: string;
  notes: string;
};

type InvoiceItem = {
  id: number;
  name: string;
  description: string;
  quantity: number;
  price: number;
};

type SavedDraft = {
  invoice: InvoiceData;
  items: InvoiceItem[];
};

const STORAGE_KEY = "invoiceflow-draft-v1";

const today = new Date();
const due = new Date();
due.setDate(today.getDate() + 14);

function toDateInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

const defaultInvoice: InvoiceData = {
  businessName: "Nile AI Solutions",
  businessEmail: "hello@company.com",
  businessPhone: "+256 700 000000",
  businessAddress: "Kampala, Uganda",
  businessLogo: "",
  clientName: "Acme Limited",
  clientEmail: "client@company.com",
  clientPhone: "+256 700 000000",
  clientAddress: "Kampala, Uganda",
  invoiceNumber: "INV-001",
  invoiceDate: toDateInput(today),
  dueDate: toDateInput(due),
  currency: "USD",
  taxRate: 18,
  discountType: "percent",
  discountValue: 0,
  paymentDetails: "Bank: Example Bank\nAccount name: Nile AI Solutions\nAccount number: 0001234567",
  notes: "Thank you for your business. Payment is due by the date shown above.",
};

const defaultItems: InvoiceItem[] = [
  {
    id: 1,
    name: "Website Development",
    description: "Premium business website",
    quantity: 1,
    price: 850,
  },
];

function formatDate(date: string) {
  if (!date) return "—";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatMoney(amount: number, currency: CurrencyCode) {
  const decimals = currency === "UGX" ? 0 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function safeNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function initialDraft(): SavedDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { invoice: defaultInvoice, items: defaultItems };
    const parsed = JSON.parse(raw) as SavedDraft;
    if (!parsed?.invoice || !Array.isArray(parsed.items)) {
      return { invoice: defaultInvoice, items: defaultItems };
    }
    return {
      invoice: { ...defaultInvoice, ...parsed.invoice },
      items: parsed.items.length ? parsed.items : defaultItems,
    };
  } catch {
    return { invoice: defaultInvoice, items: defaultItems };
  }
}

function Icon({ name }: { name: "download" | "eye" | "plus" | "trash" | "reset" | "close" | "check" }) {
  const paths: Record<string, ReactNode> = {
    download: <><path d="M12 3v11"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></>,
    plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    trash: <><path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 14h10l1-14"/><path d="M9 7V4h6v3"/></>,
    reset: <><path d="M4 7v5h5"/><path d="M20 17a8 8 0 1 1-2-9"/></>,
    close: <><path d="m6 6 12 12"/><path d="m18 6-12 12"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

type InvoiceDocumentProps = {
  invoice: InvoiceData;
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  exportMode?: boolean;
};

function InvoiceDocument({ invoice, items, subtotal, discountAmount, taxAmount, total, exportMode = false }: InvoiceDocumentProps) {
  return (
    <div className={`invoice-document ${exportMode ? "invoice-export" : ""}`}>
      <div className="invoice-top">
        <div className="business-block">
          {invoice.businessLogo ? (
            <div className="logo-shell"><img src={invoice.businessLogo} alt="Business logo" /></div>
          ) : (
            <div className="invoice-logo">{(invoice.businessName || "I").trim().charAt(0).toUpperCase()}</div>
          )}
          <h3>{invoice.businessName || "Your Business"}</h3>
          {invoice.businessAddress && <p>{invoice.businessAddress}</p>}
          {invoice.businessEmail && <p>{invoice.businessEmail}</p>}
          {invoice.businessPhone && <p>{invoice.businessPhone}</p>}
        </div>

        <div className="invoice-title">
          <h2>INVOICE</h2>
          <span># {invoice.invoiceNumber || "INV-001"}</span>
        </div>
      </div>

      <div className="invoice-meta">
        <div className="bill-to">
          <span className="mini-label">BILL TO</span>
          <strong>{invoice.clientName || "Client name"}</strong>
          {invoice.clientAddress && <p>{invoice.clientAddress}</p>}
          {invoice.clientEmail && <p>{invoice.clientEmail}</p>}
          {invoice.clientPhone && <p>{invoice.clientPhone}</p>}
        </div>

        <div className="dates">
          <div><span>Invoice date</span><strong>{formatDate(invoice.invoiceDate)}</strong></div>
          <div><span>Due date</span><strong>{formatDate(invoice.dueDate)}</strong></div>
          <div><span>Currency</span><strong>{invoice.currency}</strong></div>
        </div>
      </div>

      <div className="invoice-table">
        <div className="table-row table-head">
          <span>Description</span><span>Qty</span><span>Price</span><span>Amount</span>
        </div>

        {items.map((item) => (
          <div className="table-row" key={item.id}>
            <div className="description-cell">
              <strong>{item.name || "New item"}</strong>
              {item.description && <p>{item.description}</p>}
            </div>
            <span>{item.quantity || 0}</span>
            <span>{formatMoney(item.price, invoice.currency)}</span>
            <strong>{formatMoney(item.quantity * item.price, invoice.currency)}</strong>
          </div>
        ))}
      </div>

      <div className="totals-wrap">
        <div className="invoice-summary">
          <div className="summary-row"><span>Subtotal</span><strong>{formatMoney(subtotal, invoice.currency)}</strong></div>
          {discountAmount > 0 && (
            <div className="summary-row">
              <span>Discount{invoice.discountType === "percent" ? ` (${invoice.discountValue}%)` : ""}</span>
              <strong>-{formatMoney(discountAmount, invoice.currency)}</strong>
            </div>
          )}
          {invoice.taxRate > 0 && (
            <div className="summary-row"><span>Tax / VAT ({invoice.taxRate}%)</span><strong>{formatMoney(taxAmount, invoice.currency)}</strong></div>
          )}
          <div className="summary-total"><span>Total</span><strong>{formatMoney(total, invoice.currency)}</strong></div>
        </div>
      </div>

      <div className="invoice-bottom-grid">
        <div className="invoice-footer-block">
          <span className="mini-label">PAYMENT DETAILS</span>
          <p className="preline">{invoice.paymentDetails || "Add your payment instructions here."}</p>
        </div>
        <div className="invoice-footer-block">
          <span className="mini-label">NOTES</span>
          <p className="preline">{invoice.notes || "Thank you for your business."}</p>
        </div>
      </div>

      <div className="invoice-thank-you">Thank you for your business.</div>
    </div>
  );
}

function App() {
  const draft = useMemo(() => initialDraft(), []);
  const [invoice, setInvoice] = useState<InvoiceData>(draft.invoice);
  const [items, setItems] = useState<InvoiceItem[]>(draft.items);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [savedPulse, setSavedPulse] = useState(false);
  const [message, setMessage] = useState("");
  const invoiceRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const rawDiscount = invoice.discountType === "percent"
    ? subtotal * (Math.min(invoice.discountValue, 100) / 100)
    : invoice.discountValue;
  const discountAmount = Math.min(Math.max(rawDiscount, 0), subtotal);
  const amountAfterDiscount = Math.max(subtotal - discountAmount, 0);
  const taxAmount = amountAfterDiscount * (invoice.taxRate / 100);
  const total = amountAfterDiscount + taxAmount;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ invoice, items }));
        setSavedPulse(true);
        window.setTimeout(() => setSavedPulse(false), 900);
      } catch {
        // Keep the app working even if browser storage is unavailable/full.
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [invoice, items]);

  const updateField = <K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) => {
    setInvoice((current) => ({ ...current, [field]: value }));
  };

  const updateItem = (id: number, field: keyof InvoiceItem, value: string | number) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };

  const addItem = () => {
    setItems((current) => [...current, { id: Date.now(), name: "", description: "", quantity: 1, price: 0 }]);
  };

  const removeItem = (id: number) => {
    if (items.length === 1) return;
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const handleLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Please choose an image file for your logo.");
      return;
    }
    if (file.size > 2_000_000) {
      setMessage("Please use a logo smaller than 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateField("businessLogo", String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const validateInvoice = () => {
    if (!invoice.businessName.trim()) return "Add your business name first.";
    if (!invoice.clientName.trim()) return "Add the client name first.";
    if (!invoice.invoiceNumber.trim()) return "Add an invoice number first.";
    if (!items.some((item) => item.name.trim() && item.quantity > 0)) return "Add at least one invoice item.";
    return "";
  };

  const downloadPdf = async () => {
    const error = validateInvoice();
    if (error) {
      setMessage(error);
      return;
    }
    if (!invoiceRef.current) return;

    setIsExporting(true);
    setMessage("");
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const printableWidth = pageWidth - margin * 2;
      const imageHeight = (canvas.height * printableWidth) / canvas.width;

      if (imageHeight <= pageHeight - margin * 2) {
        pdf.addImage(imgData, "PNG", margin, margin, printableWidth, imageHeight, undefined, "FAST");
      } else {
        const pxPerMm = canvas.width / printableWidth;
        const pageSliceHeightPx = Math.floor((pageHeight - margin * 2) * pxPerMm);
        let y = 0;
        let page = 0;
        while (y < canvas.height) {
          const sliceHeight = Math.min(pageSliceHeightPx, canvas.height - y);
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = canvas.width;
          pageCanvas.height = sliceHeight;
          const ctx = pageCanvas.getContext("2d");
          ctx?.drawImage(canvas, 0, y, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
          const sliceData = pageCanvas.toDataURL("image/png", 1.0);
          const sliceHeightMm = sliceHeight / pxPerMm;
          if (page > 0) pdf.addPage();
          pdf.addImage(sliceData, "PNG", margin, margin, printableWidth, sliceHeightMm, undefined, "FAST");
          y += sliceHeight;
          page += 1;
        }
      }

      const safeName = (invoice.invoiceNumber || "invoice").replace(/[^a-z0-9-_]/gi, "-");
      pdf.save(`${safeName}.pdf`);
      setMessage("PDF downloaded successfully.");
    } catch (error) {
      console.error(error);
      setMessage("PDF export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const resetInvoice = () => {
    if (!window.confirm("Start a fresh invoice? This will replace the current local draft.")) return;
    setInvoice({ ...defaultInvoice, invoiceDate: toDateInput(new Date()), dueDate: toDateInput(new Date(Date.now() + 14 * 86400000)) });
    setItems(defaultItems.map((item) => ({ ...item, id: Date.now() })));
    setMessage("Started a fresh invoice.");
  };

  const scrollToPreview = () => {
    if (window.innerWidth <= 1050) {
      invoiceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      setPreviewOpen(true);
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">I</div>
          <div><h1>InvoiceFlow</h1><p>Professional Invoice Generator</p></div>
        </div>

        <div className="top-actions">
          <div className={`save-status ${savedPulse ? "pulse" : ""}`}><span className="save-dot" />Saved locally</div>
          <button className="ghost-button" onClick={resetInvoice}><Icon name="reset" /> New</button>
          <button className="ghost-button hide-mobile" onClick={scrollToPreview}><Icon name="eye" /> Preview</button>
          <button className="primary-button" onClick={downloadPdf} disabled={isExporting}><Icon name="download" /> {isExporting ? "Creating PDF..." : "Download PDF"}</button>
        </div>
      </header>

      {message && (
        <div className="toast" role="status"><Icon name="check" /><span>{message}</span><button onClick={() => setMessage("")} aria-label="Close message"><Icon name="close" /></button></div>
      )}

      <main className="workspace">
        <section className="editor">
          <div className="editor-heading">
            <span className="eyebrow">CREATE INVOICE</span>
            <h2>Build your invoice</h2>
            <p>Fill in the details. Your professional invoice updates instantly and stays saved in this browser.</p>
          </div>

          <div className="card">
            <div className="card-heading"><span className="step">01</span><div><h3>Your business</h3><p>Details that identify you on the invoice.</p></div></div>
            <div className="logo-row">
              <button type="button" className="logo-upload" onClick={() => fileInputRef.current?.click()}>
                {invoice.businessLogo ? <img src={invoice.businessLogo} alt="Logo preview" /> : <span>{(invoice.businessName || "I").charAt(0).toUpperCase()}</span>}
              </button>
              <div><strong>Business logo</strong><p>Optional · PNG or JPG · max 2 MB</p><div className="logo-actions"><button type="button" onClick={() => fileInputRef.current?.click()}>Upload logo</button>{invoice.businessLogo && <button type="button" className="danger-link" onClick={() => updateField("businessLogo", "")}>Remove</button>}</div></div>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleLogo} />
            </div>
            <div className="form-grid">
              <div className="field full"><label>Business name</label><input value={invoice.businessName} onChange={(e) => updateField("businessName", e.target.value)} placeholder="Nile AI Solutions" /></div>
              <div className="field"><label>Email</label><input type="email" value={invoice.businessEmail} onChange={(e) => updateField("businessEmail", e.target.value)} placeholder="hello@company.com" /></div>
              <div className="field"><label>Phone</label><input value={invoice.businessPhone} onChange={(e) => updateField("businessPhone", e.target.value)} placeholder="+256 700 000000" /></div>
              <div className="field full"><label>Business address</label><input value={invoice.businessAddress} onChange={(e) => updateField("businessAddress", e.target.value)} placeholder="Kampala, Uganda" /></div>
            </div>
          </div>

          <div className="card">
            <div className="card-heading"><span className="step">02</span><div><h3>Bill to</h3><p>Add the customer or company receiving this invoice.</p></div></div>
            <div className="form-grid">
              <div className="field full"><label>Client / Company name</label><input value={invoice.clientName} onChange={(e) => updateField("clientName", e.target.value)} placeholder="Acme Limited" /></div>
              <div className="field"><label>Email</label><input type="email" value={invoice.clientEmail} onChange={(e) => updateField("clientEmail", e.target.value)} placeholder="client@company.com" /></div>
              <div className="field"><label>Phone</label><input value={invoice.clientPhone} onChange={(e) => updateField("clientPhone", e.target.value)} placeholder="+256 700 000000" /></div>
              <div className="field full"><label>Client address</label><input value={invoice.clientAddress} onChange={(e) => updateField("clientAddress", e.target.value)} placeholder="Kampala, Uganda" /></div>
            </div>
          </div>

          <div className="card">
            <div className="card-heading"><span className="step">03</span><div><h3>Invoice details</h3><p>Set the number, dates and currency.</p></div></div>
            <div className="form-grid two-three">
              <div className="field"><label>Invoice number</label><input value={invoice.invoiceNumber} onChange={(e) => updateField("invoiceNumber", e.target.value)} /></div>
              <div className="field"><label>Currency</label><select value={invoice.currency} onChange={(e) => updateField("currency", e.target.value as CurrencyCode)}><option value="USD">USD — US Dollar</option><option value="UGX">UGX — Uganda Shilling</option><option value="KES">KES — Kenyan Shilling</option><option value="EUR">EUR — Euro</option><option value="GBP">GBP — British Pound</option></select></div>
              <div className="field"><label>Invoice date</label><input type="date" value={invoice.invoiceDate} onChange={(e) => updateField("invoiceDate", e.target.value)} /></div>
              <div className="field"><label>Due date</label><input type="date" value={invoice.dueDate} onChange={(e) => updateField("dueDate", e.target.value)} /></div>
            </div>
          </div>

          <div className="card">
            <div className="card-heading"><span className="step">04</span><div><h3>Products & services</h3><p>Add every item you are charging for.</p></div></div>
            <div className="items-editor">
              {items.map((item, index) => (
                <div className="item-editor" key={item.id}>
                  <div className="item-editor-top"><span>ITEM {String(index + 1).padStart(2, "0")}</span>{items.length > 1 && <button className="remove-item-button" onClick={() => removeItem(item.id)}><Icon name="trash" /> Remove</button>}</div>
                  <div className="field"><label>Product / Service</label><input value={item.name} onChange={(e) => updateItem(item.id, "name", e.target.value)} placeholder="Website Development" /></div>
                  <div className="field"><label>Description</label><input value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} placeholder="Premium business website" /></div>
                  <div className="item-number-grid">
                    <div className="field"><label>Quantity</label><input type="number" min="0" step="1" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", safeNumber(e.target.value))} /></div>
                    <div className="field"><label>Unit price ({invoice.currency})</label><input type="number" min="0" step="0.01" value={item.price} onChange={(e) => updateItem(item.id, "price", safeNumber(e.target.value))} /></div>
                    <div className="item-total-box"><span>Amount</span><strong>{formatMoney(item.quantity * item.price, invoice.currency)}</strong></div>
                  </div>
                </div>
              ))}
              <button className="add-item-button" onClick={addItem}><Icon name="plus" /> Add another item</button>
            </div>
          </div>

          <div className="card">
            <div className="card-heading"><span className="step">05</span><div><h3>Tax & discount</h3><p>Apply VAT/tax and an optional discount.</p></div></div>
            <div className="adjustments-grid">
              <div className="field"><label>Tax / VAT (%)</label><input type="number" min="0" step="0.1" value={invoice.taxRate} onChange={(e) => updateField("taxRate", safeNumber(e.target.value))} /></div>
              <div className="field"><label>Discount type</label><select value={invoice.discountType} onChange={(e) => updateField("discountType", e.target.value as DiscountType)}><option value="percent">Percentage (%)</option><option value="fixed">Fixed amount</option></select></div>
              <div className="field"><label>{invoice.discountType === "percent" ? "Discount (%)" : `Discount (${invoice.currency})`}</label><input type="number" min="0" max={invoice.discountType === "percent" ? 100 : undefined} step="0.01" value={invoice.discountValue} onChange={(e) => updateField("discountValue", safeNumber(e.target.value))} /></div>
            </div>
            <div className="calculation-preview">
              <div><span>Subtotal</span><strong>{formatMoney(subtotal, invoice.currency)}</strong></div>
              <div><span>Discount</span><strong>-{formatMoney(discountAmount, invoice.currency)}</strong></div>
              <div><span>Tax / VAT</span><strong>{formatMoney(taxAmount, invoice.currency)}</strong></div>
              <div className="calculation-total"><span>Total</span><strong>{formatMoney(total, invoice.currency)}</strong></div>
            </div>
          </div>

          <div className="card">
            <div className="card-heading"><span className="step">06</span><div><h3>Payment & notes</h3><p>Add payment instructions and any final message.</p></div></div>
            <div className="field"><label>Payment details</label><textarea rows={5} value={invoice.paymentDetails} onChange={(e) => updateField("paymentDetails", e.target.value)} placeholder="Bank, account number, mobile money or payment instructions..." /></div>
            <div className="field notes-field"><label>Notes</label><textarea rows={4} value={invoice.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Thank you for your business..." /></div>
          </div>

          <div className="mobile-finish-card">
            <strong>Your invoice is ready.</strong><span>{formatMoney(total, invoice.currency)} total</span>
            <button className="primary-button wide" onClick={downloadPdf} disabled={isExporting}><Icon name="download" /> {isExporting ? "Creating PDF..." : "Download PDF"}</button>
          </div>
        </section>

        <aside className="preview-panel">
          <div className="preview-label"><span>LIVE PREVIEW</span><div className="status-dot"><i /> Live</div></div>
          <div className="capture-shell">
            <div ref={invoiceRef}>
              <InvoiceDocument invoice={invoice} items={items} subtotal={subtotal} discountAmount={discountAmount} taxAmount={taxAmount} total={total} />
            </div>
          </div>
        </aside>
      </main>

      {previewOpen && (
        <div className="modal-backdrop" onMouseDown={() => setPreviewOpen(false)}>
          <div className="preview-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-bar"><div><strong>Invoice preview</strong><span>{invoice.invoiceNumber}</span></div><div><button className="primary-button" onClick={downloadPdf} disabled={isExporting}><Icon name="download" /> Download PDF</button><button className="icon-button" onClick={() => setPreviewOpen(false)} aria-label="Close preview"><Icon name="close" /></button></div></div>
            <div className="modal-document-wrap"><InvoiceDocument invoice={invoice} items={items} subtotal={subtotal} discountAmount={discountAmount} taxAmount={taxAmount} total={total} /></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
