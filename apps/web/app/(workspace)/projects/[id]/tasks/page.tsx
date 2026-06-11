"use client";

import { RefreshCw } from "lucide-react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/dashboard/page-header";
import { ProjectNav } from "@/components/project/project-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/badge";
import { generateTasks, getTasks } from "@/lib/api";

export default function TasksPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const tasks = useQuery({ queryKey: ["tasks", id], queryFn: () => getTasks(id), retry: false });
  const generate = useMutation({ mutationFn: () => generateTasks(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", id] }) });
  const categories = [...new Set(tasks.data?.map((task) => task.category) ?? [])];

  return (
    <>
      <ProjectNav projectId={id} active="Tasks" />
      <PageHeader
        title="Task breakdown"
        description="Engineering work grouped by frontend, backend, database, AI, DevOps, testing, security, and docs."
        actions={
          <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Regenerate
          </Button>
        }
      />

      {tasks.data?.length ? (
        <div className="grid gap-4 xl:grid-cols-4">
          {categories.map((category) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tasks.data.filter((task) => task.category === category).map((task) => (
                  <div key={task.id} className="rounded-md border bg-background p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{task.title}</p>
                      <StatusBadge status={task.priority} />
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">{task.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No tasks yet" description="Generate an engineering backlog from the architecture." action={<Button onClick={() => generate.mutate()}>Generate tasks</Button>} />
      )}
    </>
  );
}

