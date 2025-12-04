"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Quote = {
  id: string;
  user_id: string;
  client_id: string | null;
  title?: string | null;
  status?: string | null;
  issue_date?: string | null;
  due_date?: string | null;
  subtotal?: number | null;
  gst?: number | null;
  total?: number | null;
  notes?: string | null;
};

type Client = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
};

type QuoteItem = {
  id: string;
  quote_id: string;
  description?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
  total?: number | null;
};

const formatCurrency = (value: number | null | undefined) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
  }).format(value || 0);

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function QuoteDetailPage() {
  const router = useRouter();
  const params = useParams() as { id: string };

  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) Auth check (client-side)
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
  console.error("Error loading user", userError);
}

        if (!user) {
          router.push("/auth/login");
          return;
        }

        const quoteId = params.id;
        if (!quoteId) {
          setError("No quote ID provided.");
          return;
        }

        // 2) Load quote
        const { data: quoteData, error: quoteError } = await supabase
          .from("quotes")
          .select("*")
          .eq("id", quoteId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (quoteError || !quoteData) {
          console.error("Error loading quote", {
            message: quoteError?.message,
            details: quoteError?.details,
            hint: quoteError?.hint,
          });
          setError("Quote not found.");
          return;
        }

        setQuote(quoteData as Quote);

        // 3) Load client (if any)
        if (quoteData.client_id) {
          const { data: clientData, error: clientError } = await supabase
            .from("clients")
            .select("*")
            .eq("id", quoteData.client_id)
            .maybeSingle();

          if (clientError) {
            console.error("Error loading client", {
              message: clientError.message,
              details: clientError.details,
              hint: clientError.hint,
            });
          } else if (clientData) {
            setClient(clientData as Client);
          }
        }

        // 4) Load line items
        const { data: itemsData, error: itemsError } = await supabase
  .from("quote_items")
  .select("*")
  .eq("quote_id", quoteData.id);

// If table/rows don’t exist or there’s an error, just treat as empty for now
if (!itemsError && itemsData) {
  setItems(itemsData as QuoteItem[]);
} else {
  setItems([]);
}

      } catch (err) {
        console.error("Unexpected error loading quote", err);
        setError("Something went wrong loading this quote.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, params.id]);

  // Calculations
  const calculatedSubtotal = items.reduce((sum, item) => {
    const qty = item.quantity ?? 0;
    const price = item.unit_price ?? 0;
    return sum + qty * price;
  }, 0);

  const subtotal = quote?.subtotal ?? calculatedSubtotal;
  const gst =
    quote?.gst ??
    Math.round((subtotal * 0.1 + Number.EPSILON) * 100) / 100; // 10% GST
  const total = quote?.total ?? subtotal + gst;
  const status = quote?.status ?? (total > 0 ? "Draft" : "New");

  const handleConvertToInvoice = async () => {
    if (!quote) return;

    try {
      setConverting(true);
      setError(null);

      // Check user again in case session expired
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
  console.error("Error loading user in convert", userError);
}

      if (!user) {
        router.push("/auth/login");
        return;
      }

      // 1) Create invoice row
      const { data: invoiceData, error: invoiceError } = await supabase
  .from("invoices")
  .insert({
    user_id: user.id,
    client_id: quote.client_id,
    title: quote.title || `Invoice from quote ${quote.id}`,
    status: "Draft",
    issue_date: new Date().toISOString(),
    due_date: quote.due_date,
    subtotal,
    gst,
    total,
    notes: quote.notes,
  })
  .select()
  .single();

      if (invoiceError || !invoiceData) {
        console.error("Error creating invoice", {
          message: invoiceError?.message,
          details: invoiceError?.details,
          hint: invoiceError?.hint,
        });
        setError("Failed to create invoice from this quote.");
        return;
      }

      const newInvoiceId = invoiceData.id;

      // 2) Copy line items into invoice_items
      if (items.length > 0) {
        const invoiceItems = items.map((item) => {
          const qty = item.quantity ?? 0;
          const price = item.unit_price ?? 0;
          const lineTotal =
            item.total ??
            Math.round((qty * price + Number.EPSILON) * 100) / 100;

          return {
            invoice_id: newInvoiceId,
            description: item.description,
            quantity: qty,
            unit_price: price,
            total: lineTotal,
          };
        });

        const { error: invoiceItemsError } = await supabase
          .from("invoice_items")
          .insert(invoiceItems);

        if (invoiceItemsError) {
          console.error("Error creating invoice items", {
            message: invoiceItemsError.message,
            details: invoiceItemsError.details,
            hint: invoiceItemsError.hint,
          });
          setError(
            "Invoice was created, but some line items may not have copied across."
          );
        }
      }

      // 3) Redirect to the new invoice detail page
      router.push(`/invoices/${newInvoiceId}`);
    } catch (err) {
      console.error("Unexpected error converting to invoice", err);
      setError("Something went wrong converting this quote to an invoice.");
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p className="text-slate-300 text-sm">Loading quote...</p>
      </div>
    );
  }

  if (error && !quote) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-400 mb-3">
            {error || "Quote not found."}
          </p>
          <Link
            href="/quotes"
            className="text-sm text-emerald-400 hover:text-emerald-300"
          >
            ← Back to Quotes
          </Link>
        </div>
      </div>
    );
  }

  if (!quote) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back + Status */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/quotes"
            className="inline-flex items-center text-sm text-slate-300 hover:text-white transition-colors"
          >
            <span className="mr-2">←</span>
            Back to Quotes
          </Link>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-200">
              {status}
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8 flex flex-col gap-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-black/40 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              {quote.title || "Quote"}
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Quote ID:{" "}
              <span className="font-mono text-slate-100">{quote.id}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300">
              <div>
                <span className="text-slate-400">Issued: </span>
                <span>{formatDate(quote.issue_date)}</span>
              </div>
              <div>
                <span className="text-slate-400">Due: </span>
                <span>{formatDate(quote.due_date)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            {/* Edit placeholder */}
            <Link
              href={`/quotes/${quote.id}/edit`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-50 shadow-sm hover:bg-slate-750 hover:border-slate-500 transition-colors"
            >
              Edit Quote
            </Link>

            {/* Convert to Invoice */}
            <button
              type="button"
              onClick={handleConvertToInvoice}
              disabled={converting}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {converting ? "Converting..." : "Convert to Invoice"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-xs text-red-200">
            {error}
          </div>
        )}

        {/* Client + Totals */}
        <div className="mb-8 grid gap-6 md:grid-cols-[minmax(0,2fr),minmax(260px,1fr)]">
          {/* Client card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Client
            </h2>
            {client ? (
              <div className="mt-3 space-y-1 text-sm text-slate-200">
                <p className="font-medium text-white">{client.name}</p>
                {client.email && <p className="text-slate-300">{client.email}</p>}
                {client.phone && <p className="text-slate-300">{client.phone}</p>}
                {client.address && (
                  <p className="mt-1 text-xs text-slate-400 whitespace-pre-line">
                    {client.address}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400">
                No client linked to this quote.
              </p>
            )}
          </div>

          {/* Totals card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Totals
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-300">Subtotal</dt>
                <dd className="font-medium text-slate-50">
                  {formatCurrency(subtotal)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-300">GST (10%)</dt>
                <dd className="font-medium text-slate-50">
                  {formatCurrency(gst)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800 pt-3 mt-3">
                <dt className="text-sm font-semibold text-slate-100">Total</dt>
                <dd className="text-lg font-semibold text-emerald-400">
                  {formatCurrency(total)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Line items */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Line Items
            </h2>
            <p className="text-xs text-slate-400">
              {items.length} item{items.length === 1 ? "" : "s"}
            </p>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-slate-400">
              No line items on this quote yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/40">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-900/80">
                  <tr className="text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3 text-left font-medium">Item</th>
                    <th className="px-4 py-3 text-right font-medium">Qty</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Line Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const qty = item.quantity ?? 0;
                    const price = item.unit_price ?? 0;
                    const lineTotal =
                      item.total ??
                      Math.round((qty * price + Number.EPSILON) * 100) / 100;

                    return (
                      <tr
                        key={item.id}
                        className="border-t border-slate-800/80 text-slate-100"
                      >
                        <td className="px-4 py-3 align-top">
                          <div className="font-medium text-slate-50">
                            {item.description || "Untitled item"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right align-top text-slate-200">
                          {qty}
                        </td>
                        <td className="px-4 py-3 text-right align-top text-slate-200">
                          {formatCurrency(price)}
                        </td>
                        <td className="px-4 py-3 text-right align-top font-semibold text-slate-50">
                          {formatCurrency(lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Notes
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm text-slate-200">
              {quote.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
