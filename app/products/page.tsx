"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/DashboardLayout";

type ProductRow = {
  id: number;
  barcode: string;
  name: string;
  unit: string | null;
  rate: number;
};

function formatCurrency(value: number | string | null | undefined) {
  const num = Number(value ?? 0) || 0;
  return num.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
  });
}

export default function ProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [rate, setRate] = useState("");

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

      // join user_products -> product_catalog
      const { data, error } = await supabase
        .from("user_products")
        .select(
          `
          id,
          custom_rate,
          product_catalog:catalog_id (
            id,
            barcode,
            name,
            default_rate,
            unit
          )
        `
        )
        .eq("user_id", user.id)
        .eq("active", true)
        .order("id", { ascending: true });

      if (error) {
        console.error("Load products error", error);
        setError("Failed to load products.");
        setLoading(false);
        return;
      }

      const rows: ProductRow[] = (data || []).map((row: any) => {
        const cat = row.product_catalog;
        const rate =
          row.custom_rate != null
            ? Number(row.custom_rate)
            : Number(cat?.default_rate ?? 0);

        return {
          id: row.id,
          barcode: cat?.barcode ?? "",
          name: cat?.name ?? "",
          unit: cat?.unit ?? null,
          rate,
        };
      });

      setProducts(rows);
      setLoading(false);
    };

    load();
  }, [router]);

  async function handleAddProduct() {
    setSaving(true);
    setError(null);

    try {
      const cleanBarcode = barcode.trim();
      const cleanName = name.trim();
      const cleanUnit = unit.trim();
      const rateNumber = Number(rate);

      if (!cleanBarcode || !cleanName || !rateNumber) {
        setError("Barcode, name and rate are required.");
        setSaving(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      // 1) Upsert into product_catalog by barcode
      const { data: catalogRow, error: catalogError } = await supabase
        .from("product_catalog")
        .upsert(
          {
            barcode: cleanBarcode,
            name: cleanName,
            default_rate: rateNumber,
            unit: cleanUnit || null,
            created_by_user_id: user.id,
          },
          {
            onConflict: "barcode",
          }
        )
        .select()
        .single();

      if (catalogError || !catalogRow) {
        console.error("Catalog upsert error", catalogError);
        setError("Failed to save product to catalog.");
        setSaving(false);
        return;
      }

      // 2) Upsert into user_products for this user/catalog combo
      const { error: userProdError } = await supabase
        .from("user_products")
        .upsert(
          {
            user_id: user.id,
            catalog_id: catalogRow.id,
            custom_rate: rateNumber,
            active: true,
          },
          {
            onConflict: "user_id,catalog_id",
          }
        );

      if (userProdError) {
        console.error("User product upsert error", userProdError);
        setError("Failed to link product to your account.");
        setSaving(false);
        return;
      }

      // Add to local list
      setProducts((prev) => [
        ...prev,
        {
          id: Date.now(),
          barcode: catalogRow.barcode,
          name: catalogRow.name,
          unit: catalogRow.unit ?? null,
          rate: rateNumber,
        },
      ]);

      // reset form
      setBarcode("");
      setName("");
      setUnit("");
      setRate("");
    } catch (e: any) {
      console.error("Unexpected product save error", e);
      setError("Failed to save product.");
    } finally {
      setSaving(false);
    }
  }

  // UI

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-height-[60vh] flex items-center justify-center text-neutral-400">
          Loading products…
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-neutral-50">
              Products / Materials
            </h1>
            <p className="text-xs text-neutral-500">
              Save common materials with barcodes so you can drop them into
              quotes with a scan.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-500/40 text-red-200 text-xs px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Add product form */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
          <h2 className="text-sm font-medium text-neutral-50">
            Add product / material
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="space-y-1">
              <div className="text-neutral-400">Barcode</div>
              <input
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-md px-3 py-2 text-xs text-neutral-100"
                placeholder="Scan or type barcode"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <div className="text-neutral-400">Name</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-md px-3 py-2 text-xs text-neutral-100"
                placeholder="e.g. H4 pine sleeper 200x75x2.4m"
              />
            </div>

            <div className="space-y-1">
              <div className="text-neutral-400">Unit (optional)</div>
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-md px-3 py-2 text-xs text-neutral-100"
                placeholder="per length / per box"
              />
            </div>

            <div className="space-y-1">
              <div className="text-neutral-400">Rate (ex GST)</div>
              <input
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-md px-3 py-2 text-xs text-neutral-100"
                type="number"
                placeholder="e.g. 18.50"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleAddProduct}
              disabled={saving}
              className="h-8 px-4 rounded-md bg-neutral-100 text-neutral-900 text-xs font-medium hover:bg-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save product"}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40">
          <div className="px-4 py-2 border-b border-neutral-800 text-xs text-neutral-400 flex justify-between">
            <span>Saved products</span>
            <span>{products.length}</span>
          </div>
          {products.length === 0 ? (
            <div className="px-4 py-4 text-xs text-neutral-500">
              No products yet. Add your first one above or scan from the quote
              screen once we wire up the scanner.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-neutral-900/80">
                <tr>
                  <th className="text-left px-4 py-2 text-neutral-400">
                    Name
                  </th>
                  <th className="text-left px-4 py-2 text-neutral-400">
                    Barcode
                  </th>
                  <th className="text-left px-4 py-2 text-neutral-400">
                    Unit
                  </th>
                  <th className="text-right px-4 py-2 text-neutral-400">
                    Rate (ex GST)
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-neutral-800 hover:bg-neutral-900/70"
                  >
                    <td className="px-4 py-2 text-neutral-100">{p.name}</td>
                    <td className="px-4 py-2 text-neutral-400">
                      {p.barcode}
                    </td>
                    <td className="px-4 py-2 text-neutral-400">
                      {p.unit || "-"}
                    </td>
                    <td className="px-4 py-2 text-neutral-100 text-right">
                      {formatCurrency(p.rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
