"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/DashboardLayout";

type Subscription = {
  id: string;
  email: string | null;
  status: string;
  plan_amount: number | null;
  started_at: string | null;
};

// SAME EMAIL AS IN DashboardLayout
const ADMIN_EMAIL = "coreyynunn02@outlook.com";

export default function AdminPage() {
  const router = useRouter();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace("/auth/login");
        return;
      }

      if (user.email !== ADMIN_EMAIL) {
        router.replace("/dashboard");
        return;
      }

      const { data, error: subsError } = await supabase
        .from("subscriptions")
        .select("id, email, status, plan_amount, started_at")
        .order("started_at", { ascending: false });

      if (subsError) {
        setErrorMsg(subsError.message);
      } else {
        setSubs((data || []) as Subscription[]);
      }

      setLoading(false);
    };

    load();
  }, [router]);

  const activeSubs = subs.filter((s) => s.status === "active");
  const activeCount = activeSubs.length;
  const mrr = activeSubs.reduce(
    (sum, s) => sum + (s.plan_amount ?? 0),
    0
  );
  const arr = mrr * 12;

  const monthlyData = Array.from({ length: 6 }).map((_, i) => ({
    label: `M-${6 - i}`,
    value: Math.round(mrr * (0.7 + i * 0.06)),
  }));
  const maxValue =
    monthlyData.length > 0
      ? Math.max(...monthlyData.map((m) => m.value))
      : 0;

  return (
    <DashboardLayout>
      {loading ? (
        <div className="text-sm text-neutral-400">Loading admin stats…</div>
      ) : errorMsg ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Error loading admin data: {errorMsg}
        </div>
      ) : (
        <div className="space-y-6">
          <header>
            <h1 className="text-2xl font-semibold tracking-tight">
              Subscribers
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Admin-only view of who&apos;s subscribed and the recurring money
              TradieFlow is bringing in.
            </p>
          </header>

          {/* Top stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
              <div className="text-xs text-neutral-400">
                Active subscribers
              </div>
              <div className="mt-2 text-3xl font-semibold text-emerald-400">
                {activeCount}
              </div>
              <div className="mt-1 text-[11px] text-neutral-500">
                People currently paying for TradieFlow
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
              <div className="text-xs text-neutral-400">MRR</div>
              <div className="mt-2 text-3xl font-semibold text-sky-400">
                ${mrr.toFixed(2)}
              </div>
              <div className="mt-1 text-[11px] text-neutral-500">
                Monthly recurring revenue
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
              <div className="text-xs text-neutral-400">ARR (run rate)</div>
              <div className="mt-2 text-3xl font-semibold text-amber-400">
                ${arr.toFixed(2)}
              </div>
              <div className="mt-1 text-[11px] text-neutral-500">
                If nothing changed for the next 12 months
              </div>
            </div>
          </div>

          {/* Simple revenue chart */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-neutral-100">
                  Revenue trend (demo)
                </div>
                <div className="text-[11px] text-neutral-400">
                  Last 6 months based on current MRR – wire to real history
                  later.
                </div>
              </div>
            </div>

            {monthlyData.length === 0 || maxValue === 0 ? (
              <div className="text-xs text-neutral-400">
                No data yet – add some subscriptions into the table.
              </div>
            ) : (
              <div className="mt-4 flex items-end gap-3 h-40">
                {monthlyData.map((m) => {
                  const height = Math.max(
                    8,
                    (m.value / maxValue) * 100
                  );
                  return (
                    <div
                      key={m.label}
                      className="flex-1 flex flex-col items-center justify-end gap-1"
                    >
                      <div
                        className="w-full rounded-t-md bg-emerald-500/80"
                        style={{ height: `${height}%` }}
                      />
                      <div className="text-[10px] text-neutral-400">
                        {m.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Subscribers table */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-neutral-100">
                Subscribers
              </div>
              <div className="text-[11px] text-neutral-400">
                {subs.length} total records
              </div>
            </div>

            {subs.length === 0 ? (
              <div className="text-xs text-neutral-400">
                No subscriptions found yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-[11px] text-neutral-400 border-b border-neutral-800">
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Plan</th>
                      <th className="py-2 pr-4">Started</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subs.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-neutral-800 last:border-none"
                      >
                        <td className="py-2 pr-4 text-neutral-100">
                          {s.email || "—"}
                        </td>
                        <td className="py-2 pr-4 capitalize">
                          <span
                            className={
                              s.status === "active"
                                ? "text-emerald-400"
                                : "text-neutral-400"
                            }
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          ${((s.plan_amount ?? 99.99) as number).toFixed(2)}/m
                        </td>
                        <td className="py-2 pr-4 text-neutral-400">
                          {s.started_at
                            ? new Date(
                                s.started_at
                              ).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
