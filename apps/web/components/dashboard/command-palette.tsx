"use client";

import Link from "next/link";
import { FileCode2, GitPullRequestArrow, LayoutDashboard, Search, ShieldCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUiStore } from "@/lib/store";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FileCode2 },
  { href: "/projects/new", label: "New project", icon: GitPullRequestArrow },
  { href: "/settings/audit-logs", label: "Audit logs", icon: ShieldCheck }
];

export function CommandPalette() {
  const open = useUiStore((state) => state.commandOpen);
  const setOpen = useUiStore((state) => state.setCommandOpen);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4 backdrop-blur-sm" role="dialog" aria-modal>
      <div className="mx-auto mt-20 max-w-xl rounded-lg border bg-card shadow-soft">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
          <input className="h-9 flex-1 bg-transparent text-sm outline-none" placeholder="Search BuildOS" autoFocus />
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} title="Close command palette">
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <div className="p-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              <item.icon className="h-4 w-4 text-muted-foreground" aria-hidden />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

