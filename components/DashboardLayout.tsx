"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        backgroundColor: "#020617", // slate-950
        color: "#e5e7eb", // slate-200
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: "230px",
          borderRight: "1px solid #1f2937",
          padding: "1.25rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          backgroundColor: "#020617",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "0.75rem",
              background: "#22c55e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              color: "#020617",
              fontSize: "0.8rem",
            }}
          >
            TF
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>TradieFlow</div>
            <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>
              Run your jobs, not your admin
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
  <SidebarLink label="Dashboard" href="/dashboard" />
  <SidebarLink label="Clients" href="/clients" />
  <SidebarLink label="Jobs" href="/jobs" />           {/* 🔹 single Jobs tab */}
  <SidebarLink label="Invoices" href="/invoices" />
  <SidebarLink label="Settings" href="/settings" disabled />
</nav>



        {/* Bottom / Logout */}
        <div style={{ marginTop: "auto" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              fontSize: "0.8rem",
              padding: "0.45rem 0.6rem",
              borderRadius: "0.4rem",
              border: "1px solid #374151",
              background: "transparent",
              color: "#e5e7eb",
              cursor: "pointer",
            }}
          >
            Log out
          </button>
          <p
            style={{
              marginTop: "0.4rem",
              fontSize: "0.7rem",
              color: "#6b7280",
            }}
          >
            v0.1 · internal dev build
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          padding: "1.5rem 2rem",
        }}
      >
        {children}
      </main>
    </div>
  );
}

function SidebarLink({
  label,
  href,
  disabled,
}: {
  label: string;
  href: string;
  disabled?: boolean;
}) {
  const router = useRouter();

  function handleClick() {
    if (disabled) return;
    router.push(href);
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      style={{
        textAlign: "left",
        width: "100%",
        padding: "0.45rem 0.65rem",
        borderRadius: "0.4rem",
        border: "none",
        backgroundColor: disabled ? "transparent" : "#020617",
        color: disabled ? "#4b5563" : "#e5e7eb",
        fontSize: "0.8rem",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {label}
      {disabled && (
        <span style={{ fontSize: "0.65rem", marginLeft: "0.25rem", color: "#4b5563" }}>
          (soon)
        </span>
      )}
    </button>
  );
}
