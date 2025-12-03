"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/DashboardLayout";

type PlanTier = "starter" | "pro" | null;

type Subscription = {
  id: string;
  email: string | null;
  status: string;
  plan_amount: number | null;
  started_at: string | null;
  plan_tier: PlanTier;
};

export default function AdminPage() {
  const router = useRouter();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const { data, error: subsError } = await supabase
        .from("subscriptions")
        .select("id, email, status, plan_amount, started_at, plan_tier")
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

  const totalMrr = activeSubs.reduce(
    (sum, s) => sum + (s.plan_amount ?? 0),
    0
  );
  const arr = totalMrr * 12;

  const starterSubs = activeSubs.filter((s) => s.plan_tier === "starter");
  const proSubs = activeSubs.filter((s) => s.plan_tier === "pro");
  const unknownSubs = activeSubs.filter(
    (s) => !s.plan_tier || (s.plan_tier !== "starter" && s.plan_tier !== "pro")
  );

  const starterMrr = starterSubs.reduce(
    (sum, s) => sum + (s.plan_amount ?? 0),
    0
  );
  const proMrr = proSubs.reduce(
    (sum, s) => sum + (s.plan_amount ?? 0),
    0
  );
  const unknownMrr = unknownSubs.reduce(
    (sum, s) => sum + (s.plan_amount ?? 0),
    0
  );

  // Fake 6-month trend using current MRR just to give a SaaS-style chart
  const trendMonths = 6;
  const monthlyTrend = Array.from({ length: trendMonths }).map((_, idx) => {
    const monthIndex = trendMonths - idx;
    const factor = 0.6 + idx * 0.08; // make it look like it grows
    return {
      label: `M-${monthIndex}`,
      value: Math.round(totalMrr * factor),
    };
  });
  const maxTrendValue =
    monthlyTrend.length > 0
      ? Math.max(...monthlyTrend.map((m) => m.value))
      : 0;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-sm text-neutral-400">Loading admin stats…</div>
      </DashboardLayout>
    );
  }

  if (errorMsg) {
    return (
      <DashboardLayout>
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Error loading admin data: {errorMsg}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            Subscribers
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            MRR, ARR, plan breakdown and a quick view of how your recurring
            money is tracking.
          </p>
        </header>

        {/* Top Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Active subscribers"
            value={activeCount}
            color="emerald"
          />
          <StatCard
            label="Total MRR"
            value={`$${totalMrr.toFixed(2)}`}
            color="sky"
          />
          <StatCard
            label="ARR (run rate)"
            value={`$${arr.toFixed(2)}`}
            color="amber"
          />
        </div>

        {/* MRR Breakdown by plan */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
            <div className="text-xs text-neutral-400">Starter MRR</div>
            <div className="mt-2 text-2xl font-semibold text-blue-300">
              ${starterMrr.toFixed(2)}
            </div>
            <div className="mt-1 text-[11px] text-neutral-500">
              {starterSubs.length} active Starter{" "}
              {starterSubs.length === 1 ? "user" : "users"}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
            <div className="text-xs text-neutral-400">Pro MRR</div>
            <div className="mt-2 text-2xl font-semibold text-emerald-300">
              ${proMrr.toFixed(2)}
            </div>
            <div className="mt-1 text-[11px] text-neutral-500">
              {proSubs.length} active Pro{" "}
              {proSubs.length === 1 ? "user" : "users"}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
            <div className="text-xs text-neutral-400">Other / Unknown</div>
            <div className="mt-2 text-2xl font-semibold text-neutral-200">
              ${unknownMrr.toFixed(2)}
            </div>
            <div className="mt-1 text-[11px] text-neutral-500">
              {unknownSubs.length} subs with no plan_tier set
            </div>
          </div>
        </div>

        {/* Simple MRR trend chart */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium text-neutral-100">
                MRR trend (demo)
              </div>
              <div className="text-[11px] text-neutral-400">
                Fake last 6 months based on current MRR – upgrade later to use
                real history.
              </div>
            </div>
          </div>

          {monthlyTrend.length === 0 || maxTrendValue === 0 ? (
            <div className="text-xs text-neutral-400">
              No data yet – add some subscriptions into the table.
            </div>
          ) : (
            <div className="mt-4 flex items-end gap-3 h-40">
              {monthlyTrend.map((m) => {
                const height = Math.max(8, (m.value / maxTrendValue) * 100);
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
                    <div className="text-[10px] text-neutral-500">
                      ${m.value}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Subscribers Table */}
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
                    <th className="py-2 pr-4">Plan</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {subs.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-neutral-800 last:border-none"
                    >
                      {/* Email */}
                      <td className="py-2 pr-4 text-neutral-100">
                        {s.email || "—"}
                      </td>

                      {/* Plan badge */}
                      <td className="py-2 pr-4">
                        {s.plan_tier === "starter" && (
                          <span className="px-2 py-[2px] text-[11px] rounded-md bg-blue-600/20 text-blue-300 border border-blue-500/40">
                            Starter
                          </span>
                        )}
                        {s.plan_tier === "pro" && (
                          <span className="px-2 py-[2px] text-[11px] rounded-md bg-emerald-600/20 text-emerald-300 border border-emerald-500/40">
                            Pro
                          </span>
                        )}
                        {!s.plan_tier && (
                          <span className="px-2 py-[2px] text-[11px] rounded-md bg-neutral-700 text-neutral-300 border border-neutral-600">
                            Unknown
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-2 pr-4 text-neutral-200">
                        ${((s.plan_amount ?? 0) as number).toFixed(2)}/m
                      </td>

                      {/* Status */}
                      <td className="py-2 pr-4">
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

                      {/* Started */}
                      <td className="py-2 pr-4 text-neutral-400">
                        {s.started_at
                          ? new Date(s.started_at).toLocaleDateString()
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
    </DashboardLayout>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: any;
  color: "emerald" | "sky" | "amber";
}) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-400",
    sky: "text-sky-400",
    amber: "text-amber-400",
  };

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
      <div className="text-xs text-neutral-400">{label}</div>
      <div className={`mt-2 text-3xl font-semibold ${colors[color]}`}>
        {value}
      </div>
    </div>
  );
}
