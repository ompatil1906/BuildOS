import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({ label, value, icon: Icon, note }: { label: string; value: string | number; icon: LucideIcon; note?: string }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
          {note ? <p className="mt-2 text-xs text-muted-foreground">{note}</p> : null}
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-md border bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
        </div>
      </CardContent>
    </Card>
  );
}

