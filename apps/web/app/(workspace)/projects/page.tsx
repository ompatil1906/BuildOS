"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/badge";
import { getProjects } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function ProjectsPage() {
  const projects = useQuery({ queryKey: ["projects"], queryFn: getProjects, retry: false });

  return (
    <>
      <PageHeader
        title="Projects"
        description="Every idea becomes a structured BuildOS workspace with artifacts, files, approvals, and reports."
        actions={
          <Link href="/projects/new">
            <Button>New project</Button>
          </Link>
        }
      />

      {projects.isLoading ? <p className="text-sm text-muted-foreground">Loading projects...</p> : null}
      {projects.isError ? <EmptyState title="Authentication required" description="Login or create an account to manage production workspaces." /> : null}
      {projects.data?.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create a project idea and let BuildOS generate the PRD, architecture, tasks, code, and build report."
          action={
            <Link href="/projects/new">
              <Button>Create project</Button>
            </Link>
          }
        />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.data?.map((project, index) => (
          <motion.div key={project.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
          <Link href={`/projects/${project.id}`}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-soft">
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Product workspace</p>
                    <h2 className="mt-2 text-xl font-semibold">{project.name}</h2>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{project.idea}</p>
                  </div>
                  <StatusBadge status={project.status} />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
                  {["PRD", "Code", "Build"].map((item) => (
                    <div key={item} className="rounded-md border bg-background px-2 py-2">{item}</div>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{project.preferred_stack}</span>
                  <span>{formatDate(project.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
          </motion.div>
        ))}
      </div>
    </>
  );
}
