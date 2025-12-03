"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type PlanTier = "starter" | "pro";

export default function SignupPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanTier>("pro");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const planAmount = plan === "starter" ? 49.99 : 99.99;

    // 1) Create Supabase auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error || !data.user) {
      setErrorMsg(error?.message || "Could not create account.");
      setLoading(false);
      return;
    }

    const user = data.user;

    // 2) Insert subscription row
    const { error: subError } = await supabase.from("subscriptions").insert({
      user_id: user.id,
      email: user.email,
      status: "active",
      plan_amount: planAmount,
      plan_tier: plan,
      started_at: new Date().toISOString(),
    });

    if (subError) {
      console.error(subError);
      // not fatal for user, but log it
    }

    setLoading(false);

    // 3) Send them to dashboard (or login if you want email confirm first)
    router.replace("/dashboard");
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-xl">
        <div className="mb-5">
          <div className="text-xs font-semibold uppercase text-emerald-300">
            Get started
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            Create your TradieFlow account
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Free 14-day trial on any plan. No lock-in. Cancel anytime.
          </p>
        </div>

        {/* Plan selection */}
        <div className="mb-5">
          <div className="text-[11px] font-medium text-neutral-300 mb-2">
            Choose your plan
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <button
              type="button"
              onClick={() => setPlan("starter")}
              className={[
                "rounded-xl border px-3 py-3 text-left transition-colors",
                plan === "starter"
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-neutral-700 bg-neutral-900/60 hover:border-neutral-500",
              ].join(" ")}
            >
              <div className="text-[11px] font-semibold uppercase text-blue-300">
                Starter
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-semibold">$49.99</span>
                <span className="text-[10px] text-neutral-400">/ month</span>
              </div>
              <div className="mt-1 text-[11px] text-neutral-300">
                1 boss + 4 users, core features.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPlan("pro")}
              className={[
                "rounded-xl border px-3 py-3 text-left transition-colors",
                plan === "pro"
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-neutral-700 bg-neutral-900/60 hover:border-neutral-500",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase text-emerald-300">
                  Pro
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2 py-[1px] text-[9px] text-emerald-100 border border-emerald-400/70">
                  Most popular
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-semibold">$99.99</span>
                <span className="text-[10px] text-neutral-400">/ month</span>
              </div>
              <div className="mt-1 text-[11px] text-neutral-300">
                Unlimited users, full features.
              </div>
            </button>
          </div>
          <div className="mt-2 text-[11px] text-neutral-400">
            All plans start with a free 14-day trial. You won&apos;t be charged
            until after the trial ends.
          </div>
        </div>

        {/* Signup form */}
        <form onSubmit={handleSignup} className="space-y-3">
          <div>
            <label className="block text-[11px] text-neutral-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-50 outline-none focus:border-emerald-500"
              placeholder="Your name"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] text-neutral-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-50 outline-none focus:border-emerald-500"
              placeholder="you@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] text-neutral-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-50 outline-none focus:border-emerald-500"
              placeholder="••••••••"
              required
            />
          </div>

          {errorMsg && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account & start trial"}
          </button>
        </form>

        <div className="mt-4 text-[11px] text-neutral-500 text-center">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/auth/login")}
            className="text-emerald-300 hover:underline"
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  );
}
