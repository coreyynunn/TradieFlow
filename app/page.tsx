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
            {/* Only login in top-right */}
            <Link
              href="/auth/login"
              className="text-sm text-neutral-300 hover:text-white"
            >
              Log in
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
                {/* Main CTA with two-line text inside button (style B) */}
                <Link
                  href="/auth/signup"
                  className="rounded-md bg-emerald-500 px-5 py-3 text-sm font-semibold text-black hover:bg-emerald-400 inline-flex flex-col items-center justify-center"
                >
                  <span className="text-sm font-semibold">
                    Start using TradieFlow
                  </span>
                  <span className="mt-0.5 text-[11px] font-normal text-emerald-950/90">
                    Free 14-day trial → then $99.99/m
                  </span>
                </Link>

                <Link
                  href="#features"
                  className="text-sm text-neutral-300 hover:text-white"
                >
                  See how it works →
                </Link>
              </div>

              {/* Big stats strip under hero copy */}
              <div className="mt-4 grid grid-cols-3 gap-4 max-w-xl text-xs">
                <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-3">
                  <div className="text-[11px] text-neutral-400">
                    Time saved on admin
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-emerald-400">
                    10+ hrs
                  </div>
                  <div className="mt-1 text-[11px] text-neutral-500">
                    Per week back on the tools
                  </div>
                </div>
                <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-3">
                  <div className="text-[11px] text-neutral-400">
                    Jobs tracked at once
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-sky-400">
                    40+
                  </div>
                  <div className="mt-1 text-[11px] text-neutral-500">
                    Without losing where you&apos;re at
                  </div>
                </div>
                <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-3">
                  <div className="text-[11px] text-neutral-400">
                    Paperwork reduced
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-amber-400">
                    70%
                  </div>
                  <div className="mt-1 text-[11px] text-neutral-500">
                    Quotes → jobs → invoices in clicks
                  </div>
                </div>
              </div>
            </div>

            {/* Right side preview card – bigger numbers + extra row */}
            <div className="flex-1">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 shadow-2xl">
                <div className="mb-3 flex items-center justify-between text-xs text-neutral-400">
                  <span>Today&apos;s overview</span>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-0.5 text-[11px] font-semibold text-emerald-300">
                    TradieFlow
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
                    <div className="text-neutral-400">Money received</div>
                    <div className="mt-1 text-3xl font-semibold leading-tight text-emerald-400">
                      $27,420
                    </div>
                    <div className="mt-1 text-[11px] text-neutral-500">
                      From 34 invoices this month
                    </div>
                  </div>

                  <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
                    <div className="text-neutral-400">Money owing</div>
                    <div className="mt-1 text-3xl font-semibold leading-tight text-amber-400">
                      $13,180
                    </div>
                    <div className="mt-1 text-[11px] text-neutral-500">
                      9 invoices overdue
                    </div>
                  </div>

                  <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
                    <div className="text-neutral-400">Quotes out</div>
                    <div className="mt-1 text-2xl font-semibold text-sky-400">
                      23 open
                    </div>
                    <div className="mt-1 text-[11px] text-neutral-500">
                      Convert to jobs in one tap
                    </div>
                  </div>

                  <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
                    <div className="text-neutral-400">Active jobs</div>
                    <div className="mt-1 text-2xl font-semibold text-purple-400">
                      14 jobs
                    </div>
                    <div className="mt-1 text-[11px] text-neutral-500">
                      Track status: quoted → active → complete
                    </div>
                  </div>

                  <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-neutral-400 text-[11px]">
                          Average days to get paid
                        </div>
                        <div className="mt-1 text-2xl font-semibold text-emerald-300">
                          3.2 days
                        </div>
                      </div>
                      <div>
                        <div className="text-neutral-400 text-[11px]">
                          Repeat clients this month
                        </div>
                        <div className="mt-1 text-2xl font-semibold text-sky-300 text-right">
                          18
                        </div>
                      </div>
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

            <div className="mt-8 grid gap-5 md:grid-cols-4">
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

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
                <div className="text-sm font-medium text-neutral-100">
                  All client details in one place
                </div>
                <p className="mt-2 text-xs text-neutral-300">
                  Every quote, job and invoice is tied back to the client so you
                  can see their full history instantly.
                </p>
              </div>
            </div>

            {/* Extra reassurance row */}
            <div className="mt-10 grid gap-4 md:grid-cols-3 text-xs text-neutral-300">
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
                <div className="font-medium text-neutral-100 mb-1">
                  Built for the way tradies actually work
                </div>
                <p className="text-neutral-300">
                  Designed around how small trade businesses quote, schedule and
                  get paid – not generic office software.
                </p>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
                <div className="font-medium text-neutral-100 mb-1">
                  Mobile-friendly for onsite
                </div>
                <p className="text-neutral-300">
                  Create or update quotes and jobs while you&apos;re standing in
                  the driveway, not late at night at the kitchen table.
                </p>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
                <div className="font-medium text-neutral-100 mb-1">
                  Simple enough to actually use
                </div>
                <p className="text-neutral-300">
                  No bloated menus. Just the tools you need: quotes, jobs,
                  invoices, clients and clear money stats.
                </p>
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
