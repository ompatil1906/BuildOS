"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/dashboard/page-header";
import { ProjectNav } from "@/components/project/project-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { getBuildReports } from "@/lib/api";

export default function SecurityPage() {
  const { id } = useParams<{ id: string }>();
  const builds = useQuery({ queryKey: ["builds", id], queryFn: () => getBuildReports(id), retry: false });
  const findings = builds.data?.[0]?.security_findings_json ?? [];

  return (
    <>
      <ProjectNav projectId={id} active="Security" />
      <PageHeader title="Security reports" description="Prompt-injection posture, approval gates, tool policy, and generated-code review warnings." />
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Findings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {findings.map((finding, index) => (
              <div key={`${finding.message}-${index}`} className="rounded-md border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{finding.message}</p>
                  <StatusBadge status={finding.severity} />
                </div>
                {finding.path ? <p className="mt-2 text-sm text-muted-foreground">{finding.path}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Prompt injection checks flag attempts to bypass instructions, expose secrets, run shell commands, or commit directly to main.</p>
            <p>Allowed tools: generate text, generate files, save to database, retrieve context, simulate build, create GitHub branch/PR after approval.</p>
            <p>Denied tools: arbitrary shell execution, direct production deploy, force push, repository deletion, reading server secrets.</p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {[
          ["Approval gates", "GitHub, deployment, API key updates, and code execution require human approval."],
          ["Secret posture", "The frontend only receives public configuration and never stores provider secrets."],
          ["Execution boundary", "Generated code is previewed and reviewed, not executed by the production API."]
        ].map(([title, text]) => (
          <Card key={title}>
            <CardContent>
              <p className="font-medium">{title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
