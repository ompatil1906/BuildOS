"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/dashboard/page-header";
import { ProjectNav } from "@/components/project/project-nav";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/badge";
import { getAgentRuns } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function AgentRunsPage() {
  const { id } = useParams<{ id: string }>();
  const runs = useQuery({ queryKey: ["agent-runs", id], queryFn: () => getAgentRuns(id), retry: false });

  return (
    <>
      <ProjectNav projectId={id} active="Agent runs" />
      <PageHeader title="Agent runs" description="Trace every BuildOS agent and tool step attached to this project." />
      {runs.data?.length ? (
        <div className="space-y-3">
          {runs.data.map((run) => (
            <Card key={run.id}>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <h2 className="font-semibold">{run.agent_name}</h2>
                    <StatusBadge status={run.status} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{formatDate(run.started_at)}</p>
                  <pre className="mt-3 max-h-36 overflow-auto rounded-md border bg-background p-3 text-xs">{JSON.stringify(run.output_json, null, 2)}</pre>
                </div>
                <p className="text-xs text-muted-foreground">{run.completed_at ? "Completed" : "Running"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No agent runs yet" description="Generate a PRD, architecture, tasks, or code to create traceable agent activity." />
      )}
    </>
  );
}

