"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabaseClient";

type Job = {
  id: number | string;
  client_id: string | null;
  quote_id: number | null;
  status: string | null;
  title: string | null;
  address: string | null;
  start_date: string | null;
  due_date: string | null;
};

type Client = {
  id: string;
  name: string;
};

export default function EditJobPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jobIdParam = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [clients, setClients] = useState<Client[]>([]);

  const [clientId, setClientId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("pending");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!jobIdParam) return;
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
        setClientId(j.client_id ? String(j.client_id) : "");
        setTitle(j.title || "");
        setAddress(j.address || "");
        setStatus((j.status as string) || "pending");

        if (j.start_date) {
          const d = new Date(j.start_date);
          const iso = d.toISOString().slice(0, 10); // yyyy-mm-dd
          setStartDate(iso);
        }

        if (j.due_date) {
          const d = new Date(j.due_date);
          const iso = d.toISOString().slice(0, 10);
          setDueDate(iso);
        }

        // clients
        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select("id, name")
          .order("name", { ascending: true });

        if (clientsError) {
          console.error("Clients load error", clientsError);
        } else {
          setClients((clientsData || []) as Client[]);
        }

        setLoading(false);
      } catch (e: any) {
        console.error("Edit job load error", e);
        setError("Failed to load job.");
        setJob(null);
        setLoading(false);
      }
    };

    load();
  }, [jobIdParam, router]);

  async function handleSave() {
    if (!job) return;

    if (!title.trim()) {
      setError("Job title is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updateData: any = {
        title: title.trim(),
        address: address.trim() || null,
        status,
        client_id: clientId || null,
      };

      if (startDate) {
        updateData.start_date = new Date(startDate).toISOString();
      } else {
        updateData.start_date = null;
      }

      if (dueDate) {
        updateData.due_date = new Date(dueDate).toISOString();
      } else {
        updateData.due_date = null;
      }

      const { error } = await supabase
        .from("jobs")
        .update(updateData)
        .eq("id", job.id);

      if (error) {
        console.error("Job update error", error);
        setError("Failed to save job.");
        setSaving(false);
        return;
      }

      router.push(`/jobs/${job.id}`);
    } catch (e: any) {
      console.error("Job update error", e);
      setError("Failed to save job.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center text-neutral-400">
          Loading job…
        </div>
      </DashboardLayout>
    );
  }

  if (error && !job) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center text-neutral-50">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl space-y-3 max-w-sm">
            <div className="text-lg font-semibold">Error</div>
            <div className="text-red-400">{error}</div>
            <button
              onClick={() => router.push("/jobs")}
              className="mt-2 px-3 py-1.5 text-xs rounded bg-neutral-100 text-neutral-900 hover:bg-white transition"
            >
              Back to jobs
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        <button
          onClick={() =>
            router.push(job ? `/jobs/${job.id}` : "/jobs")
          }
          className="text-xs mb-2 text-neutral-400 hover:text-neutral-200 transition"
        >
          ← Back to job
        </button>

        <h1 className="text-2xl font-semibold text-neutral-50">
          Edit job
        </h1>

        {error && (
          <div className="bg-red-950/40 border border-red-500/40 text-red-200 text-xs px-3 py-2 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4 text-sm">
          {/* Client */}
          <div className="space-y-1">
            <label className="text-xs text-neutral-400">Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm w-full text-neutral-50"
            >
              <option value="">Select client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs text-neutral-400">Job title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-50"
              placeholder="e.g. Retaining wall at 13 Bright St"
            />
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="text-xs text-neutral-400">Site address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-50"
              placeholder="Street, suburb"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-neutral-400">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-neutral-400">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-50"
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-xs text-neutral-400">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm w-full text-neutral-50"
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() =>
              router.push(job ? `/jobs/${job.id}` : "/jobs")
            }
            className="h-9 px-4 rounded-md border border-neutral-700 text-xs text-neutral-300 hover:bg-neutral-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-4 rounded-md bg-neutral-100 text-neutral-900 text-xs font-medium hover:bg-white border border-neutral-300 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
