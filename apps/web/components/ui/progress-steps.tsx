import { CheckCircle2, Circle, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export type Step = {
  label: string;
  status: "done" | "active" | "todo";
};

export function ProgressSteps({ steps }: { steps: Step[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {steps.map((step) => (
        <div key={step.label} className={cn("flex items-center gap-3 rounded-lg border bg-card px-4 py-3", step.status === "active" && "border-primary/50")}>
          {step.status === "done" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden />
          ) : step.status === "active" ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" aria-hidden />
          )}
          <span className="text-sm font-medium">{step.label}</span>
        </div>
      ))}
    </div>
  );
}

