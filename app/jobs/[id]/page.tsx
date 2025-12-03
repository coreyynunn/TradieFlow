"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabaseClient";
import JobNotesSection from "@/components/JobNotesSection";
import JobAttachmentsSection from "@/components/JobAttachmentsSection";

type Job = {
  id: number | string;
  user_id?: string;
  client_id: string | null;
  quote_id: number | null;
  status: string | null;
  title: string | null;
  address: string | null;
  start_date: string | null;
  due_date: string | null;
  created_at: string | null;
};

type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

type Quote = {
  id: number | string;
  title: string | null;
  total: number | null;
};

function formatCurrency(value: number | string | null | undefined) {
  const num = Number(value ?? 0) || 0;
  return num.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
  });
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jobIdParam = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // inline edit state for job details card
  const [editingDetails, setEditingDetails] = useState(false);
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [editAddress, setEditAddress] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  // inline edit state for client card
  const [editingClientDetails, setEditingClientDetails] = useState(false);
  const [clientDetailsSaving, setClientDetailsSaving] = useState(false);
  const [editClientName, setEditClientName] = useState("");
  const [editClientEmail, setEditClientEmail] = useState("");
  const [editClientPhone, setEditClientPhone] = useState("");

  // --------- load job / client / quote ---------
  useEffect(() => {
    const load = async () => {
      if (!jobIdParam) {
        setError("Missing job ID.");
        setLoading(false);
        return;
      }

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

        const numericId = Number(jobIdParam);
        if (Number.isNaN(numericId)) {
          setError("Invalid job ID.");
          setLoading(false);
          return;
        }

        // job
        const { data: jobRow, error: jobError } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", numericId)
          .maybeSingle();

        if (jobError || !jobRow) {
          console.error("Job load error", jobError);
          setError("Job not found.");
          setJob(null);
          setLoading(false);
          return;
        }

        const j = jobRow as Job;
        setJob(j);

        // client
        if (j.client_id) {
          const { data: clientRow, error: clientError } = await supabase
            .from("clients")
            .select("id, name, email, phone")
            .eq("id", j.client_id)
            .maybeSingle();

          if (!clientError && clientRow) {
            setClient(clientRow as Client);
          } else {
            setClient(null);
          }
        } else {
          setClient(null);
        }

        // quote
        if (j.quote_id) {
          const { data: quoteRow, error: quoteError } = await supabase
            .from("quotes")
            .select("id, title, total")
            .eq("id", j.quote_id)
            .maybeSingle();

          if (!quoteError && quoteRow) {
            setQuote(quoteRow as Quote);
          } else {
            setQuote(null);
          }
        } else {
          setQuote(null);
        }

        setLoading(false);
      } catch (e: any) {
        console.error("Job unexpected error", e);
        setError("Failed to load job.");
        setJob(null);
        setLoading(false);
      }
    };

    load();
  }, [jobIdParam, router]);

  // keep inline edit fields in sync with loaded job
  useEffect(() => {
    if (job) {
      setEditAddress(job.address || "");
      setEditStartDate(job.start_date ? job.start_date.slice(0, 10) : "");
      setEditDueDate(job.due_date ? job.due_date.slice(0, 10) : "");
    }
  }, [job]);

  // keep inline client fields in sync with loaded client
  useEffect(() => {
    if (client) {
      setEditClientName(client.name || "");
      setEditClientEmail((client.email as string) || "");
      setEditClientPhone((client.phone as string) || "");
    } else {
      setEditClientName("");
      setEditClientEmail("");
      setEditClientPhone("");
    }
  }, [client]);

  // --------- actions ---------

  async function updateStatus(newStatus: string) {
    if (!job) return;

    setSavingStatus(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("jobs")
        .update({ status: newStatus })
        .eq("id", job.id);

      if (error) {
        console.error("Job update error", error);
        setError("Failed to update job.");
        setSavingStatus(false);
        return;
      }

      setJob((prev) => (prev ? { ...prev, status: newStatus } : prev));
    } catch (e: any) {
      console.error("Job update error", e);
      setError("Failed to update job.");
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleDelete() {
    if (!job) return;
    const confirmed = confirm("Delete this job permanently?");
    if (!confirmed) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("jobs")
        .delete()
        .eq("id", job.id);

      if (error) {
        console.error("Delete job error", error);
        alert("Error deleting job.");
        setDeleting(false);
        return;
      }

      router.push("/jobs");
    } catch (e: any) {
      console.error("Delete job error", e);
      alert("Error deleting job.");
      setDeleting(false);
    }
  }

  async function saveJobDetails() {
    if (!job) return;

    setDetailsSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("jobs")
        .update({
          address: editAddress.trim() || null,
          start_date: editStartDate || null,
          due_date: editDueDate || null,
        })
        .eq("id", job.id);

      if (error) {
        console.error("Job details update error", error);
        setError("Failed to save job details.");
        setDetailsSaving(false);
        return;
      }

      setJob((prev) =>
        prev
          ? {
              ...prev,
              address: editAddress.trim() || null,
              start_date: editStartDate || null,
              due_date: editDueDate || null,
            }
          : prev
      );

      setEditingDetails(false);
    } catch (e: any) {
      console.error("Job details update error", e);
      setError("Failed to save job details.");
    } finally {
      setDetailsSaving(false);
    }
  }

  async function saveClientDetails() {
    if (!client) return;

    setClientDetailsSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("clients")
        .update({
          name: editClientName.trim() || "Unnamed client",
          email: editClientEmail.trim() || null,
          phone: editClientPhone.trim() || null,
        })
        .eq("id", client.id);

      if (error) {
        console.error("Client details update error", error);
        setError("Failed to save client details.");
        setClientDetailsSaving(false);
        return;
      }

      setClient((prev) =>
        prev
          ? {
              ...prev,
              name: editClientName.trim() || prev.name,
              email: editClientEmail.trim() || null,
              phone: editClientPhone.trim() || null,
            }
          : prev
      );

      setEditingClientDetails(false);
    } catch (e: any) {
      console.error("Client details update error", e);
      setError("Failed to save client details.");
    } finally {
      setClientDetailsSaving(false);
    }
  }

  // --------- loading / error ---------

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center text-neutral-400">
          Loading job…
        </div>
      </DashboardLayout>
    );
  }

  if (error || !job) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center text-neutral-50">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl space-y-3 max-w-sm">
            <div className="text-lg font-semibold">Error</div>
            <div className="text-red-400">{error || "Job not found."}</div>
            <button
              onClick={() => router.push("/jobs")}
              className="mt-2 px-3 py-1.5 text-xs rounded bg-neutral-100 text-neutral-900 hover:bg-white transition"
            >
              Back to jobs board
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // --------- computed display values ---------
  const createdDate = job.created_at
    ? new Date(job.created_at).toLocaleString("en-AU", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "-";

  const startDate = job.start_date
    ? new Date(job.start_date).toLocaleDateString("en-AU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  const dueDate = job.due_date
    ? new Date(job.due_date).toLocaleDateString("en-AU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  const rawStatus = (job.status || "pending").toLowerCase();
  const statusLabel = rawStatus.toUpperCase();

  let statusClasses =
    "inline-flex px-3 py-1 text-xs rounded-full border bg-neutral-900 text-neutral-200 border-neutral-700";

  if (rawStatus === "pending") {
    statusClasses =
      "inline-flex px-3 py-1 text-xs rounded-full border bg-amber-900/40 text-amber-100 border-amber-500/60";
  } else if (rawStatus === "active") {
    statusClasses =
      "inline-flex px-3 py-1 text-xs rounded-full border bg-blue-900/40 text-blue-200 border-blue-500/60";
  } else if (rawStatus === "completed") {
    statusClasses =
      "inline-flex px-3 py-1 text-xs rounded-full border bg-emerald-900/40 text-emerald-200 border-emerald-500/60";
  } else if (rawStatus === "cancelled") {
    statusClasses =
      "inline-flex px-3 py-1 text-xs rounded-full border bg-neutral-900/60 text-neutral-200 border-neutral-600";
  }

  // --------- single final return ---------
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div
              onClick={() => router.push("/jobs")}
              className="cursor-pointer text-xs mb-2 text-neutral-400 hover:text-neutral-200 transition"
            >
              ← Back to jobs board
            </div>
            <h1 className="text-3xl font-semibold">
              {job.title || `Job #${job.id}`}
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Created {createdDate}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className={statusClasses}>{statusLabel}</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => router.push(`/jobs/${job.id}/edit`)}
                className="h-8 px-3 rounded-md bg-neutral-100 text-neutral-900 text-xs font-medium hover:bg-white border border-neutral-300 transition"
              >
                Edit job
              </button>
              {job.quote_id && (
                <button
                  onClick={() => router.push(`/quotes/${job.quote_id}`)}
                  className="h-8 px-3 rounded-md bg-neutral-900 text-neutral-100 text-xs font-medium hover:bg-neutral-800 border border-neutral-700 transition"
                >
                  View quote
                </button>
              )}
              {client && (
                <button
                  onClick={() => router.push(`/clients/${client.id}`)}
                  className="h-8 px-3 rounded-md bg-neutral-900 text-neutral-100 text-xs font-medium hover:bg-neutral-800 border border-neutral-700 transition"
                >
                  View client
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="h-8 px-3 rounded-md bg-red-500/20 text-red-300 text-xs font-medium border border-red-500/40 hover:bg-red-500/30 disabled:opacity-60 transition"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>

        {/* Status actions row */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            disabled={savingStatus}
            onClick={() => updateStatus("pending")}
            className="px-3 py-1 rounded-md border border-amber-500/60 bg-amber-900/30 text-amber-100 hover:bg-amber-900/60 disabled:opacity-60"
          >
            Mark Pending
          </button>
          <button
            disabled={savingStatus}
            onClick={() => updateStatus("active")}
            className="px-3 py-1 rounded-md border border-blue-500/60 bg-blue-900/40 text-blue-100 hover:bg-blue-900/70 disabled:opacity-60"
          >
            Mark Active
          </button>
          <button
            disabled={savingStatus}
            onClick={() => updateStatus("completed")}
            className="px-3 py-1 rounded-md border border-emerald-500/60 bg-emerald-900/40 text-emerald-100 hover:bg-emerald-900/70 disabled:opacity-60"
          >
            Mark Completed
          </button>
          <button
            disabled={savingStatus}
            onClick={() => updateStatus("cancelled")}
            className="px-3 py-1 rounded-md border border-neutral-500/60 bg-neutral-900 text-neutral-200 hover:bg-neutral-800 disabled:opacity-60"
          >
            Cancel Job
          </button>
        </div>

        {/* Top info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Job details – inline editable */}
          <div
            onClick={() => {
              if (!editingDetails) {
                setEditingDetails(true);
              }
            }}
            className="md:col-span-2 p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-3 cursor-pointer hover:border-neutral-600 hover:bg-neutral-900/80 transition"
          >
            <div className="flex items-center justify_between">
              <div className="text-xs text-neutral-500 uppercase">
                Job details
              </div>
              <div className="text-[10px] text-neutral-500">
                {editingDetails ? "Editing" : "Click to edit"}
              </div>
            </div>

            {editingDetails ? (
              <div
                className="space-y-3 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-1">
                  <label className="text-neutral-400">Site address</label>
                  <input
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-md px-2 py-1.5 text-xs text-neutral-100"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Site address"
                  />
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-neutral-400">Start date</label>
                    <input
                      type="date"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-md px-2 py-1.5 text-xs text-neutral-100"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-neutral-400">Due date</label>
                    <input
                      type="date"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-md px-2 py-1.5 text-xs text-neutral-100"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    className="px-3 py-1 text-[11px] rounded border border-neutral-700 text-neutral-300 hover:bg-neutral-900"
                    onClick={() => {
                      setEditingDetails(false);
                      if (job) {
                        setEditAddress(job.address || "");
                        setEditStartDate(
                          job.start_date
                            ? job.start_date.slice(0, 10)
                            : ""
                        );
                        setEditDueDate(
                          job.due_date ? job.due_date.slice(0, 10) : ""
                        );
                      }
                    }}
                    disabled={detailsSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 text-[11px] rounded bg-neutral-100 text-neutral-900 hover:bg-white disabled:opacity-60"
                    onClick={saveJobDetails}
                    disabled={detailsSaving}
                  >
                    {detailsSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-neutral-200 space-y-1">
                <div>
                  <span className="text-neutral-400 text-xs">
                    Site address:{" "}
                  </span>
                  <span>{job.address || "Not set"}</span>
                </div>
                <div className="flex justify-between text-xs text-neutral-400 mt-2">
                  <span>
                    Start:{" "}
                    <span className="text-neutral-200">
                      {startDate || "-"}
                    </span>
                  </span>
                  <span>
                    Due:{" "}
                    <span className="text-neutral-200">{dueDate || "-"}</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Linked quote summary */}
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-2 text-sm">
            <div className="text-xs text-neutral-500 uppercase">
              Linked quote
            </div>
            {quote ? (
              <>
                <div className="text-neutral-100 text-xs font-medium">
                  {quote.title || `Quote #${String(quote.id).slice(0, 8)}`}
                </div>
                <div className="text-xs text-neutral-400">
                  Total:{" "}
                  <span className="text-neutral-100 font-semibold">
                    {formatCurrency(quote.total)}
                  </span>
                </div>
                <button
                  onClick={() => router.push(`/quotes/${quote.id}`)}
                  className="mt-2 text-[11px] px-2 py-1 rounded border border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                >
                  Open quote
                </button>
              </>
            ) : (
              <div className="text-xs text-neutral-500">
                No quote linked to this job.
              </div>
            )}
          </div>
        </div>

        {/* Client + notes / attachments */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Client – inline editable */}
          <div
            onClick={() => {
              if (!editingClientDetails && client) {
                setEditingClientDetails(true);
              }
            }}
            className="md:col-span-1 p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-2 cursor-pointer hover:border-neutral-600 hover:bg-neutral-900/80 transition"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs text-neutral-500 uppercase">Client</div>
              <div className="text-[10px] text-neutral-500">
                {editingClientDetails
                  ? "Editing"
                  : client
                  ? "Click to edit"
                  : ""}
              </div>
            </div>

            {editingClientDetails && client ? (
              <div
                className="space-y-3 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-1">
                  <label className="text-neutral-400">Name</label>
                  <input
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-md px-2 py-1.5 text-xs text-neutral-100"
                    value={editClientName}
                    onChange={(e) => setEditClientName(e.target.value)}
                    placeholder="Client name"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-400">Email</label>
                  <input
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-md px-2 py-1.5 text-xs text-neutral-100"
                    value={editClientEmail}
                    onChange={(e) => setEditClientEmail(e.target.value)}
                    placeholder="name@example.com"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-400">Phone</label>
                  <input
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-md px-2 py-1.5 text-xs text-neutral-100"
                    value={editClientPhone}
                    onChange={(e) => setEditClientPhone(e.target.value)}
                    placeholder="04xx xxx xxx"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    className="px-3 py-1 text-[11px] rounded border border-neutral-700 text-neutral-300 hover:bg-neutral-900"
                    onClick={() => {
                      setEditingClientDetails(false);
                      if (client) {
                        setEditClientName(client.name || "");
                        setEditClientEmail(
                          (client.email as string) || ""
                        );
                        setEditClientPhone(
                          (client.phone as string) || ""
                        );
                      }
                    }}
                    disabled={clientDetailsSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 text-[11px] rounded bg-neutral-100 text-neutral-900 hover:bg-white disabled:opacity-60"
                    onClick={saveClientDetails}
                    disabled={clientDetailsSaving}
                  >
                    {clientDetailsSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-lg font-semibold">
                  {client?.name || "Unknown client"}
                </div>
                <div className="text-sm text-neutral-400 space-y-0.5">
                  {client?.email && <div>{client.email}</div>}
                  {client?.phone && <div>{client.phone}</div>}
                  {!client?.email && !client?.phone && (
                    <div className="text-xs text-neutral-500 mt-1">
                      No contact details saved.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notes + Photos/Docs */}
          <div className="md:col-span-2 p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 text-sm text-neutral-200 space-y-6">
            <JobNotesSection jobId={Number(job.id)} />
            <JobAttachmentsSection jobId={Number(job.id)} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
