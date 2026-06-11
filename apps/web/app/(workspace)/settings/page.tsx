"use client";

import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { getMe } from "@/lib/api";

export default function SettingsPage() {
  const me = useQuery({ queryKey: ["me"], queryFn: getMe, retry: false });
  return (
    <>
      <PageHeader title="Settings" description="Workspace profile, safety posture, and production configuration." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{me.data?.name ?? "Not loaded"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{me.data?.email ?? "Not loaded"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Safety mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-sm">GitHub writes</span>
              <StatusBadge status="approval_required" />
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-sm">Generated code execution</span>
              <StatusBadge status="blocked" />
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-sm">Secret exposure</span>
              <StatusBadge status="guarded" />
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Production Upgrade Notes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            "Move API keys into encrypted server-side storage.",
            "Attach real GitHub OAuth after approval workflow review.",
            "Run generated code only inside an isolated sandbox runner."
          ].map((item) => (
            <div key={item} className="rounded-md border bg-background p-4 text-sm leading-6 text-muted-foreground">{item}</div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
