"use client";

import { Copy, Download, RefreshCw } from "lucide-react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/dashboard/page-header";
import { ProjectNav } from "@/components/project/project-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MarkdownPreview } from "@/components/ui/markdown";
import { generatePRD, getPRD } from "@/lib/api";

export default function PRDPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const prd = useQuery({ queryKey: ["prd", id], queryFn: () => getPRD(id), retry: false });
  const generate = useMutation({ mutationFn: () => generatePRD(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prd", id] }) });

  return (
    <>
      <ProjectNav projectId={id} active="PRD" />
      <PageHeader
        title="Product requirements"
        description="Professional PRD generated from the product idea and stored as project memory."
        actions={
          <>
            <Button variant="secondary" size="icon" title="Copy PRD" onClick={() => navigator.clipboard.writeText(prd.data?.content_markdown ?? "")}>
              <Copy className="h-4 w-4" aria-hidden />
            </Button>
            <Button variant="secondary" size="icon" title="Download PRD">
              <Download className="h-4 w-4" aria-hidden />
            </Button>
            <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              Regenerate
            </Button>
          </>
        }
      />
      {prd.data ? (
        <Card>
          <CardContent>
            <MarkdownPreview content={prd.data.content_markdown} />
          </CardContent>
        </Card>
      ) : (
        <EmptyState title="No PRD yet" description="Generate a PRD to create the product foundation." action={<Button onClick={() => generate.mutate()}>Generate PRD</Button>} />
      )}
    </>
  );
}

