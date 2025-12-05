"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/DashboardLayout";

type Job = {
  id: number | string;
  status: string | null;
};

type Invoice = {
  id: number | string;
  status: string | null;
  total: number | null;
  amount_paid: number | null;
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

  const [jobs, setJobs] = useState<Job[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error("Auth error", authError);
          setError("Authentication error.");
          setLoading(false);
          return;
        }

        if (!user) {
          router.replace("/auth/login");
          return;
        }

        // ---- JOBS ----
        const {
          data: jobsData,
          error: jobsError,
        } = await supabase
          .from("jobs")
          .select("id, status")
          .eq("user_id", user.id);

        if (jobsError) {
          console.error("Dashboard jobs error", jobsError);
          setError("Jobs query failed: " + jobsError.message);
          setLoading(false);
          return;
        }

        // ---- INVOICES ----
        const {
          data: invoicesData,
          error: invoicesError,
        } = await supabase
          .from("invoices")
          .select("id, status, total, amount_paid")
          .eq("user_id", user.id);

        if (invoicesError) {
          console.error("Dashboard invoices error", invoicesError);
          setError("Invoices query failed: " + invoicesError.message);
          setLoading(false);
          return;
        }

        setJobs((jobsData || []) as Job[]);
        setInvoices((invoicesData || []) as Invoice[]);
      } catch (e: any) {
        console.error("Dashboard load error", e);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  // ---- INVOICE METRICS (REAL MONEY) ----
  const paidInvoices = invoices.filter(
    (inv) => (inv.status || "").toLowerCase() === "paid"
  );
  const sentInvoices = invoices.filter(
    (inv) => (inv.status || "").toLowerCase() === "sent"
  );
  const overdueInvoices = invoices.filter(
    (inv) => (inv.status || "").toLowerCase() === "overdue"
  );

  const totalPaid = paidInvoices.reduce((acc, inv) => {
    const amountPaidNum = Number(inv.amount_paid ?? 0);
    const totalNum = Number(inv.total ?? 0);
    const effectivePaid =
      amountPaidNum > 0 ? amountPaidNum : totalNum;
    return acc + effectivePaid;
  }, 0);

  const totalOwingSent = sentInvoices.reduce(
    (acc, inv) =>
      acc +
      (Number(inv.total ?? 0) - Number(inv.amount_paid ?? 0)),
    0
  );

  const totalOwingOverdue = overdueInvoices.reduce(
    (acc, inv) =>
      acc +
      (Number(inv.total ?? 0) - Number(inv.amount_paid ?? 0)),
    0
  );

  const moneyOwing = totalOwingSent + totalOwingOverdue;
  const moneyOverdue = totalOwingOverdue;

  // ---- JOB METRICS (PIPELINE) ----
  const jobsPending = jobs.filter(
    (j) => (j.status || "").toLowerCase() === "pending"
  ).length;

  const jobsActive = jobs.filter(
    (j) => (j.status || "").toLowerCase() === "active"
  ).length;

  const jobsCompleted = jobs.filter(
    (j) => (j.status || "").toLowerCase() === "completed"
  ).length;

  const totalJobs = jobs.length;

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
              Quick snapshot of money, invoices, and your job pipeline.
            </p>
          </div>
        </div>

        {/* ROW 1: Money received / owing / overdue (INVOICES) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Money received */}
          <button
            onClick={() => router.push("/invoices?status=paid")}
            className="text-left cursor-pointer rounded-2xl border border-emerald-500/80 bg-emerald-900/60 p-4 space-y-2 hover:bg-emerald-900/80 transition"
          >
            <div className="text-[11px] text-emerald-200 uppercase tracking-wide">
              Money received
            </div>
            <div className="text-2xl font-semibold text-emerald-50">
              {formatCurrency(totalPaid)}
            </div>
            <div className="text-[11px] text-emerald-100/70">
              Sum of all invoices marked as paid.
            </div>
          </button>

          {/* Money owing */}
          <button
            onClick={() => router.push("/invoices?owing=true")}
            className="text-left cursor-pointer rounded-2xl border border-amber-500/80 bg-amber-900/50 p-4 space-y-2 hover:bg-amber-900/70 transition"
          >
            <div className="text-[11px] text-amber-100 uppercase tracking-wide">
              Money owing
            </div>
            <div className="text-2xl font-semibold text-amber-50">
              {formatCurrency(moneyOwing)}
            </div>
            <div className="text-[11px] text-amber-100/80">
              Sent + overdue invoices not fully paid.
            </div>
          </button>

          {/* Overdue */}
          <button
            onClick={() => router.push("/invoices?status=overdue")}
            className="text-left cursor-pointer rounded-2xl border border-red-500/80 bg-red-900/50 p-4 space-y-2 hover:bg-red-900/70 transition"
          >
            <div className="text-[11px] text-red-100 uppercase tracking-wide">
              Overdue
            </div>
            <div className="text-2xl font-semibold text-red-50">
              {formatCurrency(moneyOverdue)}
            </div>
            <div className="text-[11px] text-red-100/80">
              Total outstanding on overdue invoices only.
            </div>
          </button>
        </div>

        {/* ROW 2: Jobs overview (PIPELINE) */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Total jobs */}
          <button
            onClick={() => router.push("/jobs")}
            className="text-left cursor-pointer rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2 hover:bg-neutral-900 transition"
          >
            <div className="text-[11px] text-neutral-400 uppercase tracking-wide">
              Total jobs
            </div>
            <div className="text-2xl font-semibold text-neutral-50">
              {totalJobs}
            </div>
            <div className="text-[11px] text-neutral-500">
              All jobs in the system.
            </div>
          </button>

          {/* Pending jobs */}
          <button
            onClick={() => router.push("/jobs")}
            className="text-left cursor-pointer rounded-2xl border border-amber-600/60 bg-amber-900/30 p-4 space-y-2 hover:bg-amber-900/50 transition"
          >
            <div className="text-[11px] text-amber-200 uppercase tracking-wide">
              Pending jobs
            </div>
            <div className="text-2xl font-semibold text-amber-50">
              {jobsPending}
            </div>
            <div className="text-[11px] text-amber-100/70">
              Jobs waiting to start.
            </div>
          </button>

          {/* Active jobs */}
          <button
            onClick={() => router.push("/jobs")}
            className="text-left cursor-pointer rounded-2xl border border-blue-600/60 bg-blue-900/30 p-4 space-y-2 hover:bg-blue-900/50 transition"
          >
            <div className="text-[11px] text-blue-200 uppercase tracking-wide">
              Active jobs
            </div>
            <div className="text-2xl font-semibold text-blue-50">
              {jobsActive}
            </div>
            <div className="text-[11px] text-blue-100/70">
              Jobs currently in progress.
            </div>
          </button>

          {/* Completed jobs */}
          <button
            onClick={() => router.push("/jobs")}
            className="text-left cursor-pointer rounded-2xl border border-emerald-600/60 bg-emerald-900/30 p-4 space-y-2 hover:bg-emerald-900/50 transition"
          >
            <div className="text-[11px] text-emerald-200 uppercase tracking-wide">
              Completed jobs
            </div>
            <div className="text-2xl font-semibold text-emerald-50">
              {jobsCompleted}
            </div>
            <div className="text-[11px] text-emerald-100/70">
              Finished work (should line up with paid invoices).
            </div>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
