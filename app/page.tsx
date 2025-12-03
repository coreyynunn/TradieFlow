"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col">
      {/* Top nav */}
      <header className="border-b border-neutral-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/40">
              <span className="text-sm font-bold text-emerald-400">TF</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">
              TradieFlow
            </span>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-neutral-300 md:flex">
            <span className="cursor-default">Quotes</span>
            <span className="cursor-default">Jobs</span>
            <span className="cursor-default">Invoices</span>
            <span className="cursor-default">Clients</span>
          </nav>

          <div className="flex items-center gap-3">
            {/* Correct login route */}
            <Link
              href="/auth/login"
              className="text-sm text-neutral-300 hover:text-white"
            >
              Log in
            </Link>

            {/* Correct signup route */}
            <Link
              href="/auth/signup"
              className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-400"
            >
              Join Now
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="border-b border-neutral-800">
          <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-14 md:flex-row md:items-center md:py-20">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/5 px-3 py-1 text-xs font-medium text-emerald-300">
                Built for tradies · Quotes, jobs, invoices in one place
              </div>

              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                Run your whole{" "}
                <span className="text-emerald-400">tradie business</span> from
                one simple dashboard.
              </h1>

              <p className="max-w-xl text-sm text-neutral-300 sm:text-base">
                TradieFlow keeps all your quotes, jobs, invoices and client
                details organised so you can spend less time on paperwork and
                more time on the tools – or at home with the family.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                {/* Use signup for CTA */}
                <Link
                  href="/auth/signup"
                  className="rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400"
                >
                  Start using TradieFlow
                </Link>

                <Link
                  href="#features"
                  className="text-sm text-neutral-300 hover:text-white"
                >
                  See how it works →
                </Link>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-neutral-400">
                <div>• No lock-in · cancel anytime</div>
                <div>• Built for small trade businesses</div>
                <div>• Mobile-friendly for onsite use</div>
              </div>
            </div>

            {/* Right side preview card */}
            <div className="flex-1">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 shadow-2xl">
                <div className="mb-3 flex items-center justify-between text-xs text-neutral-400">
                  <span>Today&apos;s overview</span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
                    TradieFlow
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
                    <div className="text-neutral-400">Money received</div>
                    <div className="mt-1 text-lg font-semibold text-emerald-400">
                      $7,420
                    </div>
                    <div className="mt-1 text-[11px] text-neutral-500">
                      From 12 invoices this month
                    </div>
                  </div>

                  <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
                    <div className="text-neutral-400">Money owing</div>
                    <div className="mt-1 text-lg font-semibold text-amber-400">
                      $3,180
                    </div>
                    <div className="mt-1 text-[11px] text-neutral-500">
                      4 invoices overdue
                    </div>
                  </div>

                  <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
                    <div className="text-neutral-400">Quotes out</div>
                    <div className="mt-1 text-lg font-semibold text-sky-400">
                      9 open
                    </div>
                    <div className="mt-1 text-[11px] text-neutral-500">
                      Convert to jobs in one tap
                    </div>
                  </div>

                  <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
                    <div className="text-neutral-400">Active jobs</div>
                    <div className="mt-1 text-lg font-semibold text-purple-400">
                      6 jobs
                    </div>
                    <div className="mt-1 text-[11px] text-neutral-500">
                      Track status: quoted → active → complete
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-950/80 p-3 text-xs text-neutral-300">
                  &quot;Since switching to TradieFlow I know exactly what&apos;s
                  booked, what&apos;s owed and what&apos;s coming in. No more
                  chasing paperwork or guessing where jobs are at.&quot;
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="border-b border-neutral-800 bg-neutral-950"
        >
          <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
            <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
              Everything a tradie needs to stay on top of the business.
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-neutral-300">
              Quotes, jobs, invoices and client details all talking to each
              other in one simple system. No more spreadsheets and notes in your
              phone.
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
                <div className="text-sm font-medium text-neutral-100">
                  Fast quoting
                </div>
                <p className="mt-2 text-xs text-neutral-300">
                  Build professional quotes in minutes, send by email or text,
                  and convert them straight into jobs when the client says yes.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
                <div className="text-sm font-medium text-neutral-100">
                  Jobs under control
                </div>
                <p className="mt-2 text-xs text-neutral-300">
                  Track every job from quoted → pending → active → completed.
                  Keep notes, photos and attachments against each job.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
                <div className="text-sm font-medium text-neutral-100">
                  Invoices that get paid
                </div>
                <p className="mt-2 text-xs text-neutral-300">
                  Create invoices from completed jobs in a couple of clicks.
                  See what&apos;s paid, what&apos;s owing and what&apos;s
                  overdue at a glance.
                </p>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-neutral-300">
                Ready to actually feel on top of your work?
              </div>
              <div className="flex gap-3">
                <Link
                  href="/auth/signup"
                  className="rounded-md bg-emerald-500 px-5 py-2 text-sm font-semibold text-black hover:bg-emerald-400"
                >
                  Join Now
                </Link>

                <Link
                  href="/auth/login"
                  className="rounded-md border border-neutral-700 px-5 py-2 text-sm text-neutral-200 hover:border-neutral-500"
                >
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 text-xs text-neutral-500">
          <span>© {new Date().getFullYear()} TradieFlow. All rights reserved.</span>
          <span>Built for Aussie tradies who want to level up.</span>
        </div>
      </footer>
    </div>
  );
}
