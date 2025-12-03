// @ts-nocheck
"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabaseClient";

type Client = {
  id: string;
  name: string;
};

export default function NewJobPage() {
  const router = useRouter();
  

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

        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select("id, name")
          .order("name", { ascending: true });

        if (clientsError) {
          console.error("Clients load error", clientsError);
          throw clientsError;
        }

        const list = (clientsData || []) as Client[];
        setClients(list);

        if (clientFromQuery) {
          setClientId(clientFromQuery);
        }

        setLoading(false);
      } catch (e: any) {
        console.error("New job load error", e);
        setError("Failed to load clients.");
        setLoading(false);
      }
    };

    load();
  }, [router, clientFromQuery]);

  async function handleSave() {
    if (!title.trim()) {
      setError("Job title is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const insertData: any = {
        user_id: user.id,
        client_id: clientId || null,
        quote_id: null,
        status,
        title: title.trim(),
        address: address.trim() || null,
      };

      if (startDate) {
        insertData.start_date = new Date(startDate).toISOString();
      }
      if (dueDate) {
        insertData.due_date = new Date(dueDate).toISOString();
      }

      const { data, error } = await supabase
        .from("jobs")
        .insert(insertData)
        .select("id")
        .single();

      if (error) {
        console.error("New job save error", error);
        setError("Failed to create job.");
        setSaving(false);
        return;
      }

      router.push(`/jobs/${data.id}`);
    } catch (e: any) {
      console.error("New job save error", e);
      setError("Failed to create job.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center text-neutral-400">
          Loading…
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        <button
          onClick={() => router.push("/jobs")}
          className="text-xs mb-2 text-neutral-400 hover:text-neutral-200 transition"
        >
          ← Back to jobs board
        </button>

        <h1 className="text-2xl font-semibold text-neutral-50">New Job</h1>

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
            <label className="text-xs text-neutral-400">Initial status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm w-full text-neutral-50"
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => router.push("/jobs")}
            className="h-9 px-4 rounded-md border border-neutral-700 text-xs text-neutral-300 hover:bg-neutral-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-4 rounded-md bg-neutral-100 text-neutral-900 text-xs font-medium hover:bg-white border border-neutral-300 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Create Job"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
