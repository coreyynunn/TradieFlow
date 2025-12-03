"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();

  const [selectedPlan, setSelectedPlan] = useState<"starter" | "pro" | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedPlan) {
      setErrorMsg("Please select a plan first.");
      return;
    }

    if (!name || !email || !password) {
      setErrorMsg("All fields are required.");
      return;
    }

    setLoading(true);

    // 1) Create Supabase auth user
    const { data: signupData, error: signupError } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

    if (signupError) {
      setErrorMsg(signupError.message);
      setLoading(false);
      return;
    }

    const user = signupData.user;
    if (!user) {
      setErrorMsg("No user returned from signup.");
      setLoading(false);
      return;
    }

    // 2) Insert subscription record
    const planAmount = selectedPlan === "starter" ? 49.99 : 99.99;

    const { error: subError } = await supabase.from("subscriptions").insert({
      user_id: user.id,
      email: user.email,
      plan_tier: selectedPlan,
      plan_amount: planAmount,
      status: "active",
      started_at: new Date().toISOString(),
    });

    if (subError) {
      setErrorMsg("Failed to create subscription: " + subError.message);
      setLoading(false);
      return;
    }

    // 3) Go to dashboard
    router.replace("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#050816] flex items-center justify-center px-4 text-neutral-50">
      <div className="w-full max-w-2xl rounded-[26px] border border-neutral-800 bg-neutral-950/90 px-6 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.75)]">
        {/* Header */}
        <div className="mb-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
            Get started
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">
            Create your TradieFlow account
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-neutral-400">
            Free 14-day trial on any plan. No lock-in. Cancel anytime.
          </p>
        </div>

        {/* Plan selection */}
        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <div className="text-[11px] font-medium text-neutral-300 mb-2">
              Choose your plan
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Starter */}
              <button
                type="button"
                onClick={() => setSelectedPlan("starter")}
                className={[
                  "rounded-xl border px-4 py-3 text-left text-xs sm:text-sm transition-colors",
                  selectedPlan === "starter"
                    ? "border-blue-500 bg-blue-500/10 text-blue-100"
                    : "border-neutral-700 bg-neutral-950 text-neutral-200 hover:border-neutral-500",
                ].join(" ")}
              >
                <div className="text-[11px] font-semibold uppercase text-blue-300">
                  Starter
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl font-semibold">$49.99</span>
                  <span className="text-[11px] text-neutral-400">
                    / month
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-neutral-300">
                  1 boss + 4 users, core features.
                </div>
              </button>

              {/* Pro */}
              <button
                type="button"
                onClick={() => setSelectedPlan("pro")}
                className={[
                  "rounded-xl border px-4 py-3 text-left text-xs sm:text-sm transition-colors",
                  selectedPlan === "pro"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-100"
                    : "border-neutral-700 bg-neutral-950 text-neutral-200 hover:border-neutral-500",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold uppercase text-emerald-300">
                    Pro
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-[1px] text-[10px] text-emerald-100 border border-emerald-400/70">
                    Most popular
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl font-semibold">$99.99</span>
                  <span className="text-[11px] text-neutral-400">
                    / month
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-neutral-300">
                  Unlimited users, full features.
                </div>
              </button>
            </div>
            <p className="mt-2 text-[11px] text-neutral-500">
              All plans start with a free 14-day trial. You won&apos;t be
              charged until after the trial ends.
            </p>
          </div>

          {/* Inputs */}
          <div className="grid gap-3">
            <div>
              <label className="mb-1 block text-[11px] text-neutral-300">
                Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                className="w-full rounded-lg bg-neutral-950 px-3 py-2 text-sm border border-neutral-700 focus:border-emerald-400 outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-neutral-300">
                Email
              </label>
              <input
                type="email"
                placeholder="you@company.com"
                className="w-full rounded-lg bg-neutral-950 px-3 py-2 text-sm border border-neutral-700 focus:border-emerald-400 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-neutral-300">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-lg bg-neutral-950 px-3 py-2 text-sm border border-neutral-700 focus:border-emerald-400 outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex w-full items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account & start trial"}
          </button>
        </form>

        {/* Footer links */}
        <p className="mt-4 text-center text-[11px] text-neutral-500">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/auth/login")}
            className="text-emerald-300 hover:underline"
          >
            Log in
          </button>
        </p>

        <div className="mt-1 text-[11px] text-neutral-500 text-center">
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
