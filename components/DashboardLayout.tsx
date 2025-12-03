"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type DashboardLayoutProps = {
  children: ReactNode;
};

// TODO: change this to YOUR real admin login email
const ADMIN_EMAIL = "coreyynunn02@outlook.com";

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loadingUser, setLoadingUser] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      setIsAdmin(user.email === ADMIN_EMAIL);
      setLoadingUser(false);
    };

    loadUser();
  }, [router]);

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050816] text-neutral-100">
        <div className="text-sm text-neutral-400">Loading your account…</div>
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Clients", href: "/clients" },
    { label: "Jobs", href: "/jobs" },
    { label: "Invoices", href: "/invoices" },
  ];

  return (
    <div className="min-h-screen bg-[#050816] text-neutral-50 flex">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r border-neutral-900 bg-[#020617] px-5 py-5 md:flex md:flex-col">
        {/* Brand */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/40">
            <span className="text-base font-bold text-emerald-400">TF</span>
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">
              TradieFlow
            </div>
            <div className="text-[11px] text-neutral-500">
              Run your jobs, not your admin
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 text-sm">
          {navItems.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center justify-between rounded-md px-3 py-2 transition-colors",
                  active
                    ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40"
                    : "text-neutral-300 hover:bg-neutral-900 hover:text-white",
                ].join(" ")}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Admin-only Subscribers tab */}
          {isAdmin && (
            <Link
              href="/admin"
              className={[
                "mt-3 flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                pathname === "/admin"
                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40"
                  : "text-neutral-300 hover:bg-neutral-900 hover:text-white",
              ].join(" ")}
            >
              <span>Subscribers</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-[2px] text-[10px] text-emerald-300 border border-emerald-500/40">
                Admin
              </span>
            </Link>
          )}

          {/* Settings (soon) */}
          <div className="mt-4 rounded-md px-3 py-2 text-sm text-neutral-600 cursor-not-allowed">
            Settings <span className="text-[11px]">(soon)</span>
          </div>
        </nav>

        {/* Bottom area */}
        <div className="mt-6 border-t border-neutral-900 pt-4">
          <button
            className="w-full rounded-md border border-neutral-700 bg-transparent px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace("/");
            }}
          >
            Log out
          </button>

          <div className="mt-3 text-[11px] text-neutral-500">
            v0.1 · internal dev build
            <div className="mt-1">
              Logged in as{" "}
              <span className="text-neutral-300">
                {isAdmin ? "Admin" : "User"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen bg-[#050816]">
        <div className="mx-auto max-w-6xl px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
