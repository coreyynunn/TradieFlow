"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: any) {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg("Both fields are required.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg("Unexpected error. Try again.");
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: "2rem", color: "white" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" }}>
        Log in
      </h1>

      <form onSubmit={handleLogin} style={{ maxWidth: "300px", display: "grid", gap: "1rem" }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: "0.5rem", borderRadius: "0.3rem" }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: "0.5rem", borderRadius: "0.3rem" }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.6rem",
            borderRadius: "0.3rem",
            background: "#22c55e",
            border: "none",
            cursor: "pointer",
          }}
        >
          {loading ? "Logging in..." : "Log in"}
        </button>

        {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      </form>
    </main>
  );
}
