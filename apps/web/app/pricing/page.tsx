import Link from "next/link";
import { ArrowRight, CheckCircle2, Code2, ShieldCheck } from "lucide-react";

const tiers = [
  {
    name: "Demo",
    price: "$0",
    description: "For interview walkthroughs, local demos, and portfolio review.",
    features: ["Seed project", "Agent traces", "Generated files", "Build simulation", "Approval workflow"]
  },
  {
    name: "Studio",
    price: "TBD",
    description: "For teams that want provider-backed agents and real repository automation.",
    features: ["GitHub OAuth", "Provider keys", "Sandbox runner", "Team audit logs", "Usage cost reporting"]
  },
  {
    name: "Platform",
    price: "Custom",
    description: "For organizations that need governance, private deployment, and evaluation workflows.",
    features: ["Private runners", "Policy controls", "Observability", "Model evaluation", "Deployment gates"]
  }
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#f5efe2] text-[#171923]">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-[#171923] text-white">
            <Code2 className="h-5 w-5" aria-hidden />
          </span>
          BuildOS
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/docs" className="text-slate-600">Docs</Link>
          <Link href="/login" className="rounded-md border border-[#cdbf9e] bg-white px-4 py-2">Login</Link>
        </div>
      </nav>

      <section className="paper-grid border-y border-[#d8ccb3] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7c5f2a]">Pricing philosophy</p>
          <h1 className="serif-display mt-5 max-w-4xl text-5xl font-semibold leading-tight md:text-6xl">Start with a serious demo. Grow into governed automation.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
            The MVP is intentionally demo-first: it proves architecture, agent safety, DevOps readiness, and product depth without requiring paid AI or GitHub provider configuration.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-5 lg:grid-cols-3">
          {tiers.map((tier, index) => (
            <div key={tier.name} className="rounded-lg border border-[#d8ccb3] bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{tier.name}</p>
                  <p className="mt-4 text-4xl font-semibold">{tier.price}</p>
                </div>
                {index === 0 ? <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-700">Available</span> : null}
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{tier.description}</p>
              <div className="mt-6 space-y-3">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_420px]">
          <div className="rounded-lg border border-[#d8ccb3] bg-white p-6">
            <ShieldCheck className="h-6 w-6 text-[#1b4d89]" aria-hidden />
            <h2 className="mt-5 text-2xl font-semibold">No surprise external writes</h2>
            <p className="mt-3 leading-7 text-slate-600">
              BuildOS keeps demo mode safe by simulating GitHub and build activity until a human approval record exists. Real provider integrations are designed as an upgrade path, not a hidden default.
            </p>
          </div>
          <div className="rounded-lg border border-[#171923] bg-[#171923] p-6 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f4dfad]">Best first demo</p>
            <h2 className="serif-display mt-4 text-3xl font-semibold">SupportFlow AI</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">A customer support SaaS with PRD, architecture, generated files, GitHub PR simulation, build report, security findings, and audit logs.</p>
            <Link href="/projects/new" className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-[#f5efe2] px-4 text-sm font-semibold text-[#171923]">
              Start Building
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
