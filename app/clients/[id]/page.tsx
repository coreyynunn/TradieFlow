"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabaseClient";

type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

type Quote = {
  id: number | string;
  title: string | null;
  status: string | null;
  total: number | null;
  created_at: string | null;
};

type Job = {
  id: number | string;
  title: string | null;
  status: string | null;
  created_at: string | null;
};

function formatCurrency(value: number | string | null | undefined) {
  const num = Number(value ?? 0) || 0;
  return num.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
  });
}

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const clientIdParam = params?.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!clientIdParam) return;

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

        // Load client
        const { data: clientRow, error: clientError } = await supabase
          .from("clients")
          .select("id, name, email, phone")
          .eq("id", clientIdParam)
          .maybeSingle();

        if (clientError || !clientRow) {
          console.error("Client load error", clientError);
          setError("Client not found.");
          setClient(null);
          setLoading(false);
          return;
        }

        const clientData = clientRow as Client;
        setClient(clientData);

        // Load quotes for this client
        const { data: quotesData, error: quotesError } = await supabase
          .from("quotes")
          .select("id, title, status, total, created_at")
          .eq("client_id", clientData.id)
          .order("created_at", { ascending: false });

        if (quotesError) {
          console.error("Quotes load error", quotesError);
        }

        setQuotes((quotesData || []) as Quote[]);

        // Load jobs for this client (jobs.client_id is text – compare as string)
        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs")
          .select("id, title, status, created_at")
          .eq("client_id", String(clientData.id))
          .order("created_at", { ascending: false });

        if (jobsError) {
          console.error("Jobs load error", jobsError);
        }

        setJobs((jobsData || []) as Job[]);
        setLoading(false);
      } catch (e: any) {
        console.error("Client detail error", e);
        setError("Failed to load client.");
        setClient(null);
        setLoading(false);
      }
    };

    load();
  }, [clientIdParam, router]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center text-neutral-400">
          Loading client…
        </div>
      </DashboardLayout>
    );
  }

  if (error || !client) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center text-neutral-50">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl space-y-3 max-w-sm">
            <div className="text-lg font-semibold">Error</div>
            <div className="text-red-400">{error || "Client not found."}</div>
            <button
              onClick={() => router.push("/clients")}
              className="mt-2 px-3 py-1.5 text-xs rounded bg-neutral-100 text-neutral-900 hover:bg-white transition"
            >
              Back to clients
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const createdQuotesCount = quotes.length;
  const jobsCount = jobs.length;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
               <div className="flex items-start justify-between gap-4">
          <div>
            <div
              onClick={() => router.push("/clients")}
              className="cursor-pointer text-xs mb-2 text-neutral-400 hover:text-neutral-200 transition"
            >
              ← Back to clients
            </div>
            <h1 className="text-3xl font-semibold">{client.name}</h1>
            <p className="text-neutral-400 text-sm mt-1">
              {createdQuotesCount} quotes · {jobsCount} jobs
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/jobs/new?client=${client.id}`)}
              className="h-8 px-3 rounded-md bg-neutral-900 text-neutral-100 text-xs font-medium hover:bg-neutral-800 border border-neutral-700 transition"
            >
              Add job
            </button>
            <button
              onClick={() => router.push(`/clients/${client.id}/edit`)}
              className="h-8 px-3 rounded-md bg-neutral-100 text-neutral-900 text-xs font-medium hover:bg-white border border-neutral-300 transition"
            >
              Edit client
            </button>
          </div>
        </div>


        {/* Client info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-2">
            <div className="text-xs text-neutral-500 uppercase">Contact</div>
            <div className="text-sm text-neutral-200 space-y-1">
              {client.email && (
                <div>
                  <span className="text-neutral-400 text-xs">Email: </span>
                  <span>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div>
                  <span className="text-neutral-400 text-xs">Phone: </span>
                  <span>{client.phone}</span>
                </div>
              )}
              {!client.email && !client.phone && (
                <div className="text-neutral-500 text-xs">
                  No contact details saved.
                </div>
              )}
            </div>
          </div>

          {/* Simple stats card */}
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-400">Quotes</span>
              <span className="text-neutral-100 font-medium">
                {createdQuotesCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Jobs</span>
              <span className="text-neutral-100 font-medium">
                {jobsCount}
              </span>
            </div>
          </div>
        </div>

        {/* Quotes list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-100">
              Quotes for {client.name}
            </h2>
          </div>

          {quotes.length === 0 ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-xs text-neutral-500">
              No quotes for this client yet.
            </div>
          ) : (
            <div className="space-y-2">
              {quotes.map((q) => {
                const created = q.created_at
                  ? new Date(q.created_at).toLocaleDateString("en-AU", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "-";

                const rawStatus = (q.status || "draft").toLowerCase();
                let badgeBg =
                  "bg-neutral-900/60 border-neutral-700 text-neutral-300";
                let statusLabel = rawStatus.toUpperCase();

                if (rawStatus === "sent") {
                  badgeBg =
                    "bg-blue-900/40 border-blue-500/60 text-blue-100";
                } else if (rawStatus === "accepted") {
                  badgeBg =
                    "bg-emerald-900/40 border-emerald-500/60 text-emerald-100";
                } else if (rawStatus === "declined") {
                  badgeBg =
                    "bg-red-900/40 border-red-500/60 text-red-100";
                } else if (rawStatus === "paid") {
                  badgeBg =
                    "bg-emerald-700/40 border-emerald-400/80 text-emerald-50";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => router.push(`/quotes/${q.id}`)}
                    className="w-full text-left rounded-2xl border border-neutral-800 bg-neutral-900/40 px-4 py-3 flex items-center justify-between hover:bg-neutral-900/60 transition"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-neutral-50">
                        {q.title || `Quote #${String(q.id).slice(0, 8)}`}
                      </span>
                      <span className="text-xs text-neutral-400">
                        Created {created}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        className={`px-2 py-1 rounded-full border text-[10px] uppercase tracking-wide ${badgeBg}`}
                      >
                        {statusLabel}
                      </div>
                      <div className="text-sm font-semibold text-neutral-50">
                        {formatCurrency(q.total)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Jobs list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-100">
              Jobs for {client.name}
            </h2>
          </div>

          {jobs.length === 0 ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-xs text-neutral-500">
              No jobs for this client yet.
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => {
                const created = job.created_at
                  ? new Date(job.created_at).toLocaleDateString("en-AU", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "-";

                const rawStatus = (job.status || "pending").toLowerCase();
                let badgeBg =
                  "bg-neutral-900/60 border-neutral-700 text-neutral-300";
                let statusLabel = rawStatus.toUpperCase();

                if (rawStatus === "active") {
                  badgeBg =
                    "bg-blue-900/40 border-blue-500/60 text-blue-100";
                } else if (rawStatus === "completed") {
                  badgeBg =
                    "bg-emerald-900/40 border-emerald-500/60 text-emerald-100";
                } else if (rawStatus === "cancelled") {
                  badgeBg =
                    "bg-neutral-900/60 border-neutral-600 text-neutral-300";
                }

                return (
                  <button
                    key={job.id}
                    onClick={() => router.push(`/jobs/${job.id}`)}
                    className="w-full text-left rounded-2xl border border-neutral-800 bg-neutral-900/40 px-4 py-3 flex items-center justify-between hover:bg-neutral-900/60 transition"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-neutral-50">
                        {job.title || `Job #${job.id}`}
                      </span>
                      <span className="text-xs text-neutral-400">
                        Created {created}
                      </span>
                    </div>

                    <div
                      className={`px-2 py-1 rounded-full border text-[10px] uppercase tracking-wide ${badgeBg}`}
                    >
                      {statusLabel}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
