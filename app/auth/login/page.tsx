"use client";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-50">
      <div className="max-w-sm w-full p-6 rounded-xl border border-neutral-800 bg-neutral-900">
        <h1 className="text-xl font-semibold mb-2">TradieFlow login</h1>
        <p className="text-sm text-neutral-400">
          Login will be wired back up after deployment. For now this is a
          placeholder so the app can build cleanly on Vercel.
        </p>
      </div>
    </div>
  );
}
