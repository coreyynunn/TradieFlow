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
  plan_tier: "starter" | "pro" | null;
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

      // Admin check is removed because you want admin tab always visible
      // But users will still be blocked by redirect here
      // Only YOU will be able to stay

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
  const mrr = activeSubs.reduce(
    (sum, s) => sum + (s.plan_amount ?? 0),
    0
  );
  const arr = mrr * 12;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Subscribers</h1>

        {/* Top Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Active subscribers" value={activeCount} color="emerald" />
          <StatCard label="MRR" value={`$${mrr.toFixed(2)}`} color="sky" />
          <StatCard label="ARR (run rate)" value={`$${arr.toFixed(2)}`} color="amber" />
        </div>

        {/* Subscriber Table */}
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
                    <tr key={s.id} className="border-b border-neutral-800 last:border-none">
                      <td className="py-2 pr-4 text-neutral-100">{s.email || "—"}</td>

                      {/* Plan Badge */}
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
