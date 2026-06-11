import Link from "next/link";
import { ArrowRight, BookOpenText, CheckCircle2, Code2, GitPullRequestArrow, ShieldCheck, Workflow } from "lucide-react";

const sections = [
  {
    title: "Create the project",
    text: "Capture name, idea, target users, preferred stack, required features, deployment preference, AI features, and complexity."
  },
  {
    title: "Generate the product dossier",
    text: "BuildOS writes a PRD with personas, stories, MVP scope, out-of-scope items, success metrics, risks, and assumptions."
  },
  {
    title: "Plan the architecture",
    text: "The architecture page covers frontend, backend, database schema, API routes, AI workflow, DevOps, security, and deployment."
  },
  {
    title: "Produce the implementation bundle",
    text: "Agents generate starter frontend files, backend routes, schemas, models, Docker files, CI workflow, tests, README, and env samples."
  },
  {
    title: "Approve external action",
    text: "GitHub PR creation is previewed with repo, branch, commit, files, risk level, and approval status before any write."
  },
  {
    title: "Review release readiness",
    text: "Build reports show pipeline stages, logs, security warnings, test summary, generated file count, and readiness score."
  }
];

const architectureBullets = [
  "Next.js App Router dashboard and public site",
  "FastAPI backend with Pydantic validation and JWT auth",
  "PostgreSQL with pgvector-ready project memory",
  "Agent run and step tracing in the database",
  "Approval-gated GitHub provider workflow",
  "Docker Compose and GitHub Actions pipeline"
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf6] text-[#171923]">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-[#171923] text-white">
            <Code2 className="h-5 w-5" aria-hidden />
          </span>
          BuildOS
        </Link>
        <Link href="/projects/new" className="inline-flex h-10 items-center gap-2 rounded-md border border-[#cdbf9e] bg-white px-4 text-sm">
          Start Building
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </nav>

      <section className="paper-grid border-y border-[#d8ccb3] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7c5f2a]">Product documentation</p>
          <h1 className="serif-display mt-5 max-w-4xl text-5xl font-semibold leading-tight md:text-6xl">A complete walkthrough of the autonomous software factory.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
            Use this guide to operate BuildOS as a full-stack AI platform: from prompt intake to generated artifacts, approval gates, CI/CD readiness, and security posture.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-16 lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="h-fit rounded-lg border border-[#d8ccb3] bg-white p-6">
          <BookOpenText className="h-6 w-6 text-[#1b4d89]" aria-hidden />
          <h2 className="mt-5 text-xl font-semibold">Production checklist</h2>
          <div className="mt-5 space-y-3">
            {architectureBullets.map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                {item}
              </div>
            ))}
          </div>
        </aside>
        <div className="grid gap-4">
          {sections.map((section, index) => (
            <div key={section.title} className="grid gap-4 rounded-lg border border-[#d8ccb3] bg-white p-5 md:grid-cols-[76px_1fr]">
              <div className="grid h-14 w-14 place-items-center rounded-md border border-[#e2d8c2] bg-[#f5efe2] text-sm font-semibold text-[#7c5f2a]">
                0{index + 1}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{section.title}</h2>
                <p className="mt-2 leading-7 text-slate-600">{section.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#171923] px-6 py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          {[
            { icon: Workflow, title: "Workflow", text: "Trace idea, PRD, architecture, task, code, approval, PR, and build stages." },
            { icon: GitPullRequestArrow, title: "GitHub", text: "Simulate PR creation only after human approval, with files and risk previewed." },
            { icon: ShieldCheck, title: "Security", text: "Prompt injection checks and tool allowlists are part of the primary path." }
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-white/10 bg-white/[0.045] p-6">
              <item.icon className="h-6 w-6 text-[#f4dfad]" aria-hidden />
              <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
