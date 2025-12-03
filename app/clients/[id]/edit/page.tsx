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

export default function EditClientPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const clientIdParam = params?.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

        const { data, error } = await supabase
          .from("clients")
          .select("id, name, email, phone")
          .eq("id", clientIdParam)
          .maybeSingle();

        if (error || !data) {
          console.error("Client load error", error);
          setError("Client not found.");
          setClient(null);
          setLoading(false);
          return;
        }

        const c = data as Client;
        setClient(c);
        setName(c.name || "");
        setEmail((c.email as string) || "");
        setPhone((c.phone as string) || "");

        setLoading(false);
      } catch (e: any) {
        console.error("Client edit load error", e);
        setError("Failed to load client.");
        setClient(null);
        setLoading(false);
      }
    };

    load();
  }, [clientIdParam, router]);

  async function handleSave() {
    if (!client) return;

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("clients")
        .update({
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
        })
        .eq("id", client.id);

      if (error) {
        console.error("Client update error", error);
        setError("Failed to save client.");
        setSaving(false);
        return;
      }

      router.push(`/clients/${client.id}`);
    } catch (e: any) {
      console.error("Client update error", e);
      setError("Failed to save client.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center text-neutral-400">
          Loading client…
        </div>
      </DashboardLayout>
    );
  }

  if (error && !client) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center text-neutral-50">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl space-y-3 max-w-sm">
            <div className="text-lg font-semibold">Error</div>
            <div className="text-red-400">{error}</div>
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

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        <button
          onClick={() =>
            router.push(client ? `/clients/${client.id}` : "/clients")
          }
          className="text-xs mb-2 text-neutral-400 hover:text-neutral-200 transition"
        >
          ← Back to client
        </button>

        <h1 className="text-2xl font-semibold text-neutral-50">
          Edit client
        </h1>

        {error && (
          <div className="bg-red-950/40 border border-red-500/40 text-red-200 text-xs px-3 py-2 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4 text-sm">
          <div className="space-y-1">
            <label className="text-xs text-neutral-400">Name</label>
            <input
              className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-50"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Client name"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-neutral-400">Email</label>
            <input
              className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-neutral-400">Phone</label>
            <input
              className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-50"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="04xx xxx xxx"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() =>
              router.push(client ? `/clients/${client.id}` : "/clients")
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
