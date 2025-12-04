"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabaseClient";

type Invoice = {
  id: number | string;
  client_id: string | null;
  status: string | null;
  issue_date: string | null;
  due_date: string | null;
  total: number | null;
  title?: string | null;
  subtotal?: number | null;
  gst?: number | null;
  notes?: string | null;
  line_items?: any[] | null;
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

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
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

        const { data: invoiceData, error: invoiceError } = await supabase
          .from("invoices")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (invoiceError) throw invoiceError;
        if (!invoiceData) {
          setError("Invoice not found.");
          setLoading(false);
          return;
        }

        setInvoice(invoiceData as Invoice);

        if (invoiceData.client_id) {
          const { data: clientData, error: clientError } = await supabase
            .from("clients")
            .select("id, name, email, phone")
            .eq("id", invoiceData.client_id)
            .maybeSingle();

          if (clientError) throw clientError;
          setClient(clientData as Client);
        }
      } catch (e: any) {
        console.error("Invoice detail load error", e);
        setError("Failed to load invoice.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, router]);

  const updateStatus = async (newStatus: string) => {
    if (!invoice) return;
    setUpdatingStatus(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("invoices")
        .update({ status: newStatus })
        .eq("id", invoice.id);

      if (updateError) throw updateError;

      setInvoice((prev) =>
        prev ? { ...prev, status: newStatus } : prev
      );
    } catch (e: any) {
      console.error("Update status error", e);
      setError("Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusStyles = (status: string | null | undefined) => {
    const raw = (status || "draft").toLowerCase();
    let statusLabel = raw.toUpperCase();
    let statusColor = "text-neutral-300";
    let badgeBg = "bg-neutral-900 border-neutral-700";

    if (raw === "sent") {
      statusColor = "text-blue-200";
      badgeBg = "bg-blue-900/40 border-blue-500/60";
    } else if (raw === "paid") {
      statusColor = "text-emerald-200";
      badgeBg = "bg-emerald-900/40 border-emerald-500/60";
    } else if (raw === "overdue") {
      statusColor = "text-red-200";
      badgeBg = "bg-red-900/40 border-red-500/60";
    } else if (raw === "cancelled") {
      statusColor = "text-neutral-300";
      badgeBg = "bg-neutral-900/60 border-neutral-600";
    }

    return { statusLabel, statusColor, badgeBg };
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-neutral-400 text-sm">Loading invoice…</div>
      </DashboardLayout>
    );
  }

  if (error || !invoice) {
    return (
      <DashboardLayout>
        <div className="max-w-md">
          {error && (
            <div className="bg-red-950/40 border border-red-500/40 text-red-200 text-xs px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          {!error && (
            <div className="text-neutral-400 text-sm">
              Invoice not found.
            </div>
          )}
          <button
            type="button"
            onClick={() => router.push("/invoices")}
            className="mt-2 text-xs text-neutral-400 hover:text-neutral-200"
          >
            Back to invoices
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const { statusLabel, statusColor, badgeBg } = getStatusStyles(invoice.status);
  const effectiveSubtotal =
    invoice.subtotal != null
      ? invoice.subtotal
      : (invoice.total || 0) / 1.1;
  const effectiveGst =
    invoice.gst != null ? invoice.gst : (invoice.total || 0) - effectiveSubtotal;

  const lineItems = (invoice.line_items || []) as any[];

  const title = invoice.title || `Invoice #${invoice.id}`;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.push("/invoices")}
              className="text-[11px] text-neutral-500 hover:text-neutral-300 mb-1"
            >
              ← Back to invoices
            </button>
            <h1 className="text-xl font-semibold text-neutral-50">
              {title}
            </h1>
            <p className="text-xs text-neutral-500">
              Invoice ID #{String(invoice.id)}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div
              className={`px-3 py-1 rounded-full border text-[10px] uppercase tracking-wide ${badgeBg} ${statusColor}`}
            >
              {statusLabel}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateStatus("sent")}
                disabled={updatingStatus}
                className="rounded-full border border-blue-500/70 bg-blue-600/80 px-3 py-1 text-[11px] text-white hover:bg-blue-500 disabled:opacity-50"
              >
                Mark Sent
              </button>
              <button
                type="button"
                onClick={() => updateStatus("paid")}
                disabled={updatingStatus}
                className="rounded-full border border-emerald-500/70 bg-emerald-600/80 px-3 py-1 text-[11px] text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                Mark Paid
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-950/40 border border-red-500/40 text-red-200 text-xs px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Top Row: Client + Meta */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-1">
            <h2 className="text-xs font-semibold text-neutral-300 mb-1">
              Billed to
            </h2>
            {client ? (
              <>
                <p className="text-sm text-neutral-100">{client.name}</p>
                {client.email && (
                  <p className="text-xs text-neutral-400">{client.email}</p>
                )}
                {client.phone && (
                  <p className="text-xs text-neutral-400">{client.phone}</p>
                )}
              </>
            ) : (
              <p className="text-xs text-neutral-400">
                No client details found.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-1 text-xs text-neutral-300">
            <div className="flex justify-between">
              <span>Issue date</span>
              <span className="text-neutral-100">
                {formatDate(invoice.issue_date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Due date</span>
              <span className="text-neutral-100">
                {formatDate(invoice.due_date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Current status</span>
              <span className="text-neutral-100">{statusLabel}</span>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
          <h2 className="text-xs font-semibold text-neutral-300 mb-3">
            Line items
          </h2>

          {lineItems.length === 0 ? (
            <p className="text-xs text-neutral-400">
              No line items stored on this invoice.
            </p>
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,0.6fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] text-[11px] text-neutral-400 mb-1">
                <span>Description</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Unit price</span>
                <span className="text-right">Total</span>
              </div>
              <div className="border-t border-neutral-800" />
              {lineItems.map((li: any, index: number) => {
                const qty = li.quantity ?? li.qty ?? 0;
                const unitPrice = li.unit_price ?? li.unitPrice ?? 0;
                const lineTotal =
                  li.line_total || li.total || qty * unitPrice || 0;

                return (
                  <div
                    key={index}
                    className="grid grid-cols-[minmax(0,2fr)_minmax(0,0.6fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] text-[11px] text-neutral-100 py-1"
                  >
                    <span className="pr-2">{li.description || "-"}</span>
                    <span className="text-center text-neutral-300">
                      {qty || "-"}
                    </span>
                    <span className="text-right text-neutral-300">
                      {qty
                        ? formatCurrency(unitPrice)
                        : "-"}
                    </span>
                    <span className="text-right">
                      {lineTotal
                        ? formatCurrency(lineTotal)
                        : "-"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notes + Totals */}
        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
            <h2 className="text-xs font-semibold text-neutral-300 mb-2">
              Notes
            </h2>
            {invoice.notes ? (
              <p className="text-xs text-neutral-200 whitespace-pre-line">
                {invoice.notes}
              </p>
            ) : (
              <p className="text-xs text-neutral-500">
                No notes added for this invoice.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2 text-sm text-neutral-100">
            <div className="flex justify-between text-xs text-neutral-300">
              <span>Subtotal</span>
              <span>{formatCurrency(effectiveSubtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-neutral-300">
              <span>GST (10%)</span>
              <span>{formatCurrency(effectiveGst)}</span>
            </div>
            <div className="border-t border-neutral-800 my-2" />
            <div className="flex justify-between text-sm font-semibold text-neutral-50">
              <span>Total</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
