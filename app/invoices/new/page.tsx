"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabaseClient";

type Client = {
  id: string;
  name: string;
};

type LineItem = {
  description: string;
  quantity: string;
  unit_price: string;
};

function formatCurrencyNumber(value: number) {
  return value.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
  });
}

export default function NewInvoicePage() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [issueDate, setIssueDate] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [status, setStatus] = useState<string>("draft");
  const [notes, setNotes] = useState<string>("");

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: "1", unit_price: "" },
  ]);

  useEffect(() => {
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

        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select("id, name")
          .order("name", { ascending: true });

        if (clientsError) throw clientsError;
        setClients((clientsData || []) as Client[]);

        // Default issue date = today, due date = +7 days
        const today = new Date();
        const isoToday = today.toISOString().slice(0, 10);
        const due = new Date();
        due.setDate(due.getDate() + 7);
        const isoDue = due.toISOString().slice(0, 10);

        setIssueDate(isoToday);
        setDueDate(isoDue);
      } catch (e: any) {
        console.error("New invoice load error", e);
        setError("Failed to load clients.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const parsedLineItems = lineItems.map((li) => {
    const qty = Number(li.quantity || 0) || 0;
    const price = Number(li.unit_price || 0) || 0;
    const lineTotal = qty * price;
    return {
      ...li,
      quantity: qty,
      unit_price: price,
      line_total: lineTotal,
    };
  });

  const subtotal = parsedLineItems.reduce(
    (sum, li) => sum + (li.line_total || 0),
    0
  );
  const gst = subtotal * 0.1;
  const total = subtotal + gst;

  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { description: "", quantity: "1", unit_price: "" },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (
    index: number,
    field: keyof LineItem,
    value: string
  ) => {
    setLineItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      if (!clientId) {
        setError("Please select a client.");
        setSaving(false);
        return;
      }

      const payload: any = {
        client_id: clientId,
        title: title || null,
        issue_date: issueDate || null,
        due_date: dueDate || null,
        status: status || "draft",
        total: total,
      };

      // If your invoices table has these columns, they’ll be used.
      // If not, remove them from here.
      payload.subtotal = subtotal;
      payload.gst = gst;
      payload.line_items = parsedLineItems;
      payload.notes = notes || null;

      const { data, error: insertError } = await supabase
        .from("invoices")
        .insert([payload])
        .select("id")
        .single();

      if (insertError) throw insertError;

      // Go straight to the detail page
      router.push(`/invoices/${data.id}`);
    } catch (e: any) {
      console.error("Save invoice error", e);
      setError("Failed to save invoice.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-neutral-400 text-sm">Loading invoice form…</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-neutral-50">
              New Invoice
            </h1>
            <p className="text-xs text-neutral-500">
              Create an invoice to send to your client.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/invoices")}
            className="text-xs text-neutral-400 hover:text-neutral-200"
          >
            Back to invoices
          </button>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-500/40 text-red-200 text-xs px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Top Row: Client + Meta */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
            <label className="block text-xs text-neutral-400 mb-1">
              Client
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm text-neutral-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <label className="block text-xs text-neutral-400 mb-1">
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Bathroom renovation invoice"
              className="w-full rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm text-neutral-50 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  Issue date
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-xs text-neutral-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  Due date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-xs text-neutral-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-xs text-neutral-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-neutral-100">
              Line items
            </h2>
            <button
              type="button"
              onClick={handleAddLineItem}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              + Add item
            </button>
          </div>

          <div className="space-y-2">
            {lineItems.map((li, index) => {
              const qtyNum = Number(li.quantity || 0) || 0;
              const priceNum = Number(li.unit_price || 0) || 0;
              const lineTotal = qtyNum * priceNum;

              return (
                <div
                  key={index}
                  className="grid grid-cols-[minmax(0,2fr)_minmax(0,0.6fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto] gap-2 items-center"
                >
                  <input
                    type="text"
                    value={li.description}
                    onChange={(e) =>
                      handleLineItemChange(index, "description", e.target.value)
                    }
                    placeholder="Description"
                    className="rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-xs text-neutral-50 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    min={0}
                    value={li.quantity}
                    onChange={(e) =>
                      handleLineItemChange(index, "quantity", e.target.value)
                    }
                    placeholder="Qty"
                    className="rounded-lg bg-neutral-950 border border-neutral-700 px-2 py-2 text-xs text-neutral-50 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={li.unit_price}
                    onChange={(e) =>
                      handleLineItemChange(index, "unit_price", e.target.value)
                    }
                    placeholder="Unit price"
                    className="rounded-lg bg-neutral-950 border border-neutral-700 px-2 py-2 text-xs text-neutral-50 text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="text-xs text-right text-neutral-200">
                    {lineTotal > 0 ? formatCurrencyNumber(lineTotal) : "-"}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveLineItem(index)}
                    className="text-[10px] text-neutral-500 hover:text-red-400 px-2"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes + Totals + Save */}
        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
            <label className="block text-xs text-neutral-400 mb-1">
              Notes (shown on invoice)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="w-full rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-xs text-neutral-50 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Payment terms, bank details, etc."
            />
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2 text-sm text-neutral-100">
            <div className="flex justify-between text-xs text-neutral-300">
              <span>Subtotal</span>
              <span>{formatCurrencyNumber(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-neutral-300">
              <span>GST (10%)</span>
              <span>{formatCurrencyNumber(gst)}</span>
            </div>
            <div className="border-t border-neutral-800 my-2" />
            <div className="flex justify-between text-sm font-semibold text-neutral-50">
              <span>Total</span>
              <span>{formatCurrencyNumber(total)}</span>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-4 w-full inline-flex items-center justify-center rounded-full border border-blue-500/70 bg-blue-600/80 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-500 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? "Saving…" : "Save Invoice"}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
