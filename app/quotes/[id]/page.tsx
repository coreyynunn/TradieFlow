"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/DashboardLayout";

type QuoteItemDB = {
  description?: string;
  qty?: number;
  quantity?: number;
  rate?: number;
  price?: number;
  unit_price?: number;
  line_total?: number;
};

type Quote = {
  id: number | string;
  client_id?: number | string;
  title: string | null;
  status: string | null;
  subtotal: number;
  gst: number;
  total: number;
  items: QuoteItemDB[] | null;
  created_at: string | null;
  clients?: {
    name: string;
    email?: string | null;
    phone?: string | null;
  } | null;
};

function formatCurrency(value: number | string | null | undefined) {
  const num = Number(value ?? 0) || 0;
  return num.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
  });
}

export default function QuoteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const quoteIdParam = params?.id as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!quoteIdParam) return;

      setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/auth/login");
          return;
        }

        const numericId = Number(quoteIdParam);
        if (Number.isNaN(numericId)) {
          setError("Invalid quote ID.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("quotes")
          .select(
            `
            id,
            client_id,
            title,
            status,
            subtotal,
            gst,
            total,
            items,
            created_at,
            clients (
              name,
              email,
              phone
            )
          `
          )
          .eq("id", numericId)
          .maybeSingle();

        if (error || !data) {
          console.error("Quote load error", error);
          setError("Quote not found.");
          setQuote(null);
        } else {
          const itemsArray = Array.isArray((data as any).items)
            ? ((data as any).items as QuoteItemDB[])
            : [];

          setQuote({
            ...(data as any),
            items: itemsArray,
          });
        }
      } catch (e: any) {
        console.error("Unexpected quote load error", e);
        setError("Failed to load quote.");
        setQuote(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [quoteIdParam, router]);

  async function handleUpdateStatus(newStatus: string) {
    if (!quote) return;

    setUpdatingStatus(true);
    setError(null);

    try {
      // update quote status
      const { error } = await supabase
        .from("quotes")
        .update({ status: newStatus })
        .eq("id", quote.id);

      if (error) {
        console.error("Update status error", error);
        setError("Failed to update status.");
        setUpdatingStatus(false);
        return;
      }

      // update local state
      setQuote((prev) => (prev ? { ...prev, status: newStatus } : prev));

      // if accepted, ensure job exists
      if (newStatus === "accepted") {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) {
          router.replace("/auth/login");
          return;
        }

        // check if job already exists for this quote
        const { data: existingJob } = await supabase
          .from("jobs")
          .select("id")
          .eq("quote_id", quote.id)
          .maybeSingle();

        if (!existingJob) {
          const title =
            quote.title ||
            (quote.clients?.name
              ? `Job for ${quote.clients.name}`
              : `Job for quote #${String(quote.id).slice(0, 8)}`);

          await supabase.from("jobs").insert({
  user_id: user.id,
  client_id: quote.client_id ? String(quote.client_id) : null,
  quote_id: Number(quote.id),
  status: "pending",   // ✅ PENDING so it lands in Pending column
  title,
});
        }
      }
    } catch (e: any) {
      console.error("Update status error", e);
      setError("Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleDelete() {
    if (!quote) return;
    const confirmed = confirm("Delete this quote permanently?");
    if (!confirmed) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("quotes")
        .delete()
        .eq("id", quote.id);

      if (error) {
        console.error("Delete error", error);
        alert("Error deleting quote.");
        setDeleting(false);
        return;
      }

      router.push("/quotes");
    } catch (e: any) {
      console.error("Delete error", e);
      alert("Error deleting quote.");
      setDeleting(false);
    }
  }

  async function handleCreateInvoice() {
    if (!quote) return;
    if (!quote.client_id) {
      alert("This quote is missing a client.");
      return;
    }

    setCreatingInvoice(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("invoices")
        .insert({
          user_id: user.id,
          client_id: String(quote.client_id),
          quote_id: Number(quote.id),
          status: "sent",
          issue_date: new Date().toISOString(),
          subtotal: quote.subtotal,
          gst: quote.gst,
          total: quote.total,
          items: quote.items || [],
        })
        .select("id")
        .single();

      if (error) {
        console.error("Create invoice error", error);
        setError("Failed to create invoice.");
        setCreatingInvoice(false);
        return;
      }

      router.push(`/invoices/${data.id}`);
    } catch (e: any) {
      console.error("Create invoice error", e);
      setError("Failed to create invoice.");
      setCreatingInvoice(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center text-neutral-400">
          Loading quote…
        </div>
      </DashboardLayout>
    );
  }

  if (error || !quote) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center text-neutral-50">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl space-y-3 max-w-sm">
            <div className="text-lg font-semibold">Error</div>
            <div className="text-red-400">{error || "Quote not found."}</div>
            <button
              onClick={() => router.push("/quotes")}
              className="mt-2 px-3 py-1.5 text-xs rounded bg-neutral-100 text-neutral-900 hover:bg-white transition"
            >
              Back to quotes
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const items: QuoteItemDB[] = quote.items || [];

  const createdDate = quote.created_at
    ? new Date(quote.created_at).toLocaleString("en-AU", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "-";

  const client = quote.clients;
  const rawStatus = (quote.status || "draft").toLowerCase();
  const statusLabel = rawStatus.toUpperCase();

  let statusClasses =
    "inline-flex px-3 py-1 text-xs rounded-full border bg-neutral-900 text-neutral-200 border-neutral-700";

  if (rawStatus === "sent") {
    statusClasses =
      "inline-flex px-3 py-1 text-xs rounded-full border bg-blue-900/40 text-blue-200 border-blue-500/60";
  } else if (rawStatus === "accepted") {
    statusClasses =
      "inline-flex px-3 py-1 text-xs rounded-full border bg-emerald-900/40 text-emerald-200 border-emerald-500/60";
  } else if (rawStatus === "declined") {
    statusClasses =
      "inline-flex px-3 py-1 text-xs rounded-full border bg-red-900/40 text-red-200 border-red-500/60";
  } else if (rawStatus === "paid") {
    statusClasses =
      "inline-flex px-3 py-1 text-xs rounded-full border bg-emerald-700/40 text-emerald-100 border-emerald-400/80";
  }

  const idStr = String(quote.id);
  const shortId = idStr.slice(0, 8);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div
              onClick={() => router.push("/quotes")}
              className="cursor-pointer text-xs mb-2 text-neutral-400 hover:text-neutral-200 transition"
            >
              ← Back to quotes
            </div>
            <h1 className="text-3xl font-semibold">
              {quote.title || `Quote #${shortId}`}
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Created {createdDate}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className={statusClasses}>{statusLabel}</div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/quotes/${quoteIdParam}/edit`)}
                className="h-8 px-3 rounded-md bg-neutral-100 text-neutral-900 text-xs font-medium hover:bg-white border border-neutral-300 transition"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="h-8 px-3 rounded-md bg-red-500/20 text-red-300 text-xs font-medium border border-red-500/40 hover:bg-red-500/30 disabled:opacity-60 transition"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>

        {/* Quick status + invoice */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            disabled={updatingStatus}
            onClick={() => handleUpdateStatus("sent")}
            className="px-3 py-1 rounded-md border border-blue-500/60 bg-blue-900/40 text-blue-100 hover:bg-blue-900/70 disabled:opacity-60"
          >
            Mark as Sent
          </button>
          <button
            disabled={updatingStatus}
            onClick={() => handleUpdateStatus("accepted")}
            className="px-3 py-1 rounded-md border border-emerald-500/60 bg-emerald-900/40 text-emerald-100 hover:bg-emerald-900/70 disabled:opacity-60"
          >
            Mark as Accepted (creates Job)
          </button>
          <button
            disabled={updatingStatus}
            onClick={() => handleUpdateStatus("paid")}
            className="px-3 py-1 rounded-md border border-emerald-400/80 bg-emerald-700/40 text-emerald-50 hover:bg-emerald-700/70 disabled:opacity-60"
          >
            Mark as Paid
          </button>
          <button
            disabled={creatingInvoice}
            onClick={handleCreateInvoice}
            className="px-3 py-1 rounded-md border border-neutral-500/60 bg-neutral-900 text-neutral-100 hover:bg-neutral-800 disabled:opacity-60"
          >
            {creatingInvoice ? "Creating invoice…" : "Create invoice"}
          </button>
        </div>

        {/* Top Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Client */}
          <div className="md:col-span-2 p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-1">
            <div className="text-xs text-neutral-500 uppercase">Client</div>
            <div className="text-lg font-semibold">{client?.name}</div>
            <div className="text-sm text-neutral-400">
              {client?.email && <div>{client.email}</div>}
              {client?.phone && <div>{client.phone}</div>}
            </div>
          </div>

          {/* Totals */}
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Subtotal</span>
              <span>{formatCurrency(quote.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">GST</span>
              <span>{formatCurrency(quote.gst)}</span>
            </div>
            <div className="border-t border-neutral-800 pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-lg">{formatCurrency(quote.total)}</span>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-800 text-sm font-medium">
            Line Items ({items.length})
          </div>

          {items.length === 0 ? (
            <div className="p-4 text-neutral-500 text-sm">No items</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-neutral-900">
                <tr>
                  <th className="px-4 py-2 text-left text-neutral-400">
                    Description
                  </th>
                  <th className="px-4 py-2 text-right text-neutral-400">
                    Qty
                  </th>
                  <th className="px-4 py-2 text-right text-neutral-400">
                    Rate
                  </th>
                  <th className="px-4 py-2 text-right text-neutral-400">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map((item, i) => {
                  const qty = Number(item.qty ?? item.quantity ?? 0);
                  const unit = Number(
                    item.rate ?? item.price ?? item.unit_price ?? 0
                  );
                  const line = item.line_total ?? qty * unit;

                  return (
                    <tr
                      key={i}
                      className="border-t border-neutral-800 hover:bg-neutral-900 transition"
                    >
                      <td className="px-4 py-3">{item.description}</td>
                      <td className="px-4 py-3 text-right">
                        {qty.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(unit)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(line)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
