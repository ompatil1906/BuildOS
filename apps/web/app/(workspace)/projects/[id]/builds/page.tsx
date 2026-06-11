"use client";

import { Play } from "lucide-react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/dashboard/page-header";
import { ProjectNav } from "@/components/project/project-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Terminal } from "@/components/ui/terminal";
import { getBuildReports, simulateBuild } from "@/lib/api";

export default function BuildsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const builds = useQuery({ queryKey: ["builds", id], queryFn: () => getBuildReports(id), retry: false });
  const simulate = useMutation({ mutationFn: () => simulateBuild(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["builds", id] }) });
  const latest = builds.data?.[0];

  return (
    <>
      <ProjectNav projectId={id} active="Builds" />
      <PageHeader
        title="Build reports"
        description="Pipeline stages, logs, test summary, security warnings, and deployment readiness score."
        actions={<Button onClick={() => simulate.mutate()} disabled={simulate.isPending}><Play className="h-4 w-4" aria-hidden />Simulate build</Button>}
      />
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Stages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(latest?.test_results_json.stages ?? []).map((stage) => (
              <div key={stage.name} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                <span>{stage.name}</span>
                <StatusBadge status={stage.status} />
              </div>
            ))}
            <div className="rounded-md border p-3">
              <p className="text-sm text-muted-foreground">Readiness score</p>
              <p className="mt-1 text-3xl font-semibold">{latest?.test_results_json.readiness_score ?? 0}</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">A score above 75 means the generated app is ready for human review, not production execution.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <Terminal logs={latest?.logs} />
          </CardContent>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {["Dependencies installed", "Generated tests reviewed", "Docker files created"].map((item) => (
          <Card key={item}>
            <CardContent>
              <p className="text-sm font-medium">{item}</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Tracked as part of the simulated release-readiness report.</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
