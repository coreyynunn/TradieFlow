"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabaseClient";

type InvoiceItem = {
  description?: string;
  qty?: number;
  quantity?: number;
  rate?: number;
  price?: number;
  unit_price?: number;
  line_total?: number;
};

type Invoice = {
  id: number | string;
  user_id?: string;
  client_id: string | null;
  quote_id: number | null;
  status: string | null;
  issue_date: string | null;
  due_date: string | null;
  subtotal: number | null;
  gst: number | null;
  total: number | null;
  amount_paid: number | null;
  items: InvoiceItem[] | null;
};

type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

function formatCurrency(value: number | string | null | undefined) {
  const num = Number(value ?? 0) || 0;
  return num.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
  });
}

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const invoiceIdParam = params?.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!invoiceIdParam) return;
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

        const numericId = Number(invoiceIdParam);
        if (Number.isNaN(numericId)) {
          setError("Invalid invoice ID.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("invoices")
          .select("*")
          .eq("id", numericId)
          .maybeSingle();

        if (error || !data) {
          console.error("Invoice load error", error);
          setError("Invoice not found.");
          setInvoice(null);
          setLoading(false);
          return;
        }

        const itemArray = Array.isArray((data as any).items)
          ? ((data as any).items as InvoiceItem[])
          : [];

        const inv: Invoice = {
          ...(data as any),
          items: itemArray,
        };

        setInvoice(inv);

        // Load client (best-effort)
        if (data.client_id) {
          const { data: clientRow, error: clientError } = await supabase
            .from("clients")
            .select("id, name, email, phone")
            .eq("id", data.client_id)
            .maybeSingle();

          if (!clientError && clientRow) {
            setClient(clientRow as Client);
          }
        }

        setLoading(false);
      } catch (e: any) {
        console.error("Invoice unexpected error", e);
        setError("Failed to load invoice.");
        setInvoice(null);
        setLoading(false);
      }
    };

    load();
  }, [invoiceIdParam, router]);

  async function updateStatus(newStatus: string, markPaidFull?: boolean) {
    if (!invoice) return;

    setUpdating(true);
    setError(null);

    try {
      const updates: any = { status: newStatus };

      if (markPaidFull) {
        updates.amount_paid = invoice.total ?? 0;
      }

      const { error } = await supabase
        .from("invoices")
        .update(updates)
        .eq("id", invoice.id);

      if (error) {
        console.error("Invoice update error", error);
        setError("Failed to update invoice.");
        setUpdating(false);
        return;
      }

      // Optional: if linked to a quote, mark that quote paid as well when invoice paid
      if (newStatus === "paid" && invoice.quote_id != null) {
        await supabase
          .from("quotes")
          .update({ status: "paid" })
          .eq("id", invoice.quote_id);
      }

      setInvoice((prev) =>
        prev ? { ...prev, status: newStatus, ...(markPaidFull && { amount_paid: invoice.total ?? 0 }) } : prev
      );
    } catch (e: any) {
      console.error("Invoice update error", e);
      setError("Failed to update invoice.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!invoice) return;
    const confirmed = confirm("Delete this invoice permanently?");
    if (!confirmed) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", invoice.id);

      if (error) {
        console.error("Delete invoice error", error);
        alert("Error deleting invoice.");
        setDeleting(false);
        return;
      }

      router.push("/invoices");
    } catch (e: any) {
      console.error("Delete invoice error", e);
      alert("Error deleting invoice.");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center text-neutral-400">
          Loading invoice…
        </div>
      </DashboardLayout>
    );
  }

  if (error || !invoice) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center text-neutral-50">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl space-y-3 max-w-sm">
            <div className="text-lg font-semibold">Error</div>
            <div className="text-red-400">{error || "Invoice not found."}</div>
            <button
              onClick={() => router.push("/invoices")}
              className="mt-2 px-3 py-1.5 text-xs rounded bg-neutral-100 text-neutral-900 hover:bg-white transition"
            >
              Back to invoices
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const items: InvoiceItem[] = invoice.items || [];

  const issueDate = invoice.issue_date
    ? new Date(invoice.issue_date).toLocaleString("en-AU", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "-";

  const dueDate = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString("en-AU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  const rawStatus = (invoice.status || "draft").toLowerCase();
  const statusLabel = rawStatus.toUpperCase();

  let statusClasses =
    "inline-flex px-3 py-1 text-xs rounded-full border bg-neutral-900 text-neutral-200 border-neutral-700";

  if (rawStatus === "sent") {
    statusClasses =
      "inline-flex px-3 py-1 text-xs rounded-full border bg-blue-900/40 text-blue-200 border-blue-500/60";
  } else if (rawStatus === "paid") {
    statusClasses =
      "inline-flex px-3 py-1 text-xs rounded-full border bg-emerald-900/40 text-emerald-200 border-emerald-500/60";
  } else if (rawStatus === "overdue") {
    statusClasses =
      "inline-flex px-3 py-1 text-xs rounded-full border bg-red-900/40 text-red-200 border-red-500/60";
  } else if (rawStatus === "cancelled") {
    statusClasses =
      "inline-flex px-3 py-1 text-xs rounded-full border bg-neutral-900/60 text-neutral-200 border-neutral-600";
  }

  const total = invoice.total ?? 0;
  const paid = invoice.amount_paid ?? 0;
  const owing = total - paid;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div
              onClick={() => router.push("/invoices")}
              className="cursor-pointer text-xs mb-2 text-neutral-400 hover:text-neutral-200 transition"
            >
              ← Back to invoices
            </div>
            <h1 className="text-3xl font-semibold">
              Invoice #{invoice.id}
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Issued {issueDate}
              {dueDate && <> · Due {dueDate}</>}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className={statusClasses}>{statusLabel}</div>
            <div className="flex gap-2">
              {invoice.quote_id && (
                <button
                  onClick={() => router.push(`/quotes/${invoice.quote_id}`)}
                  className="h-8 px-3 rounded-md bg-neutral-900 text-neutral-100 text-xs font-medium hover:bg-neutral-800 border border-neutral-700 transition"
                >
                  View quote
                </button>
              )}
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

        {/* Status actions */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            disabled={updating}
            onClick={() => updateStatus("sent")}
            className="px-3 py-1 rounded-md border border-blue-500/60 bg-blue-900/40 text-blue-100 hover:bg-blue-900/70 disabled:opacity-60"
          >
            Mark as Sent
          </button>
          <button
            disabled={updating}
            onClick={() => updateStatus("paid", true)}
            className="px-3 py-1 rounded-md border border-emerald-500/80 bg-emerald-900/40 text-emerald-100 hover:bg-emerald-900/70 disabled:opacity-60"
          >
            Mark as Paid (full)
          </button>
          <button
            disabled={updating}
            onClick={() => updateStatus("cancelled")}
            className="px-3 py-1 rounded-md border border-neutral-500/60 bg-neutral-900 text-neutral-200 hover:bg-neutral-800 disabled:opacity-60"
          >
            Cancel invoice
          </button>
        </div>

        {/* Client + totals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Client */}
          <div className="md:col-span-2 p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-1">
            <div className="text-xs text-neutral-500 uppercase">Client</div>
            <div className="text-lg font-semibold">
              {client?.name || "Unknown client"}
            </div>
            <div className="text-sm text-neutral-400">
              {client?.email && <div>{client.email}</div>}
              {client?.phone && <div>{client.phone}</div>}
            </div>
          </div>

          {/* Money summary */}
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-400">Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">GST</span>
              <span>{formatCurrency(invoice.gst)}</span>
            </div>
            <div className="border-t border-neutral-800 pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-xs text-neutral-400">
              <span>Paid</span>
              <span>{formatCurrency(paid)}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold">
              <span>Owing</span>
              <span className={owing > 0 ? "text-amber-300" : "text-emerald-300"}>
                {formatCurrency(owing)}
              </span>
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
