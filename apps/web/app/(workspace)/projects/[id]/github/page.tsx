"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, GitPullRequestArrow, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { ProjectNav } from "@/components/project/project-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { approveAction, createGitHubPR, getApprovals, getGeneratedFiles, getGitHubStatus, requestApproval } from "@/lib/api";

export default function GitHubPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [approvalId, setApprovalId] = useState<string | null>(null);
  const status = useQuery({ queryKey: ["github", id], queryFn: () => getGitHubStatus(id), retry: false });
  const files = useQuery({ queryKey: ["files", id], queryFn: () => getGeneratedFiles(id), retry: false });
  const approvals = useQuery({ queryKey: ["approvals", id], queryFn: () => getApprovals(id), retry: false });

  const request = useMutation({
    mutationFn: () =>
      requestApproval(id, {
        action_type: "github.create_pr",
        action_summary: "Create demo GitHub pull request for generated BuildOS files.",
        risk_level: "medium",
        payload_json: {
          repo_name: "supportflow-ai",
          branch_name: "buildos/generated-mvp",
          files: files.data?.map((file) => file.path) ?? []
        }
      }),
    onSuccess: async (approval) => {
      setApprovalId(approval.id);
      await queryClient.invalidateQueries({ queryKey: ["approvals", id] });
    }
  });
  const approve = useMutation({
    mutationFn: (idToApprove: string) => approveAction(idToApprove),
    onSuccess: async (approval) => {
      setApprovalId(approval.id);
      await queryClient.invalidateQueries({ queryKey: ["approvals", id] });
    }
  });
  const pr = useMutation({
    mutationFn: () => createGitHubPR(id, approvalId ?? approvals.data?.find((item) => item.status === "approved" && item.action_type === "github.create_pr")?.id ?? ""),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["github", id] })
  });

  return (
    <>
      <ProjectNav projectId={id} active="GitHub" />
      <PageHeader title="GitHub integration" description="Demo mode simulates repository, branch, PR, and CI events. Real writes stay behind approval gates." />

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Action Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Repository</p>
                <p className="mt-1 font-medium">supportflow-ai</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Branch</p>
                <p className="mt-1 font-medium">buildos/generated-mvp</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Files</p>
                <p className="mt-1 font-medium">{files.data?.length ?? 0} generated</p>
              </div>
            </div>
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-200">
              Human approval is required before GitHub write simulation or real provider hooks.
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                "Commit message: BuildOS generated MVP workspace",
                "PR summary includes architecture, test plan, and deployment notes",
                "Demo mode does not call GitHub APIs",
                "Audit log captures request, decision, and action result"
              ].map((item) => (
                <div key={item} className="rounded-md border bg-background p-3 text-sm leading-6 text-muted-foreground">{item}</div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => request.mutate()} disabled={request.isPending}>
                <ShieldCheck className="h-4 w-4" aria-hidden />
                Request approval
              </Button>
              <Button variant="secondary" onClick={() => approvalId && approve.mutate(approvalId)} disabled={!approvalId || approve.isPending}>
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                Approve
              </Button>
              <Button onClick={() => pr.mutate()} disabled={pr.isPending}>
                <GitPullRequestArrow className="h-4 w-4" aria-hidden />
                Create demo PR
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="max-h-52 overflow-auto rounded-md border bg-background p-3 text-xs">{JSON.stringify(status.data ?? {}, null, 2)}</pre>
            <div className="space-y-2">
              {approvals.data?.map((approval) => (
                <div key={approval.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                  <span>{approval.action_type}</span>
                  <StatusBadge status={approval.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
