"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type DashboardLayoutProps = {
  children: ReactNode;
};

// CHANGE THIS TO YOUR REAL ADMIN EMAIL
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

  const baseNavItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Clients", href: "/clients" },
    { label: "Quotes", href: "/quotes" },
    { label: "Jobs", href: "/jobs" },
    { label: "Invoices", href: "/invoices" },
  ];

  const navItems = isAdmin
    ? [
        ...baseNavItems,
        { label: "Subscribers", href: "/admin", admin: true as const },
      ]
    : baseNavItems;

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#050816] text-neutral-50 flex flex-col md:flex-row">
      {/* Sidebar (desktop) */}
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

        {/* Desktop nav */}
        <nav className="flex-1 space-y-1 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center justify-between rounded-md px-3 py-2 transition-colors",
                isActive(item.href)
                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40"
                  : "text-neutral-300 hover:bg-neutral-900 hover:text-white",
              ].join(" ")}
            >
              <span>{item.label}</span>
              {item.href === "/admin" && (
                <span className="rounded-full bg-emerald-500/10 px-2 py-[2px] text-[10px] text-emerald-300 border border-emerald-500/40">
                  Admin
                </span>
              )}
            </Link>
          ))}

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
      <div className="flex-1 min-h-screen bg-[#050816] flex flex-col">
        {/* Mobile top nav */}
        <nav className="md:hidden sticky top-0 z-40 border-b border-neutral-800 bg-[#020617]/95 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/40">
                <span className="text-xs font-bold text-emerald-400">TF</span>
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">
                  TradieFlow
                </div>
                <div className="text-[10px] text-neutral-500">
                  Jobs · Quotes · Invoices
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={[
                      "px-2 py-1 rounded-md text-[10px] font-medium",
                      active
                        ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40"
                        : "text-neutral-400 hover:text-neutral-100",
                    ].join(" ")}
                  >
                    {item.label === "Subscribers" ? "Subs" : item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        <main className="flex-1">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
