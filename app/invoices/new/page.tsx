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
  const [userId, setUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId] = useState<string>("");
  thead
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
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/auth/login");
          return;
        }

        setUserId(user.id);

        const { data: clientsData } = await supabase
          .from("clients")
          .select("id, name")
          .order("name", { ascending: true });

        setClients(clientsData || []);

        // Set default dates
        const today = new Date();
        const issueISO = today.toISOString().slice(0, 10);
        const dueTmp = new Date();
        dueTmp.setDate(dueTmp.getDate() + 7);
        const dueISO = dueTmp.toISOString().slice(0, 10);

        setIssueDate(issueISO);
        setDueDate(dueISO);
      } catch (e) {
        console.error(e);
        setError("Failed to load invoice form.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  // Convert items into totals
  const parsedItems = lineItems.map((li) => {
    const qty = Number(li.quantity || 0);
    const price = Number(li.unit_price || 0);
    const total = qty * price;

    return {
      description: li.description,
      quantity: qty,
      unit_price: price,
      total,
    };
  });

  const subtotal = parsedItems.reduce((sum, li) => sum + li.total, 0);
  const gst = subtotal * 0.1;
  const total = subtotal + gst;

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      if (!clientId) {
        setError("Please select a client.");
        setSaving(false);
        return;
      }

      const payload = {
        user_id: userId,
        client_id: clientId,
        status,
        issue_date: issueDate,
        due_date: dueDate,
        subtotal,
        gst,
        total,
        amount_paid: 0, // default
        items: parsedItems, // JSONB column
        notes: notes || null,
        title: title || null,
      };

      const { data, error: insertError } = await supabase
        .from("invoices")
        .insert([payload])
        .select("id")
        .single();

      if (insertError) throw insertError;

      router.push(`/invoices/${data.id}`);
    } catch (e: any) {
      console.error("Save invoice error:", e);
      setError(e?.message || "Failed to save invoice.");
    } finally {
      setSaving(false);
    }
  };

  const addLineItem = () =>
    setLineItems((prev) => [...prev, { description: "", quantity: "1", unit_price: "" }]);

  const removeLineItem = (index: number) =>
    setLineItems((prev) => prev.filter((_, i) => i !== index));

  const updateLineItem = (index: number, field: keyof LineItem, value: string) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-neutral-400 text-sm">Loading…</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl text-neutral-50 font-semibold">New Invoice</h1>
          <button
            onClick={() => router.push("/invoices")}
            className="text-xs text-neutral-400 hover:text-neutral-200"
          >
            Back
          </button>
        </div>

        {error && (
          <div className="bg-red-900/40 text-red-200 border border-red-600/40 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Client + Meta */}
        <div className="rounded-xl bg-neutral-900/60 border border-neutral-800 p-4 space-y-3">
          <label className="text-xs text-neutral-400">Client</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="bg-neutral-950 border border-neutral-700 text-neutral-100 px-3 py-2 rounded-lg text-sm"
          >
            <option value="">Select client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <label className="text-xs text-neutral-400">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional title"
            className="bg-neutral-950 border border-neutral-700 text-neutral-100 px-3 py-2 rounded-lg text-sm"
          />
        </div>

        {/* Line Items */}
        <div className="rounded-xl bg-neutral-900/60 border border-neutral-800 p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-medium text-neutral-200">Line items</h2>
            <button
              onClick={addLineItem}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              + Add item
            </button>
          </div>

          {lineItems.map((li, i) => {
            const qty = Number(li.quantity);
            const price = Number(li.unit_price);
            const lineTotal = qty * price;

            return (
              <div
                key={i}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-center"
              >
                <input
                  value={li.description}
                  onChange={(e) => updateLineItem(i, "description", e.target.value)}
                  placeholder="Description"
                  className="bg-neutral-950 border border-neutral-700 text-neutral-100 px-2 py-2 rounded-lg text-xs"
                />

                <input
                  value={li.quantity}
                  onChange={(e) => updateLineItem(i, "quantity", e.target.value)}
                  type="number"
                  min="1"
                  className="bg-neutral-950 border border-neutral-700 text-neutral-100 px-2 py-2 text-center rounded-lg text-xs"
                />

                <input
                  value={li.unit_price}
                  onChange={(e) => updateLineItem(i, "unit_price", e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  className="bg-neutral-950 border border-neutral-700 text-neutral-100 px-2 py-2 text-right rounded-lg text-xs"
                />

                <div className="text-xs text-right text-neutral-200">
                  {lineTotal > 0 ? formatCurrencyNumber(lineTotal) : "-"}
                </div>

                <button
                  onClick={() => removeLineItem(i)}
                  className="text-red-400 text-[10px]"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>

        {/* Totals + Save */}
        <div className="rounded-xl bg-neutral-900/60 border border-neutral-800 p-4 space-y-3">
          <div className="flex justify-between text-neutral-300 text-xs">
            <span>Subtotal</span>
            <span>{formatCurrencyNumber(subtotal)}</span>
          </div>
          <div className="flex justify-between text-neutral-300 text-xs">
            <span>GST (10%)</span>
            <span>{formatCurrencyNumber(gst)}</span>
          </div>
          <div className="flex justify-between text-neutral-50 text-sm font-semibold">
            <span>Total</span>
            <span>{formatCurrencyNumber(total)}</span>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-full text-sm py-2 mt-3 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Invoice"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
