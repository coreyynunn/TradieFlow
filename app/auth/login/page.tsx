"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message || "Failed to log in");
      return;
    }

    // On success go to dashboard – no loops, no effects
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100">
      <div className="w-full max-w-sm rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
        <h1 className="text-xl font-semibold mb-4 text-center">Log in</h1>

        <form onSubmit={handleLogin} className="space-y-3">
          <input
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {errorMsg && (
            <p className="text-xs text-red-400 mt-1">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full rounded-md bg-emerald-500 py-2 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-neutral-400">
  Don&apos;t have an account?{" "}
  <button
    type="button"
    onClick={() => router.push("/auth/signup")}
    className="text-emerald-400 hover:underline"
  >
    Sign up
  </button>
</p>

<div className="mt-2 text-[11px] text-neutral-500 text-center">
  <button
    type="button"
    onClick={() => router.push("/")}
    className="text-neutral-300 hover:underline"
  >
    ← Back to home
  </button>
</div>
      </div>
    </div>
  );
}
