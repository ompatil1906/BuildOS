"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Activity, Boxes, CheckCircle2, Clock3, FileCode2, GitPullRequestArrow, ShieldAlert, TestTube2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/dashboard/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ReadinessChart } from "@/components/dashboard/readiness-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { getProjects } from "@/lib/api";

export default function DashboardPage() {
  const projects = useQuery({ queryKey: ["projects"], queryFn: getProjects, retry: false });
  const totalProjects = projects.data?.length ?? 0;
  const latest = projects.data?.[0];
  const queue = [
    { label: "PRD dossier", status: "completed", detail: "Personas, scope, stories, risks" },
    { label: "Architecture plan", status: "completed", detail: "API, database, AI workflow, DevOps" },
    { label: "Generated code", status: "completed", detail: "11 starter files in the project vault" },
    { label: "GitHub action", status: "gated", detail: "Approval required before PR simulation" }
  ];
  const risks = [
    "Generated tests are placeholders until a real sandbox runner is enabled.",
    "Provider-backed AI calls require server-side API keys.",
    "GitHub write actions remain blocked without approval records."
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="A command center for generated products, agent runs, approvals, and build readiness."
        actions={
          <Link href="/projects/new">
            <Button>New project</Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total projects", value: totalProjects, icon: Boxes, note: "Seed demo included" },
          { label: "Agent runs", value: latest ? "11+" : 0, icon: Activity, note: "Traceable by project" },
          { label: "Generated files", value: latest ? "11" : 0, icon: FileCode2, note: "Starter app bundle" },
          { label: "Build reports", value: latest ? "1" : 0, icon: TestTube2, note: "Simulated pipeline" },
          { label: "Security warnings", value: latest ? "2" : 0, icon: ShieldAlert, note: "Review before PR" }
        ].map((metric, index) => (
          <motion.div key={metric.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
            <MetricCard {...metric} />
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Deployment Readiness</CardTitle>
          </CardHeader>
          <CardContent>
            <ReadinessChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Executive Brief</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.isError ? (
              <p className="text-sm text-muted-foreground">Login with the demo account to load projects.</p>
            ) : latest ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{latest.name}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{latest.idea}</p>
                  </div>
                  <StatusBadge status={latest.status} />
                </div>
                <div className="grid gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />
                    PRD, architecture, tasks, code, and build report are seeded for demo.
                  </div>
                  <div className="flex items-center gap-2">
                    <GitPullRequestArrow className="h-4 w-4 text-amber-500" aria-hidden />
                    GitHub PR creation remains approval-gated.
                  </div>
                </div>
                <Link href={`/projects/${latest.id}`}>
                  <Button variant="secondary">Open project</Button>
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No projects yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Factory Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {queue.map((item) => (
              <div key={item.label} className="flex items-start justify-between gap-4 rounded-md border bg-background p-3">
                <div className="flex gap-3">
                  <Clock3 className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Register</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {risks.map((risk) => (
              <div key={risk} className="rounded-md border border-amber-500/25 bg-amber-500/10 p-3 text-sm leading-6 text-amber-800 dark:text-amber-200">
                {risk}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
