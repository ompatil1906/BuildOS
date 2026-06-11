"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, GitBranch, GitPullRequestArrow, KeyRound, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { ProjectNav } from "@/components/project/project-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  approveAction,
  connectGitHub,
  createGitHubPR,
  createGitHubRepo,
  getApprovals,
  getGeneratedFiles,
  getGitHubStatus,
  getProject,
  requestApproval
} from "@/lib/api";

type ActionType = "github.create_repo" | "github.create_pr";

export default function GitHubPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const project = useQuery({ queryKey: ["project", id], queryFn: () => getProject(id) });
  const status = useQuery({ queryKey: ["github", id], queryFn: () => getGitHubStatus(id), retry: false });
  const files = useQuery({ queryKey: ["files", id], queryFn: () => getGeneratedFiles(id), retry: false });
  const approvals = useQuery({ queryKey: ["approvals", id], queryFn: () => getApprovals(id), retry: false });

  const [githubUsername, setGithubUsername] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [repoName, setRepoName] = useState("");
  const [branchName, setBranchName] = useState("buildos/generated-workspace");
  const [selectedApproval, setSelectedApproval] = useState<string | null>(null);
  const resolvedRepoName = repoName || project.data?.slug || "buildos-project";

  const latestApproval = useMemo(
    () => approvals.data?.find((item) => item.id === selectedApproval) ?? approvals.data?.find((item) => item.status === "pending") ?? approvals.data?.[0],
    [approvals.data, selectedApproval]
  );

  const connect = useMutation({
    mutationFn: () => connectGitHub(id, { github_username: githubUsername, access_token: githubToken }),
    onSuccess: async () => {
      setGithubToken("");
      await queryClient.invalidateQueries({ queryKey: ["github", id] });
    }
  });

  const request = useMutation({
    mutationFn: (actionType: ActionType) =>
      requestApproval(id, {
        action_type: actionType,
        action_summary:
          actionType === "github.create_repo"
            ? `Create GitHub repository ${resolvedRepoName}.`
            : `Commit ${files.data?.length ?? 0} generated files and open a GitHub pull request for ${resolvedRepoName}.`,
        risk_level: "medium",
        payload_json: {
          repo_name: resolvedRepoName,
          branch_name: branchName,
          files: files.data?.map((file) => file.path) ?? []
        }
      }),
    onSuccess: async (approval) => {
      setSelectedApproval(approval.id);
      await queryClient.invalidateQueries({ queryKey: ["approvals", id] });
    }
  });

  const approve = useMutation({
    mutationFn: (idToApprove: string) => approveAction(idToApprove),
    onSuccess: async (approval) => {
      setSelectedApproval(approval.id);
      await queryClient.invalidateQueries({ queryKey: ["approvals", id] });
    }
  });

  const repo = useMutation({
    mutationFn: () =>
      createGitHubRepo(id, {
        approval_id: approvals.data?.find((item) => item.status === "approved" && item.action_type === "github.create_repo")?.id ?? "",
        repo_name: resolvedRepoName,
        branch_name: branchName,
        private: true
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["github", id] })
  });

  const pr = useMutation({
    mutationFn: () =>
      createGitHubPR(id, {
        approval_id: approvals.data?.find((item) => item.status === "approved" && item.action_type === "github.create_pr")?.id ?? "",
        repo_name: resolvedRepoName,
        branch_name: branchName
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["github", id] })
  });

  const mutationError = connect.error || request.error || approve.error || repo.error || pr.error;

  return (
    <>
      <ProjectNav projectId={id} active="GitHub" />
      <PageHeader
        title="GitHub Integration"
        description="Connect a GitHub token, preview the files and target branch, then require approval before BuildOS creates repositories or pull requests."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_390px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provider Connection</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-[1fr_1.4fr_auto]">
              <Input value={githubUsername} onChange={(event) => setGithubUsername(event.target.value)} placeholder="GitHub username or organization" />
              <Input value={githubToken} onChange={(event) => setGithubToken(event.target.value)} placeholder="Fine-grained GitHub token" type="password" />
              <Button onClick={() => connect.mutate()} disabled={!githubUsername || !githubToken || connect.isPending}>
                <KeyRound className="h-4 w-4" aria-hidden />
                Connect
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Action Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Repository</p>
                  <Input className="mt-2" value={resolvedRepoName} onChange={(event) => setRepoName(event.target.value)} />
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Branch</p>
                  <Input className="mt-2" value={branchName} onChange={(event) => setBranchName(event.target.value)} />
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Files</p>
                  <p className="mt-3 text-lg font-semibold">{files.data?.length ?? 0}</p>
                </div>
              </div>
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-700 dark:text-amber-200">
                Repository creation and pull request creation both require an approved approval record. BuildOS stores the token encrypted server-side.
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => request.mutate("github.create_repo")} disabled={request.isPending}>
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  Request repo approval
                </Button>
                <Button variant="secondary" onClick={() => request.mutate("github.create_pr")} disabled={request.isPending}>
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  Request PR approval
                </Button>
                <Button variant="secondary" onClick={() => latestApproval && approve.mutate(latestApproval.id)} disabled={!latestApproval || latestApproval.status !== "pending" || approve.isPending}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Approve selected
                </Button>
                <Button onClick={() => repo.mutate()} disabled={repo.isPending}>
                  <GitBranch className="h-4 w-4" aria-hidden />
                  Create repo
                </Button>
                <Button onClick={() => pr.mutate()} disabled={pr.isPending}>
                  <GitPullRequestArrow className="h-4 w-4" aria-hidden />
                  Create PR
                </Button>
              </div>
              {mutationError ? <p className="text-sm text-red-500">{mutationError.message}</p> : null}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="max-h-52 overflow-auto rounded-md border bg-background p-3 text-xs">{JSON.stringify(status.data ?? {}, null, 2)}</pre>
            <div className="space-y-2">
              {approvals.data?.map((approval) => (
                <button
                  key={approval.id}
                  onClick={() => setSelectedApproval(approval.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <span>{approval.action_type}</span>
                  <StatusBadge status={approval.status} />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
