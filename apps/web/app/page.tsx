"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import gsap from "gsap";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Code2,
  Database,
  FileCode2,
  GitPullRequestArrow,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Workflow
} from "lucide-react";

const workflow = ["Idea", "PRD", "Architecture", "Tasks", "Code", "Approval", "Pull request", "Build report"];

const platformStats = [
  { label: "Artifacts generated", value: "8", note: "PRD, architecture, tasks, files, reports" },
  { label: "Agent trace coverage", value: "100%", note: "Runs and steps stored in the database" },
  { label: "Readiness score", value: "82", note: "Simulated CI/CD and security review" }
];

const factoryPillars = [
  {
    icon: Workflow,
    title: "Product operating system",
    text: "A single workspace for requirements, architecture, task planning, generated code, approvals, and release readiness."
  },
  {
    icon: FileCode2,
    title: "Full-stack generation",
    text: "Next.js pages, FastAPI routes, schemas, models, Docker files, CI workflows, tests, and handoff documentation."
  },
  {
    icon: ShieldCheck,
    title: "Human-governed automation",
    text: "Every GitHub, deployment, API-key, and generated-code execution action is previewed and approval-gated."
  }
];

const capabilityRows = [
  ["PRD generation", "Personas, user stories, MVP scope, risks, assumptions, success metrics"],
  ["Architecture planning", "Frontend, backend, database, AI workflow, DevOps, security, deployment"],
  ["Agent orchestration", "Intake, PRD, architecture, planner, code, database, DevOps, test, security, reviewer"],
  ["Project memory", "RAG over requirements, docs, generated files, build logs, and security findings"],
  ["GitHub workflow", "Repository preview, branch plan, commit summary, PR simulation, audit trail"],
  ["Build readiness", "Install, lint, tests, frontend build, backend build, Docker, security scan"]
];

const useCases = [
  "Founding engineer product reviews",
  "AI engineer agent orchestration projects",
  "Platform and DevOps interview walkthroughs",
  "Internal innovation prototyping",
  "Technical product discovery",
  "Secure code-generation governance"
];

export default function LandingPage() {
  const pipelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pipelineRef.current) return;
    const items = pipelineRef.current.querySelectorAll("[data-pipeline-step]");
    const timeline = gsap.timeline({ repeat: -1, repeatDelay: 0.8 });
    timeline.to(items, {
      backgroundColor: "rgba(20, 184, 166, 0.16)",
      borderColor: "rgba(94, 234, 212, 0.42)",
      color: "#ffffff",
      stagger: 0.18,
      duration: 0.36,
      ease: "power2.out"
    });
    timeline.to(items, {
      backgroundColor: "rgba(255, 255, 255, 0.035)",
      borderColor: "rgba(255, 255, 255, 0.10)",
      color: "#cbd5e1",
      stagger: 0.12,
      duration: 0.3,
      ease: "power2.in"
    });
    return () => {
      timeline.kill();
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#111318] text-white">
      <section className="premium-grid border-b border-white/10">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[#f5efe2] text-[#111318]">
              <Code2 className="h-5 w-5" aria-hidden />
            </span>
            <span>BuildOS</span>
          </Link>
          <div className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
            <a href="#workflow">Workflow</a>
            <a href="#platform">Platform</a>
            <a href="#security">Security</a>
            <Link href="/pricing">Pricing</Link>
            <Link href="/docs">Docs</Link>
          </div>
          <Link href="/login" className="hidden h-10 items-center rounded-md border border-white/15 px-4 text-sm text-slate-200 md:inline-flex">
            Login
          </Link>
        </nav>

        <div className="mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl gap-12 px-6 pb-16 pt-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="mb-5 inline-flex rounded-full border border-[#d8c7a1]/30 bg-[#d8c7a1]/10 px-3 py-1 text-sm text-[#f4dfad]">
              Idea to app, automatically.
            </p>
            <h1 className="serif-display max-w-5xl text-5xl font-semibold leading-[0.96] tracking-normal text-[#f7efe3] md:text-7xl">
              Build full-stack apps from ideas using AI agents.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              BuildOS is an AI-native engineering control plane that turns a product prompt into requirements, architecture, tasks, generated code, GitHub pull requests, CI/CD plans, build reports, and security-reviewed next steps.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/projects/new" className="inline-flex h-11 items-center gap-2 rounded-md bg-[#f5efe2] px-5 text-sm font-semibold text-[#111318]">
                Start Building
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/docs" className="inline-flex h-11 items-center rounded-md border border-white/15 px-5 text-sm text-slate-200">
                View product docs
              </Link>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {platformStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + index * 0.08, duration: 0.5 }}
                  className="rounded-lg border border-white/10 bg-white/[0.045] p-4"
                >
                  <p className="text-3xl font-semibold text-[#f7efe3]">{stat.value}</p>
                  <p className="mt-2 text-sm font-medium">{stat.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{stat.note}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.65 }}
            className="glass-panel rounded-lg p-3"
          >
            <div className="rounded-md border border-white/10 bg-[#0b0f17]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#d66a5d]" />
                  <span className="h-3 w-3 rounded-full bg-[#d6a742]" />
                  <span className="h-3 w-3 rounded-full bg-[#3fb280]" />
                </div>
                <span className="text-xs text-slate-400">Production workspace factory run</span>
              </div>
              <div className="grid gap-3 p-4 lg:grid-cols-[0.92fr_1.08fr]">
                <div ref={pipelineRef} className="space-y-3">
                  {workflow.map((item, index) => (
                    <div key={item} data-pipeline-step className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.035] px-3 py-2 text-slate-300">
                      <span className="flex items-center gap-3 text-sm">
                        <CheckCircle2 className={index < 6 ? "h-4 w-4 text-emerald-300" : "h-4 w-4 text-slate-500"} aria-hidden />
                        {item}
                      </span>
                      <span className="text-xs text-slate-500">0{index + 1}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="rounded-md border border-[#f4dfad]/20 bg-[#f4dfad]/10 p-4">
                    <Bot className="h-5 w-5 text-[#f4dfad]" aria-hidden />
                    <p className="mt-3 text-sm leading-6 text-slate-200">
                      Reviewer Agent: code generated, readiness score 82, GitHub write waiting for human approval.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Database, label: "pgvector RAG" },
                      { icon: LockKeyhole, label: "Approval gate" },
                      { icon: TerminalSquare, label: "Build logs" },
                      { icon: GitPullRequestArrow, label: "PR preview" }
                    ].map((item) => (
                      <div key={item.label} className="rounded-md border border-white/10 bg-white/[0.035] p-3">
                        <item.icon className="h-4 w-4 text-teal-200" aria-hidden />
                        <p className="mt-3 text-xs text-slate-300">{item.label}</p>
                      </div>
                    ))}
                  </div>
                  <pre className="overflow-hidden rounded-md border border-white/10 bg-black/35 p-4 text-xs leading-6 text-slate-300">
{`agent.workflow.run()
  intake -> prd -> architecture
  planner -> code agents
  security -> reviewer
  approval -> github.pr.create`}
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="workflow" className="bg-[#f5efe2] px-6 py-24 text-[#171923]">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7c5f2a]">The operating model</p>
              <h2 className="serif-display mt-4 text-4xl font-semibold leading-tight md:text-5xl">Not a chatbot. A controlled software factory.</h2>
              <p className="mt-5 max-w-xl leading-8 text-slate-700">
                BuildOS gives every output a place to live: requirements are versioned, architecture is inspectable, tasks have acceptance criteria, generated files are browsable, and risky actions are logged before they happen.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {factoryPillars.map((pillar, index) => (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ delay: index * 0.08, duration: 0.45 }}
                  className="rounded-lg border border-[#cdbf9e] bg-white p-6 shadow-sm"
                >
                  <pillar.icon className="h-6 w-6 text-[#1b4d89]" aria-hidden />
                  <h3 className="mt-5 text-lg font-semibold">{pillar.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{pillar.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="border-y border-white/10 bg-[#111318] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-200">Platform capabilities</p>
              <h2 className="serif-display mt-4 text-4xl font-semibold text-[#f7efe3] md:text-5xl">Everything needed for a production-review AI engineering platform.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-400">
              Built to show product thinking, backend architecture, agent safety, DevOps maturity, and a polished full-stack experience.
            </p>
          </div>
          <div className="mt-10 overflow-hidden rounded-lg border border-white/10">
            {capabilityRows.map(([title, detail], index) => (
              <div key={title} className="grid gap-3 border-b border-white/10 bg-white/[0.035] px-5 py-4 last:border-b-0 md:grid-cols-[260px_1fr]">
                <div className="flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-xs text-[#f4dfad]">{index + 1}</span>
                  <p className="font-medium text-white">{title}</p>
                </div>
                <p className="text-sm leading-6 text-slate-300">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="security" className="paper-grid bg-[#fbfaf6] px-6 py-24 text-[#171923]">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_420px]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7c5f2a]">Governance built in</p>
            <h2 className="serif-display mt-4 text-4xl font-semibold leading-tight md:text-5xl">AI autonomy with a professional control surface.</h2>
            <p className="mt-5 max-w-2xl leading-8 text-slate-700">
              BuildOS treats generated code and external tools as high-leverage operations that need context, traceability, and approval. The MVP includes prompt-injection checks, a tool allowlist, encrypted provider-token storage, and audit logs from the beginning.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {useCases.map((useCase) => (
                <div key={useCase} className="flex items-center gap-3 rounded-md border border-[#d9cfb8] bg-white px-4 py-3 text-sm">
                  <Sparkles className="h-4 w-4 text-[#a0662c]" aria-hidden />
                  {useCase}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-[#d9cfb8] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Release dossier</p>
            <div className="mt-6 space-y-4">
              {[
                ["Prompt risk", "Low", "Injection phrases screened before agent work"],
                ["GitHub write", "Gated", "Approval record required before PR action"],
                ["Secrets", "Server-side", "No real keys committed or exposed to the UI"],
                ["Build mode", "Simulated", "Generated code is not executed in production API"]
              ].map(([label, value, note]) => (
                <div key={label} className="rounded-md border border-[#e2d8c2] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium">{label}</p>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-700">{value}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#111318] px-6 py-20 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-lg border border-white/10 bg-white/[0.045] p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f4dfad]">Example prompt</p>
            <h2 className="serif-display mt-3 text-3xl font-semibold md:text-4xl">Build an AI customer support ticket SaaS.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Login, dashboard, ticket management, AI priority detection, admin panel, analytics, GitHub Actions, and Docker deployment.
            </p>
          </div>
          <Link href="/projects/new" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-[#f5efe2] px-5 text-sm font-semibold text-[#111318]">
            Start Building
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#0c0e13] px-6 py-8 text-sm text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>BuildOS. A production-style autonomous software factory MVP.</p>
          <div className="flex gap-4">
            <Link href="/pricing" className="text-slate-300">Pricing</Link>
            <Link href="/docs" className="text-slate-300">Docs</Link>
            <Link href="/login" className="text-white">Login</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
