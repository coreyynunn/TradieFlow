"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/DashboardLayout";

type Quote = {
  id: number | string;
  status: string | null;
  total: number | null;
  created_at: string | null;
};

function formatCurrency(value: number | string | null | undefined) {
  const num = Number(value ?? 0) || 0;
  return num.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
  });
}

export default function DashboardPage() {
  const router = useRouter();

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Auth error", authError);
      }

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("quotes")
        .select("id, status, total, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Dashboard quotes error", error);
        setError("Failed to load dashboard data.");
        setLoading(false);
        return;
      }

      setQuotes((data || []) as Quote[]);
      setLoading(false);
    };

    load();
  }, [router]);

  // ---- METRICS ----
  const totalQuotes = quotes.length;

  const totalAccepted = quotes.filter(
    (q) => (q.status || "").toLowerCase() === "accepted"
  ).length;

  const totalValue = quotes.reduce((acc, q) => {
    return acc + Number(q.total ?? 0);
  }, 0);

  const moneyOwing = quotes
    .filter((q) => {
      const s = (q.status || "").toLowerCase();
      return s === "sent" || s === "accepted";
    })
    .reduce((acc, q) => acc + Number(q.total ?? 0), 0);

  const moneyReceived = quotes
    .filter((q) => (q.status || "").toLowerCase() === "paid")
    .reduce((acc, q) => acc + Number(q.total ?? 0), 0);

  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  const overdueValue = quotes
    .filter((q) => {
      const s = (q.status || "").toLowerCase();
      if (s !== "accepted") return false;
      if (!q.created_at) return false;
      const createdTime = new Date(q.created_at).getTime();
      return now - createdTime > thirtyDaysMs;
    })
    .reduce((acc, q) => acc + Number(q.total ?? 0), 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center text-neutral-400">
          Loading dashboard…
        </div>
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
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-neutral-50">
              Dashboard
            </h1>
            <p className="text-xs text-neutral-500">
              Quick snapshot of money in, money owed, and how quotes are tracking.
            </p>
          </div>
        </div>

        {/* ROW 1: Money received / owing / overdue */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Money received */}
          <button
            onClick={() => router.push("/quotes?status=paid")}
            className="text-left cursor-pointer rounded-2xl border border-emerald-500/80 bg-emerald-900/60 p-4 space-y-2 hover:bg-emerald-900/80 transition"
          >
            <div className="text-[11px] text-emerald-200 uppercase tracking-wide">
              Money received
            </div>
            <div className="text-2xl font-semibold text-emerald-50">
              {formatCurrency(moneyReceived)}
            </div>
            <div className="text-[11px] text-emerald-100/70">
              Sum of all quotes marked as paid.
            </div>
          </button>

          {/* Money owing */}
          <button
            onClick={() => router.push("/quotes?owing=true")}
            className="text-left cursor-pointer rounded-2xl border border-amber-500/80 bg-amber-900/50 p-4 space-y-2 hover:bg-amber-900/70 transition"
          >
            <div className="text-[11px] text-amber-100 uppercase tracking-wide">
              Money owing
            </div>
            <div className="text-2xl font-semibold text-amber-50">
              {formatCurrency(moneyOwing)}
            </div>
            <div className="text-[11px] text-amber-100/80">
              Sent or accepted quotes not yet marked as paid.
            </div>
          </button>

          {/* Overdue */}
          <button
            onClick={() => router.push("/quotes?overdue=true")}
            className="text-left cursor-pointer rounded-2xl border border-red-500/80 bg-red-900/50 p-4 space-y-2 hover:bg-red-900/70 transition"
          >
            <div className="text-[11px] text-red-100 uppercase tracking-wide">
              Overdue (rough)
            </div>
            <div className="text-2xl font-semibold text-red-50">
              {formatCurrency(overdueValue)}
            </div>
            <div className="text-[11px] text-red-100/80">
              Accepted quotes older than 30 days. We can later swap this to use
              a proper “due date”.
            </div>
          </button>
        </div>

        {/* ROW 2: Overall stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total quotes */}
          <button
            onClick={() => router.push("/quotes")}
            className="text-left cursor-pointer rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2 hover:bg-neutral-900 transition"
          >
            <div className="text-[11px] text-neutral-400 uppercase tracking-wide">
              Total quotes
            </div>
            <div className="text-2xl font-semibold text-neutral-50">
              {totalQuotes}
            </div>
            <div className="text-[11px] text-neutral-500">
              All quotes in the system.
            </div>
          </button>

          {/* Accepted quotes */}
          <button
            onClick={() => router.push("/quotes?status=accepted")}
            className="text-left cursor-pointer rounded-2xl border border-emerald-600/60 bg-emerald-900/30 p-4 space-y-2 hover:bg-emerald-900/50 transition"
          >
            <div className="text-[11px] text-emerald-200 uppercase tracking-wide">
              Accepted quotes
            </div>
            <div className="text-2xl font-semibold text-emerald-50">
              {totalAccepted}
            </div>
            <div className="text-[11px] text-emerald-100/70">
              Jobs that have been approved.
            </div>
          </button>

          {/* Total quoted value */}
          <button
            onClick={() => router.push("/quotes")}
            className="text-left cursor-pointer rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2 hover:bg-neutral-900 transition"
          >
            <div className="text-[11px] text-neutral-400 uppercase tracking-wide">
              Total quoted value
            </div>
            <div className="text-2xl font-semibold text-neutral-50">
              {formatCurrency(totalValue)}
            </div>
            <div className="text-[11px] text-neutral-500">
              Sum of all quote totals.
            </div>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
