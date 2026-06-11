"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Activity, FileCode2, GitPullRequestArrow, ListChecks, ShieldCheck, Workflow } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ProjectNav } from "@/components/project/project-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { StatusBadge } from "@/components/ui/badge";
import { generateArchitecture, generateCode, generatePRD, generateTasks, getAgentRuns, getBuildReports, getGeneratedFiles, getProject } from "@/lib/api";

export default function ProjectOverviewPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const project = useQuery({ queryKey: ["project", id], queryFn: () => getProject(id) });
  const files = useQuery({ queryKey: ["files", id], queryFn: () => getGeneratedFiles(id), retry: false });
  const runs = useQuery({ queryKey: ["agent-runs", id], queryFn: () => getAgentRuns(id), retry: false });
  const builds = useQuery({ queryKey: ["builds", id], queryFn: () => getBuildReports(id), retry: false });

  const makeMutation = (fn: (projectId: string) => Promise<unknown>, key: string) =>
    useMutation({
      mutationFn: () => fn(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [key, id] });
        queryClient.invalidateQueries({ queryKey: ["project", id] });
        queryClient.invalidateQueries({ queryKey: ["agent-runs", id] });
      }
    });

  const prd = makeMutation(generatePRD, "prd");
  const architecture = makeMutation(generateArchitecture, "architecture");
  const tasks = makeMutation(generateTasks, "tasks");
  const code = makeMutation(generateCode, "files");

  const latestBuild = builds.data?.[0];
  const dossier = [
    { label: "Product intent", value: project.data?.complexity ?? "standard", detail: "Complexity and stack captured from intake" },
    { label: "Agent memory", value: "RAG ready", detail: "Requirements, docs, files, logs, and findings indexed" },
    { label: "Release control", value: "Human gated", detail: "GitHub and execution actions require approval" }
  ];

  return (
    <>
      <ProjectNav projectId={id} active="Overview" />
      <PageHeader
        title={project.data?.name ?? "Project overview"}
        description={project.data?.idea}
        actions={<StatusBadge status={project.data?.status ?? "loading"} />}
      />

      <ProgressSteps
        steps={[
          { label: "PRD", status: project.data?.status?.includes("prd") || project.data?.status !== "created" ? "done" : "active" },
          { label: "Architecture", status: project.data?.status?.includes("architecture") || ["tasks_generated", "code_generated", "build_simulated"].includes(project.data?.status ?? "") ? "done" : "todo" },
          { label: "Tasks", status: ["tasks_generated", "code_generated", "build_simulated"].includes(project.data?.status ?? "") ? "done" : "todo" },
          { label: "Code + Build", status: ["code_generated", "build_simulated"].includes(project.data?.status ?? "") ? "done" : "todo" }
        ]}
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Agent runs", value: runs.data?.length ?? 0, icon: Activity },
          { label: "Generated files", value: files.data?.length ?? 0, icon: FileCode2 },
          { label: "Tasks", value: "16", icon: ListChecks },
          { label: "GitHub status", value: "Gated", icon: GitPullRequestArrow }
        ].map((metric, index) => (
          <motion.div key={metric.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <MetricCard {...metric} />
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Generation Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="secondary" onClick={() => prd.mutate()} disabled={prd.isPending}>Generate PRD</Button>
              <Button variant="secondary" onClick={() => architecture.mutate()} disabled={architecture.isPending}>Generate architecture</Button>
              <Button variant="secondary" onClick={() => tasks.mutate()} disabled={tasks.isPending}>Generate tasks</Button>
              <Button onClick={() => code.mutate()} disabled={code.isPending}>Generate code</Button>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {dossier.map((item) => (
                <div key={item.label} className="rounded-md border bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold">{item.value}</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest Build</CardTitle>
          </CardHeader>
          <CardContent>
            {latestBuild ? (
              <div className="space-y-3">
                <StatusBadge status={latestBuild.status} />
                <p className="text-sm text-muted-foreground">{latestBuild.summary}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No build report yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Operating Narrative</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              BuildOS treats this project as a full product dossier: the idea becomes requirements, requirements become architecture, architecture becomes tasks, and tasks become generated implementation files.
            </p>
            <p>
              Every agent run is saved for review, and GitHub writes require a connected provider token plus a human approval record.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Governance Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: Workflow, text: "Agent workflow is traceable from intake through reviewer." },
              { icon: ShieldCheck, text: "Prompt injection and unsafe tool patterns are screened." },
              { icon: GitPullRequestArrow, text: "Repository and PR actions require explicit approval." }
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-3 rounded-md border bg-background p-3 text-sm">
                <item.icon className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
                <span className="leading-6 text-muted-foreground">{item.text}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
