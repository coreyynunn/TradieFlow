"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/DashboardLayout";

type Client = {
  id: number | string;
  name: string;
  phone?: string | null;
  email?: string | null;
};

export default function ClientsPage() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("clients")
        .select("id, name, phone, email")
        .eq("user_id", user.id) // 🔥 only this user's clients
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Load clients error", error);
        setError("Failed to load clients.");
        setLoading(false);
        return;
      }

      setClients((data || []) as Client[]);
      setLoading(false);
    };

    load();
  }, [router]);

  async function handleSaveClient() {
    if (!name.trim()) {
      setError("Client name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    const { data, error } = await supabase
      .from("clients")
      .insert({
        user_id: user.id, // 🔥 owner of this client
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
      })
      .select("id, name, phone, email")
      .single();

    setSaving(false);

    if (error) {
      console.error("Insert client error", error);
      setError("Failed to save client.");
      return;
    }

    if (data) {
      setClients((prev) => [data as Client, ...prev]);
      setName("");
      setPhone("");
      setEmail("");
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center text-neutral-400">
          Loading clients…
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-neutral-50">Clients</h1>
          <p className="text-xs text-neutral-500">
            Add new clients and view your saved ones below.
          </p>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-500/40 text-red-200 text-xs px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Create client */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-neutral-400">Client name *</label>
            <input
              className="w-full bg-neutral-950 border border-neutral-700 rounded-md px-3 py-2 text-sm text-neutral-100"
              placeholder="e.g. John Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-neutral-400">Phone</label>
            <input
              className="w-full bg-neutral-950 border border-neutral-700 rounded-md px-3 py-2 text-sm text-neutral-100"
              placeholder="e.g. 0412 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-neutral-400">Email</label>
            <input
              className="w-full bg-neutral-950 border border-neutral-700 rounded-md px-3 py-2 text-sm text-neutral-100"
              placeholder="e.g. client@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            onClick={handleSaveClient}
            disabled={saving}
            className="mt-2 h-9 px-4 rounded-md bg-emerald-500 text-neutral-950 text-sm font-medium hover:bg-emerald-400 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save client"}
          </button>
        </div>

        {/* Saved clients */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-50">Saved Clients</h2>

          {clients.length === 0 ? (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 px-4 py-4 text-sm text-neutral-500">
              No clients yet. Add your first client above.
            </div>
          ) : (
            <div className="space-y-2">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-900/40 px-4 py-3 hover:bg-neutral-900/60 transition"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-neutral-50">
                      {client.name}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {client.phone || "No phone"} ·{" "}
                      {client.email || "No email"}
                    </span>
                  </div>

                  <button
                    onClick={() => router.push(`/clients/${client.id}`)}
                    className="text-xs px-3 py-1.5 rounded-md bg-neutral-700 hover:bg-neutral-600 text-neutral-100"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
