"use client";

import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getAuditLogs } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function AuditLogsPage() {
  const logs = useQuery({ queryKey: ["audit-logs"], queryFn: getAuditLogs, retry: false });
  return (
    <>
      <PageHeader title="Audit logs" description="Security-relevant actions across login, project creation, generation, approvals, GitHub, and build simulation." />
      <Card>
        <CardHeader>
          <CardTitle>Recent events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {logs.data?.length ? (
            logs.data.map((log) => (
              <div key={log.id} className="grid gap-2 rounded-md border px-3 py-2 text-sm md:grid-cols-[220px_1fr_160px]">
                <span className="font-medium">{log.action}</span>
                <span className="truncate text-muted-foreground">{JSON.stringify(log.metadata_json)}</span>
                <span className="text-muted-foreground">{formatDate(log.created_at)}</span>
              </div>
            ))
          ) : (
            <EmptyState title="No audit logs loaded" description="Login with the demo account or perform a project action to create audit events." />
          )}
        </CardContent>
      </Card>
    </>
  );
}

