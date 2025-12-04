// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabaseClient";

type UserInfo = {
  email: string | null;
  plan: string | null;
};

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    email: null,
    plan: null,
  });

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      router.push("/login");
      return;
    }

    const user = data.user;

    // Try to read plan from user metadata if you’re storing it there.
    // Fallback to "Starter".
    const metadataPlan =
      (user.user_metadata && user.user_metadata.plan) ||
      (user.app_metadata && (user.app_metadata as any).plan) ||
      null;

    setUserInfo({
      email: user.email,
      plan: metadataPlan || "Starter",
    });

    setLoading(false);
  }

  function handleUpgrade() {
    // For now just send them to a billing/checkout page.
    // When Stripe is wired, point this to your actual checkout route.
    router.push("/billing/upgrade");
  }

  function handleDowngrade() {
    // Same as above – wire this to your downgrade / portal route later.
    router.push("/billing/downgrade");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleSendPasswordReset() {
    if (!userInfo.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(userInfo.email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (error) {
      alert("Failed to send reset email");
      return;
    }
    alert("Password reset email sent.");
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-white">Loading settings...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 text-white max-w-4xl space-y-6">
        <h1 className="text-2xl font-semibold mb-2">Settings</h1>
        <p className="text-sm text-neutral-400 mb-4">
          Manage your account, subscription and company details.
        </p>

        {/* Account Settings */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium">Account</h2>
              <p className="text-xs text-neutral-400">
                Basic details for your TradieFlow login.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Email</span>
              <span className="text-neutral-100">{userInfo.email}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handleSendPasswordReset}
              className="px-3 py-2 text-sm rounded-lg bg-neutral-800 border border-neutral-700 hover:bg-neutral-700"
            >
              Send password reset email
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-500"
            >
              Log out
            </button>
          </div>
        </section>

        {/* Plan & Billing */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium">Plan & Billing</h2>
              <p className="text-xs text-neutral-400">
                Upgrade or downgrade your TradieFlow subscription.
              </p>
            </div>
            <span className="px-3 py-1 text-xs rounded-full bg-neutral-800 border border-neutral-700">
              Current plan: <span className="font-semibold">{userInfo.plan}</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-3 mt-2">
            <button
              onClick={handleUpgrade}
              className="px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-500"
            >
              Upgrade to Pro
            </button>
            <button
              onClick={handleDowngrade}
              className="px-4 py-2 text-sm rounded-lg bg-neutral-800 border border-neutral-700 hover:bg-neutral-700"
            >
              Downgrade to Starter
            </button>
          </div>

          <p className="text-[11px] text-neutral-500 mt-1">
            You’ll manage the actual payment and invoicing through the billing
            portal (Stripe) once it’s wired up.
          </p>
        </section>

        {/* Company Profile shortcut */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium">Company Profile</h2>
              <p className="text-xs text-neutral-400">
                Business name, logo, ABN, address and contact details.
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push("/settings/company")}
            className="mt-3 px-4 py-2 text-sm rounded-lg bg-neutral-800 border border-neutral-700 hover:bg-neutral-700"
          >
            Open Company Profile
          </button>
        </section>

        {/* Future: Team / Notifications / etc. */}
        <section className="bg-neutral-900 border border-dashed border-neutral-800 rounded-xl p-5 space-y-2">
          <h2 className="text-lg font-medium">More settings (coming soon)</h2>
          <p className="text-xs text-neutral-500">
            Team members, notifications and integrations will live here as we
            roll them out.
          </p>
        </section>
      </div>
    </DashboardLayout>
  );
}
