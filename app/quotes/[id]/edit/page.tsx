"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type QuoteItem = {
  description: string;
  qty: number;
  price: number;
};

type Client = {
  id: number | string;
  name: string;
};

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "paid", label: "Paid" }, // 🔹 new
];

export default function EditQuotePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const quoteId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState(""); // string for <select>
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("draft");
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [gst, setGst] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // ------------------------------------------------
  // Load quote + clients
  // ------------------------------------------------
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      // auth
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      // load quote by numeric id
      const numericId = Number(quoteId);
      if (Number.isNaN(numericId)) {
        setError("Invalid quote id.");
        setLoading(false);
        return;
      }

      const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .select(
          `
          id,
          client_id,
          title,
          status,
          items,
          subtotal,
          tax,
          gst,
          total
        `
        )
        .eq("id", numericId)
        .single();

      if (quoteError || !quote) {
        console.error("Edit quote load error", quoteError);
        setError("Quote not found.");
        setLoading(false);
        return;
      }

      // Basic fields
      setTitle(quote.title ?? "");
      setStatus(quote.status ?? "draft");
      setClientId(quote.client_id ? String(quote.client_id) : "");

      // Map items from DB -> editor format
      const rawItems = Array.isArray(quote.items) ? quote.items : [];
      const mappedItems: QuoteItem[] = rawItems.map((it: any) => ({
        description: it.description ?? "",
        qty: Number(it.qty ?? 0),
        // DB currently has "rate"; fall back to that if "price" missing
        price: Number(it.price ?? it.rate ?? 0),
      }));
      setItems(mappedItems);

      // Recalculate totals from items (ignore stale DB values)
      calculateTotals(mappedItems);

      // Load clients for dropdown
      const { data: clientsData } = await supabase
        .from("clients")
        .select("id, name")
        .order("name", { ascending: true });

      setClients((clientsData || []) as Client[]);
      setLoading(false);
    };

    if (quoteId) load();
  }, [quoteId, router]);

  // ------------------------------------------------
  // Totals
  // ------------------------------------------------
  function calculateTotals(currentItems: QuoteItem[]) {
    const sub = currentItems.reduce((acc, item) => {
      return acc + Number(item.qty || 0) * Number(item.price || 0);
    }, 0);

    const g = sub * 0.1;
    const t = sub + g;

    setSubtotal(sub);
    setGst(g);
    setTotal(t);
  }

  function updateItem(index: number, field: keyof QuoteItem, value: any) {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
    calculateTotals(newItems);
  }

  function addItem() {
    const newItems = [...items, { description: "", qty: 1, price: 0 }];
    setItems(newItems);
    calculateTotals(newItems);
  }

  function removeItem(index: number) {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    calculateTotals(newItems);
  }

  // ------------------------------------------------
  // Save
  // ------------------------------------------------
  async function saveQuote() {
    setSaving(true);
    setError(null);

    const numericId = Number(quoteId);
    if (Number.isNaN(numericId)) {
      setError("Invalid quote id.");
      setSaving(false);
      return;
    }

    // client_id is int8 in DB
    const clientIdValue = clientId ? Number(clientId) : null;

    // Map items back to DB format (keep "rate" like your existing rows)
    const itemsToSave = items.map((it) => ({
      description: it.description,
      qty: it.qty,
      rate: it.price,
    }));

    const { error } = await supabase
      .from("quotes")
      .update({
        title,
        status,
        client_id: clientIdValue,
        items: itemsToSave,
        subtotal,
        gst,
        tax: gst, // keep tax in sync with gst
        total,
      })
      .eq("id", numericId);

    setSaving(false);

    if (error) {
      console.error("Save quote error", error);
      setError("Error saving quote.");
      return;
    }

    router.push(`/quotes/${quoteId}`);
  }

  // ------------------------------------------------
  // UI
  // ------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-200 flex items-center justify-center">
        Loading quote…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-200 flex items-center justify-center">
        <div className="bg-neutral-900 border border-red-500/40 px-4 py-3 rounded-lg space-y-2">
          <div className="font-semibold text-red-400">{error}</div>
          <button
            onClick={() => router.push("/quotes")}
            className="text-xs mt-1 px-3 py-1.5 rounded bg-neutral-100 text-neutral-900"
          >
            Back to quotes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <button
          onClick={() => router.push(`/quotes/${quoteId}`)}
          className="text-xs mb-2 text-neutral-400 hover:text-neutral-200 transition"
        >
          ← Back to quote
        </button>

        <h1 className="text-2xl font-semibold">Edit Quote</h1>

        {/* Top row: Client + Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Client */}
          <div className="space-y-1">
            <label className="text-xs text-neutral-400">Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm w-full"
            >
              <option value="">Select client…</option>
              {clients.map((c) => (
                <option key={String(c.id)} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-xs text-neutral-400">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm w-full"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <label className="text-xs text-neutral-400">Quote Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm w-full"
            placeholder="e.g. Kitchen renovation labour & materials"
          />
        </div>

        {/* Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Line Items</h2>
            <button
              onClick={addItem}
              className="text-xs px-2 py-1 rounded bg-neutral-100 text-neutral-900"
            >
              + Add item
            </button>
          </div>

          {items.length === 0 && (
            <div className="text-xs text-neutral-500">
              No items yet. Add labour or materials.
            </div>
          )}

          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 bg-neutral-900/60 border border-neutral-800 rounded-lg px-3 py-2 items-center"
              >
                <input
                  className="col-span-7 bg-neutral-900 rounded px-2 py-1 text-xs border border-neutral-800"
                  placeholder="Description"
                  value={item.description ?? ""}
                  onChange={(e) =>
                    updateItem(index, "description", e.target.value)
                  }
                />
                <input
                  type="number"
                  className="col-span-2 bg-neutral-900 rounded px-2 py-1 text-xs border border-neutral-800 text-right"
                  placeholder="Qty"
                  value={item.qty ?? ""}
                  onChange={(e) =>
                    updateItem(index, "qty", Number(e.target.value))
                  }
                />
                <input
                  type="number"
                  className="col-span-2 bg-neutral-900 rounded px-2 py-1 text-xs border border-neutral-800 text-right"
                  placeholder="Price"
                  value={item.price ?? ""}
                  onChange={(e) =>
                    updateItem(index, "price", Number(e.target.value))
                  }
                />
                <button
                  onClick={() => removeItem(index)}
                  className="col-span-1 text-[10px] text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="border border-neutral-800 rounded-lg p-4 space-y-1 text-sm max-w-sm ml-auto">
          <div className="flex justify-between text-neutral-300">
            <span>Subtotal</span>
            <span>{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-neutral-400 text-xs">
            <span>GST (10%)</span>
            <span>{gst.toFixed(2)}</span>
          </div>
          <div className="border-t border-neutral-800 pt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span>{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            onClick={saveQuote}
            disabled={saving}
            className="h-9 px-4 rounded-md bg-neutral-100 text-neutral-900 text-xs font-medium hover:bg-white border border-neutral-300 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
