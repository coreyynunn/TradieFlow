"use client";

import { useState, FormEvent } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    setError(null);

    if (!name.trim()) {
      setError("Client name is required.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.from("clients").insert([
        {
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
        },
      ]);
      setLoading(false);

      if (error) {
        console.error(error);
        setError(error.message);
        return;
      }

      setStatus("Client saved to Supabase ✅");
      setName("");
      setPhone("");
      setEmail("");
    } catch (err: any) {
      console.error(err);
      setLoading(false);
      setError("Unexpected error. Check console / Supabase setup.");
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "2rem",
        backgroundColor: "#020617",
        color: "#e5e7eb",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>
          TradieFlow – Add Client (Test)
        </h1>
        <p style={{ fontSize: "0.9rem", marginBottom: "1.5rem", color: "#d1d5db" }}>
          This page is just for testing Supabase. Submit the form and it should create a new row
          in the <code>clients</code> table.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.25rem" }}>
              Client name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem 0.65rem",
                borderRadius: "0.4rem",
                border: "1px solid #374151",
                background: "#020617",
                color: "#e5e7eb",
                fontSize: "0.85rem",
              }}
              placeholder="e.g. John Smith"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.25rem" }}>
              Phone
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem 0.65rem",
                borderRadius: "0.4rem",
                border: "1px solid #374151",
                background: "#020617",
                color: "#e5e7eb",
                fontSize: "0.85rem",
              }}
              placeholder="e.g. 0412 345 678"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.25rem" }}>
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem 0.65rem",
                borderRadius: "0.4rem",
                border: "1px solid #374151",
                background: "#020617",
                color: "#e5e7eb",
                fontSize: "0.85rem",
              }}
              placeholder="e.g. client@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "0.75rem",
              width: "100%",
              backgroundColor: loading ? "#15803d" : "#22c55e",
              border: "none",
              padding: "0.7rem",
              borderRadius: "0.5rem",
              fontWeight: 600,
              fontSize: "0.9rem",
              color: "#020617",
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.85 : 1,
            }}
          >
            {loading ? "Saving..." : "Save client"}
          </button>
        </form>

        {status && (
          <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "#6ee7b7" }}>{status}</p>
        )}
        {error && (
          <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "#f97373" }}>{error}</p>
        )}
      </div>
    </main>
  );
}
