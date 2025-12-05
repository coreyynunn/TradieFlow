// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabaseClient";

type Quote = {
  id: number | string;
  client_id: string;
  title: string | null;
  status: string | null;
  total: number | null;
  created_at: string | null;
  clients?: {
    name: string;
  } | null;
};

type Job = {
  id: number | string;
  client_id: string | null;
  quote_id: number | null;
  title: string | null;
  status: string | null;
  created_at: string | null;
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

export default function JobsBoardPage() {
  const router = useRouter();

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clientsMap, setClientsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // drag state
  const [draggingJobId, setDraggingJobId] = useState<number | string | null>(
    null
  );

  // status update state
  const [updatingJobId, setUpdatingJobId] = useState<number | string | null>(
    null
  );

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

        // Load quotes (for "Quoted" column)
        const { data: quotesData, error: quotesError } = await supabase
          .from("quotes")
          .select(
            `
            id,
            client_id,
            title,
            status,
            total,
            created_at,
            clients (
              name
            )
          `
          )
          .order("created_at", { ascending: false });

        if (quotesError) {
          console.error("Quotes load error", quotesError);
          throw quotesError;
        }

        // Load jobs (for Pending / Active / Completed)
        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (jobsError) {
          console.error("Jobs load error", jobsError);
          throw jobsError;
        }

        // Load clients into a map for job client names
        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select("id, name");

        if (clientsError) {
          console.error("Clients load error", clientsError);
          throw clientsError;
        }

        const cmap: Record<string, string> = {};
        (clientsData || []).forEach((c: any) => {
          cmap[String(c.id)] = c.name;
        });

        setQuotes((quotesData || []) as Quote[]);
        setJobs((jobsData || []) as Job[]);
        setClientsMap(cmap);
      } catch (e: any) {
        console.error("Jobs board error", e);
        setError("Failed to load jobs board.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  // 🔹 Show ALL quotes in the Quoted column
  const quotedQuotes = quotes;

  const pendingJobs = jobs.filter(
    (j) => (j.status || "pending").toLowerCase() === "pending"
  );
  const activeJobs = jobs.filter(
    (j) => (j.status || "").toLowerCase() === "active"
  );
  const completedJobs = jobs.filter(
    (j) => (j.status || "").toLowerCase() === "completed"
  );

  function handleJobDragStart(id: number | string) {
    setDraggingJobId(id);
  }

  function handleColumnDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  async function updateJobStatus(jobId: number | string, newStatus: string) {
    setUpdatingJobId(jobId);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .update({ status: newStatus })
        .eq("id", jobId)
        .select("*")
        .single();

      if (error) {
        console.error("Update job status error", error);
        alert("Error updating job status.");
        return;
      }

      setJobs((prev) =>
        prev.map((j) =>
          String(j.id) === String(jobId) ? { ...(j as Job), ...(data as Job) } : j
        )
      );
    } catch (e: any) {
      console.error("Update job status error", e);
      alert("Error updating job status.");
    } finally {
      setUpdatingJobId(null);
    }
  }

  async function handleColumnDrop(newStatus: string) {
    if (!draggingJobId) return;
    const jobId = draggingJobId;
    setDraggingJobId(null);
    await updateJobStatus(jobId, newStatus);
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-neutral-400 text-sm">Loading jobs board…</div>
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
      {/* Header with buttons */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-50">Jobs board</h1>
          <p className="text-xs text-neutral-500">
            Track work from quoted through to completed.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/quotes/new")}
            className="h-9 px-3 rounded-md bg-neutral-100 text-neutral-900 text-xs font-medium hover:bg-white border border-neutral-300 transition"
          >
            + New Quote
          </button>
          <button
            onClick={() => router.push("/jobs/new")}
            className="h-9 px-3 rounded-md bg-neutral-900 text-neutral-100 text-xs font-medium hover:bg-neutral-800 border border-neutral-700 transition"
          >
            + New Job
          </button>
        </div>
      </div>

      {/* Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Quoted column (quotes only, not droppable) */}
        <Column title="Quoted" itemsCount={quotedQuotes.length}>
          {quotedQuotes.length === 0 ? (
            <EmptyColumn text="No quoted jobs yet." />
          ) : (
            quotedQuotes.map((q) => {
              const created = q.created_at
                ? new Date(q.created_at).toLocaleDateString("en-AU", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "-";

              const clientName = q.clients?.name || "Unknown client";

              return (
                <button
                  key={q.id}
                  onClick={() => router.push(`/quotes/${q.id}`)}
                  className="w-full text-left rounded-xl border border-neutral-800 bg-neutral-900/40 px-3 py-2 mb-2 hover:bg-neutral-900/70 transition"
                >
                  <div className="text-xs font-medium text-neutral-50">
                    {q.title || `Quote #${String(q.id).slice(0, 8)}`}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    {clientName}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-neutral-500">
                    <span>{created}</span>
                    <span className="text-neutral-100 font-semibold">
                      {formatCurrency(q.total)}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </Column>

        {/* Pending column (jobs, droppable) */}
        <Column
          title="Pending"
          itemsCount={pendingJobs.length}
          droppable
          onDrop={() => handleColumnDrop("pending")}
          onDragOver={handleColumnDragOver}
        >
          {pendingJobs.length === 0 ? (
            <EmptyColumn text="No pending jobs." />
          ) : (
            pendingJobs.map((job) => {
              const created = job.created_at
                ? new Date(job.created_at).toLocaleDateString("en-AU", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "-";

              const clientName =
                clientsMap[String(job.client_id ?? "")] || "Unknown client";

              return (
                <div
                  key={job.id}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900/40 px-3 py-2 mb-2 hover:bg-neutral-900/70 transition"
                  draggable
                  onDragStart={() => handleJobDragStart(job.id)}
                >
                  <button
                    onClick={() => router.push(`/jobs/${job.id}`)}
                    className="w-full text-left"
                  >
                    <div className="text-xs font-medium text-neutral-50">
                      {job.title || `Job #${job.id}`}
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      {clientName}
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-1">
                      Created {created}
                    </div>
                  </button>
                </div>
              );
            })
          )}
        </Column>

        {/* Active column (jobs, droppable) */}
        <Column
          title="Active"
          itemsCount={activeJobs.length}
          droppable
          onDrop={() => handleColumnDrop("active")}
          onDragOver={handleColumnDragOver}
        >
          {activeJobs.length === 0 ? (
            <EmptyColumn text="No active jobs." />
          ) : (
            activeJobs.map((job) => {
              const created = job.created_at
                ? new Date(job.created_at).toLocaleDateString("en-AU", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "-";

              const clientName =
                clientsMap[String(job.client_id ?? "")] || "Unknown client";

              return (
                <div
                  key={job.id}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900/40 px-3 py-2 mb-2 hover:bg-neutral-900/70 transition"
                  draggable
                  onDragStart={() => handleJobDragStart(job.id)}
                >
                  <button
                    onClick={() => router.push(`/jobs/${job.id}`)}
                    className="w-full text-left"
                  >
                    <div className="text-xs font-medium text-neutral-50">
                      {job.title || `Job #${job.id}`}
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      {clientName}
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-1">
                      Created {created}
                    </div>
                  </button>
                </div>
              );
            })
          )}
        </Column>

        {/* Completed column (jobs, droppable) */}
        <Column
          title="Completed"
          itemsCount={completedJobs.length}
          droppable
          onDrop={() => handleColumnDrop("completed")}
          onDragOver={handleColumnDragOver}
        >
          {completedJobs.length === 0 ? (
            <EmptyColumn text="No completed jobs yet." />
          ) : (
            completedJobs.map((job) => {
              const created = job.created_at
                ? new Date(job.created_at).toLocaleDateString("en-AU", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "-";

              const clientName =
                clientsMap[String(job.client_id ?? "")] || "Unknown client";

              return (
                <div
                  key={job.id}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900/40 px-3 py-2 mb-2 hover:bg-neutral-900/70 transition"
                  draggable
                  onDragStart={() => handleJobDragStart(job.id)}
                >
                  <button
                    onClick={() => router.push(`/jobs/${job.id}`)}
                    className="w-full text-left"
                  >
                    <div className="text-xs font-medium text-neutral-50">
                      {job.title || `Job #${job.id}`}
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      {clientName}
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-1">
                      Created {created}
                    </div>
                  </button>
                </div>
              );
            })
          )}
        </Column>
      </div>
    </DashboardLayout>
  );
}

function Column({
  title,
  itemsCount,
  children,
  droppable,
  onDrop,
  onDragOver,
}: {
  title: string;
  itemsCount: number;
  children: React.ReactNode;
  droppable?: boolean;
  onDrop?: () => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      className="flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900/40 p-3 min-h-[200px]"
      onDragOver={droppable ? onDragOver : undefined}
      onDrop={
        droppable
          ? (e) => {
              e.preventDefault();
              onDrop && onDrop();
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-neutral-100 uppercase tracking-wide">
          {title}
        </div>
        <div className="text-[11px] text-neutral-400">{itemsCount}</div>
      </div>
      <div className="flex-1 overflow-y-auto pr-1">{children}</div>
    </div>
  );
}

function EmptyColumn({ text }: { text: string }) {
  return (
    <div className="text-[11px] text-neutral-500 border border-dashed border-neutral-700 rounded-lg px-2 py-3 text-center">
      {text}
    </div>
  );
}
