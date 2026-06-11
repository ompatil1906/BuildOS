"use client";

import { RefreshCw } from "lucide-react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/dashboard/page-header";
import { ProjectNav } from "@/components/project/project-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MarkdownPreview } from "@/components/ui/markdown";
import { generateArchitecture, getArchitecture } from "@/lib/api";

export default function ArchitecturePage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const architecture = useQuery({ queryKey: ["architecture", id], queryFn: () => getArchitecture(id), retry: false });
  const generate = useMutation({ mutationFn: () => generateArchitecture(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["architecture", id] }) });

  const apiRoutes = Object.keys(architecture.data?.backend_plan ?? {}).length ? ["Auth routes", "Project routes", "Generation routes", "Approval routes", "GitHub routes", "Build routes"] : [];
  const dbTables = Array.isArray(architecture.data?.database_plan?.tables) ? (architecture.data.database_plan.tables as string[]) : [];

  return (
    <>
      <ProjectNav projectId={id} active="Architecture" />
      <PageHeader
        title="Architecture"
        description="Technical plan covering frontend, backend, database, AI workflow, DevOps, security, and deployment."
        actions={
          <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Regenerate
          </Button>
        }
      />

      {architecture.data ? (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardContent>
              <MarkdownPreview content={architecture.data.content_markdown} />
            </CardContent>
          </Card>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API routes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {apiRoutes.map((route) => <div key={route} className="rounded-md border px-3 py-2 text-sm">{route}</div>)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Database schema</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {dbTables.map((table) => <div key={table} className="rounded-md border px-3 py-2 text-sm">{table}</div>)}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <EmptyState title="No architecture yet" description="Generate the system plan from the PRD and project context." action={<Button onClick={() => generate.mutate()}>Generate architecture</Button>} />
      )}
    </>
  );
}

