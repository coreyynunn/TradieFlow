"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabaseClient";

type Invoice = {
  id: number | string;
  client_id: string | null;
  status: string | null;
  issue_date: string | null;
  due_date: string | null;
  total: number | null;
  title?: string | null; // 👈 added
};

type Client = {
  id: string;
  name: string;
};

function formatCurrency(value: number | string | null | undefined) {
  const num = Number(value ?? 0) || 0;
  return num.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
  });
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clientsMap, setClientsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const { data: invoicesData, error: invoicesError } = await supabase
          .from("invoices")
          .select("*")
          .order("issue_date", { ascending: false });

        if (invoicesError) {
          console.error("Invoices load error", invoicesError);
          throw invoicesError;
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

        setInvoices((invoicesData || []) as Invoice[]);
        setClientsMap(map);
      } catch (e: any) {
        console.error("Invoices page error", e);
        setError("Failed to load invoices.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const handleRowClick = (id: number | string) => {
    router.push(`/invoices/${id}`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-neutral-400 text-sm">Loading invoices…</div>
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
          <h1 className="text-xl font-semibold text-neutral-50">Invoices</h1>
          <p className="text-xs text-neutral-500">
            Invoices created from your quotes. Click one to view or update.
          </p>
        </div>
        {/* Later: a standalone "New invoice" if we want */}
      </div>

      {/* List */}
      <div className="space-y-2">
        {invoices.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 px-4 py-4 text-sm text-neutral-500">
            No invoices yet. Create one from a quote.
          </div>
        ) : (
          invoices.map((inv) => {
            const idStr = String(inv.id);
            const clientName =
              clientsMap[String(inv.client_id ?? "")] || "Unknown client";

            const issue = inv.issue_date
              ? new Date(inv.issue_date).toLocaleDateString("en-AU", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "-";

            const rawStatus = (inv.status || "draft").toLowerCase();
            let statusLabel = rawStatus.toUpperCase();
            let statusColor = "text-neutral-300";
            let badgeBg = "bg-neutral-900 border-neutral-700";

            if (rawStatus === "sent") {
              statusColor = "text-blue-200";
              badgeBg = "bg-blue-900/40 border-blue-500/60";
            } else if (rawStatus === "paid") {
              statusColor = "text-emerald-200";
              badgeBg = "bg-emerald-900/40 border-emerald-500/60";
            } else if (rawStatus === "overdue") {
              statusColor = "text-red-200";
              badgeBg = "bg-red-900/40 border-red-500/60";
            } else if (rawStatus === "cancelled") {
              statusColor = "text-neutral-300";
              badgeBg = "bg-neutral-900/60 border-neutral-600";
            }

            const title = inv.title || `Invoice #${idStr}`;

            return (
              <button
                key={idStr}
                onClick={() => handleRowClick(inv.id)}
                className="w-full text-left rounded-2xl border border-neutral-800 bg-neutral-900/40 px-4 py-3 flex items-center justify-between hover:bg-neutral-900/60 transition"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-neutral-50">
                    {title}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {clientName} · Issued {issue}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div
                    className={`px-2 py-1 rounded-full border text-[10px] uppercase tracking-wide ${badgeBg} ${statusColor}`}
                  >
                    {statusLabel}
                  </div>
                  <div className="text-sm font-semibold text-neutral-50">
                    {formatCurrency(inv.total)}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
