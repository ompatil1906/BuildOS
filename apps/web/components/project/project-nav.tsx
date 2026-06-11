import Link from "next/link";
import { Activity, Code2, FileText, Gauge, Github, Home, ListChecks, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "", label: "Overview", icon: Home },
  { href: "/prd", label: "PRD", icon: FileText },
  { href: "/architecture", label: "Architecture", icon: Gauge },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/agent-runs", label: "Agent runs", icon: Activity },
  { href: "/code", label: "Code", icon: Code2 },
  { href: "/github", label: "GitHub", icon: Github },
  { href: "/builds", label: "Builds", icon: Gauge },
  { href: "/security", label: "Security", icon: ShieldCheck }
];

export function ProjectNav({ projectId, active }: { projectId: string; active: string }) {
  return (
    <div className="premium-scrollbar mb-6 flex gap-2 overflow-x-auto rounded-lg border bg-card p-1 shadow-sm">
      {tabs.map((tab) => (
        <Link
          key={tab.label}
          href={`/projects/${projectId}${tab.href}`}
          className={cn(
            "inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
            active === tab.label && "bg-[#111318] text-white dark:bg-[#f5efe2] dark:text-[#111318]"
          )}
        >
          <tab.icon className="h-4 w-4" aria-hidden />
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
