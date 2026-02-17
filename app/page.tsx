import Link from "next/link";
import { Navbar } from "../components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-brown-500">
              Collaborative B2B Brainstorming
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-brown-900 sm:text-5xl md:text-6xl">
              Turn team ideas into{" "}
              <span className="text-brown-600">outcomes</span>
            </h1>
            <p className="mt-6 text-lg text-brown-600 sm:text-xl">
              Ideata is the shared workspace where teams capture, refine, and act on ideas—in real time, with clarity.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/signup"
                className="rounded-lg bg-brown-800 px-6 py-3.5 text-base font-medium text-brown-50 hover:bg-brown-900 transition-colors"
              >
                Start brainstorming free
              </Link>
              <Link
                href="#how-it-works"
                className="rounded-lg border border-brown-300 bg-brown-50 px-6 py-3.5 text-base font-medium text-brown-800 hover:bg-brown-100 transition-colors"
              >
                See how it works
              </Link>
            </div>
          </div>
        </section>

        {/* Value / How it works */}
        <section id="how-it-works" className="border-t border-brown-200 bg-brown-100/50 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-2xl font-semibold text-brown-900 sm:text-3xl">
              Simple, focused collaboration
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-brown-600">
              Create spaces, add ideas, vote, and turn the best ones into next steps—all in one place.
            </p>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Capture",
                  description: "Add ideas as cards. Tag, comment, and attach context so nothing gets lost.",
                  step: "01",
                },
                {
                  title: "Align",
                  description: "Vote and prioritize as a team. See what matters most without endless meetings.",
                  step: "02",
                },
                {
                  title: "Execute",
                  description: "Convert top ideas into tasks and track progress so ideas become results.",
                  step: "03",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-xl border border-brown-200 bg-brown-50 p-6 shadow-sm"
                >
                  <span className="text-sm font-medium text-brown-500">{item.step}</span>
                  <h3 className="mt-2 text-lg font-semibold text-brown-900">{item.title}</h3>
                  <p className="mt-2 text-brown-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features strip */}
        <section id="features" className="border-t border-brown-200 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-2xl font-semibold text-brown-900 sm:text-3xl">
              Built for B2B teams
            </h2>
            <ul className="mx-auto mt-12 flex max-w-3xl flex-wrap justify-center gap-x-12 gap-y-4 text-brown-600 sm:gap-x-16">
              <li>Real-time collaboration</li>
              <li>Workspaces & permissions</li>
              <li>Integrations (Slack, Notion)</li>
              <li>Export & reporting</li>
              <li>SSO & security</li>
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-brown-200 bg-brown-800 py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-2xl font-semibold text-brown-50 sm:text-3xl">
              Ready to brainstorm better?
            </h2>
            <p className="mt-4 text-brown-200">
              Join teams that use Ideata to turn ideas into action.
            </p>
            <div className="mt-8">
              <Link
                href="/signup"
                className="inline-flex rounded-lg bg-brown-50 px-6 py-3.5 text-base font-medium text-brown-900 hover:bg-brown-100 transition-colors"
              >
                Get started — it’s free
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-brown-200 bg-brown-100/50 py-10">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-brown-600">© Ideata. Collaborative B2B brainstorming.</span>
          <div className="flex gap-6 text-sm text-brown-600">
            <Link href="/privacy" className="hover:text-brown-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-brown-900 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
