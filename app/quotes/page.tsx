"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabaseClient";

type Quote = {
  id: number | string;
  client_id: number | string;
  total: number | null;
  created_at: string | null;
  title?: string | null;
  status?: string | null;
};

type Client = {
  id: number | string;
  name: string;
};

function formatCurrency(value: number | string | null | undefined) {
  const num = Number(value ?? 0) || 0;
  return num.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
  });
}

export default function QuotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clientsMap, setClientsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // auth check
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/auth/login");
          return;
        }

        // 🔹 Keep this super-safe: select * so we don't explode on missing columns
        const { data: quotesData, error: quotesError } = await supabase
          .from("quotes")
          .select("*")
          .order("created_at", { ascending: false });

        if (quotesError) {
          console.error("Quotes load error", quotesError);
          throw quotesError;
        }

        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select("id, name");

        if (clientsError) {
          console.error("Clients load error", clientsError);
          throw clientsError;
        }

        const map: Record<string, string> = {};
        (clientsData || []).forEach((c: any) => {
          map[String(c.id)] = c.name;
        });

        setQuotes((quotesData || []) as Quote[]);
        setClientsMap(map);
      } catch (e: any) {
        console.error("Quotes page error", e);
        setError("Failed to load quotes.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const handleRowClick = (id: number | string) => {
    router.push(`/quotes/${id}`);
  };

  // ---------- FILTERING (kept simple, only if status/params exist) ----------
  const statusParam = searchParams.get("status"); // e.g. accepted / paid
  const owingParam = searchParams.get("owing");   // "true"
  const overdueParam = searchParams.get("overdue"); // "true"

  let filtered = [...quotes];

  if (statusParam) {
    const wanted = statusParam
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    filtered = filtered.filter((q) =>
      wanted.includes((q.status || "").toLowerCase())
    );
  }

  if (owingParam === "true") {
    filtered = filtered.filter((q) => {
      const s = (q.status || "").toLowerCase();
      return s === "sent" || s === "accepted";
    });
  }

  if (overdueParam === "true") {
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    filtered = filtered.filter((q) => {
      const s = (q.status || "").toLowerCase();
      if (s !== "accepted") return false;
      if (!q.created_at) return false;
      const createdTime = new Date(q.created_at).getTime();
      return now - createdTime > thirtyDaysMs;
    });
  }

  let filterLabel = "All quotes";
  if (statusParam === "accepted") filterLabel = "Accepted quotes";
  else if (statusParam === "paid") filterLabel = "Paid quotes";
  else if (owingParam === "true") filterLabel = "Money owing";
  else if (overdueParam === "true") filterLabel = "Overdue quotes";

  // ---------- RENDER ----------

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-neutral-400 text-sm">Loading quotes…</div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-950/40 border border-red-500/40 text-red-200 text-sm px-4 py-3 rounded-lg max-w-md">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-neutral-50">Quotes</h1>
          <p className="text-xs text-neutral-500">
            {filterLabel}. Click a quote to open it.
          </p>
        </div>

        <button
          onClick={() => router.push("/quotes/new")}
          className="h-9 px-3 rounded-md bg-neutral-100 text-neutral-900 text-xs font-medium hover:bg-white border border-neutral-300 transition"
        >
          + New Quote
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 px-4 py-4 text-sm text-neutral-500">
            No quotes found.
          </div>
        ) : (
          filtered.map((q) => {
            const idStr = String(q.id);
            const shortId = idStr.slice(0, 8);
            const clientName =
              clientsMap[String(q.client_id)] || "Unknown client";
            const created = q.created_at
              ? new Date(q.created_at).toLocaleDateString("en-AU", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "-";

            return (
              <button
                key={idStr}
                onClick={() => handleRowClick(q.id)}
                className="w-full text-left rounded-2xl border border-neutral-800 bg-neutral-900/40 px-4 py-3 flex items-center justify-between hover:bg-neutral-900/60 transition"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-neutral-50">
                    {q.title ? q.title : `Quote #${shortId}`}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {clientName} · {created}
                  </span>
                </div>

                <div className="text-sm font-semibold text-neutral-50">
                  {formatCurrency(q.total)}
                </div>
              </button>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
