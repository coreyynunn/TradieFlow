"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/DashboardLayout";
import BarcodeScanner from "@/components/BarcodeScanner";

type Client = {
  id: number | string;
  name: string;
  phone?: string | null;
};

type QuoteItem = {
  description: string;
  qty: number;
  rate: number;
  line_total?: number;
};

function formatCurrency(value: number | string | null | undefined) {
  const num = Number(value ?? 0) || 0;
  return num.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
  });
}

export default function NewQuotePage() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");

  const [items, setItems] = useState<QuoteItem[]>([
    { description: "", qty: 1, rate: 0 },
  ]);

  const [applyGst, setApplyGst] = useState(true);
  const [subtotal, setSubtotal] = useState(0);
  const [gst, setGst] = useState(0);
  const [total, setTotal] = useState(0);

  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [scannerOpen, setScannerOpen] = useState(false); // 🔹 scanner overlay

  // Load clients + auth check
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("clients")
        .select("id, name, phone")
        .order("name", { ascending: true });

      if (error) {
        console.error("Load clients error", error);
        setError("Failed to load clients.");
        setLoading(false);
        return;
      }

      setClients((data || []) as Client[]);
      setLoading(false);
    };

    load();
  }, [router]);

  // Recalculate totals whenever items or GST toggle change
  useEffect(() => {
    const sub = items.reduce((acc, item) => {
      const qty = Number(item.qty || 0);
      const rate = Number(item.rate || 0);
      return acc + qty * rate;
    }, 0);

    const gstAmount = applyGst ? sub * 0.1 : 0;
    const totalAmount = sub + gstAmount;

    setSubtotal(sub);
    setGst(gstAmount);
    setTotal(totalAmount);
  }, [items, applyGst]);

  function updateItem(index: number, field: keyof QuoteItem, value: any) {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  }

  function addItem() {
    setItems([...items, { description: "", qty: 1, rate: 0 }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  // 🔹 Barcode handler: prefers user_products price, falls back to catalog default_rate
  async function handleBarcodeScanned(code: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      // 1) Look up in catalog by barcode
      const { data: catalog, error: catalogError } = await supabase
        .from("product_catalog")
        .select("id, name, default_rate")
        .eq("barcode", code)
        .maybeSingle();

      if (catalogError || !catalog) {
        console.error("Barcode not found in catalog", catalogError);
        alert(
          `No product found for barcode ${code}. Add it under Products, then scan again.`
        );
        return;
      }

      // 2) Try to get user-specific rate
      const { data: userProd, error: userProdError } = await supabase
        .from("user_products")
        .select("custom_rate")
        .eq("user_id", user.id)
        .eq("catalog_id", catalog.id)
        .maybeSingle();

      if (userProdError) {
        console.error("User product lookup error", userProdError);
      }

      const rateNumber =
        userProd?.custom_rate != null
          ? Number(userProd.custom_rate)
          : Number(catalog.default_rate || 0);

      const newItems = [
        ...items,
        {
          description: catalog.name,
          qty: 1,
          rate: rateNumber,
        },
      ];

      setItems(newItems);
    } catch (e) {
      console.error("Barcode handler error", e);
      alert("Error handling barcode scan.");
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      if (!clientId) {
        setError("Please select a client.");
        setSaving(false);
        return;
      }

      // Clean items – store qty + rate + line_total
      const cleanedItems = items.map((item) => {
        const qty = Number(item.qty || 0);
        const rate = Number(item.rate || 0);
        return {
          description: item.description,
          qty,
          rate,
          line_total: qty * rate,
        };
      });

      const { data, error } = await supabase
        .from("quotes")
        .insert({
          user_id: user.id,
          client_id: Number(clientId),
          title: title || null,
          status: "draft",
          items: cleanedItems,
          subtotal,
          gst,
          tax: gst,
          total,
          notes: notes || null,
        })
        .select("id")
        .single();

      if (error) {
        console.error("Insert quote error", error);
        setError("Failed to save quote.");
        setSaving(false);
        return;
      }

      const newId = data?.id;
      if (newId) {
        router.push(`/quotes/${newId}`);
      } else {
        router.push("/quotes");
      }
    } catch (e: any) {
      console.error("Unexpected save error", e);
      setError("Failed to save quote.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center text-neutral-400">
          Loading…
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-50">
              New Quote
            </h1>
            <p className="text-xs text-neutral-500">
              Create a detailed quote with line items, GST and notes. This will
              be tied to a client and saved in your account.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-500/40 text-red-200 text-xs px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
          {/* Left side */}
          <div className="space-y-4">
            {/* Client + title */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
              <div className="text-xs font-medium text-neutral-400 mb-1">
                Client *
              </div>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-md px-3 py-2 text-sm text-neutral-100"
              >
                <option value="">Select a client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.phone ? ` · ${c.phone}` : ""}
                  </option>
                ))}
              </select>

              <div className="mt-4 space-y-1">
                <div className="text-xs font-medium text-neutral-400">
                  Quote title
                </div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Retaining wall @ 13 Bright St Narangba"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-md px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500"
                />
              </div>
            </div>

            {/* Line items */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-neutral-50">
                  Line items
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setScannerOpen(true)}
                    className="h-8 px-3 text-xs rounded-md bg-neutral-800 text-neutral-100 border border-neutral-700 hover:bg-neutral-700"
                  >
                    Scan barcode
                  </button>
                  <button
                    onClick={addItem}
                    className="h-8 px-3 text-xs rounded-md bg-emerald-500 text-neutral-950 font-medium hover:bg-emerald-400"
                  >
                    + Add item
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-12 text-[11px] text-neutral-500 px-1">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-2 text-right">Line total</div>
              </div>

              <div className="space-y-2">
                {items.map((item, index) => {
                  const qty = Number(item.qty || 0);
                  const rate = Number(item.rate || 0);
                  const lineTotal = qty * rate;

                  return (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 items-center"
                    >
                      <input
                        className="col-span-6 bg-neutral-950 rounded-md px-2 py-2 text-xs border border-neutral-800 text-neutral-100"
                        placeholder="e.g. Install ceiling fan"
                        value={item.description}
                        onChange={(e) =>
                          updateItem(index, "description", e.target.value)
                        }
                      />
                      <input
                        type="number"
                        className="col-span-2 bg-neutral-950 rounded-md px-2 py-2 text-xs border border-neutral-800 text-right"
                        value={item.qty}
                        onChange={(e) =>
                          updateItem(index, "qty", Number(e.target.value))
                        }
                      />
                      <input
                        type="number"
                        className="col-span-2 bg-neutral-950 rounded-md px-2 py-2 text-xs border border-neutral-800 text-right"
                        value={item.rate}
                        onChange={(e) =>
                          updateItem(index, "rate", Number(e.target.value))
                        }
                      />
                      <div className="col-span-2 flex items-center justify-between gap-2">
                        <div className="text-xs text-neutral-200 text-right flex-1">
                          {formatCurrency(lineTotal)}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-[11px] text-red-400 hover:text-red-300 px-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right side – Summary */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-4">
            <h2 className="text-sm font-medium text-neutral-50">Summary</h2>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-400">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">GST (10%)</span>
                <span>{formatCurrency(gst)}</span>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-neutral-300">
              <input
                type="checkbox"
                checked={applyGst}
                onChange={(e) => setApplyGst(e.target.checked)}
                className="h-3 w-3 rounded border-neutral-700 bg-neutral-950"
              />
              Apply GST to this quote
            </label>

            <div className="border-t border-neutral-800 pt-3 flex justify-between items-center">
              <span className="text-sm text-neutral-300">Total</span>
              <span className="text-lg font-semibold">
                {formatCurrency(total)}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="text-neutral-400">Internal notes (optional)</div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-500"
                placeholder="E.g. allow 10% variation for extra time/materials."
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-10 rounded-md bg-emerald-500 text-neutral-950 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save quote"}
            </button>
          </div>
        </div>
      </div>

      {scannerOpen && (
        <BarcodeScanner
          onResult={handleBarcodeScanned}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </DashboardLayout>
  );
}
