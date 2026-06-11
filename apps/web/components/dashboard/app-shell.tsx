"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Boxes,
  Code2,
  FileText,
  Gauge,
  Github,
  Home,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  Moon,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sun
} from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { useSession } from "@/hooks/use-session";
import { useUiStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const primaryNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: Boxes },
  { href: "/projects/new", label: "New project", icon: Plus },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/settings/api-keys", label: "API keys", icon: KeyRound },
  { href: "/settings/audit-logs", label: "Audit logs", icon: ShieldCheck }
];

const projectNav = [
  { label: "Overview", icon: Home },
  { label: "PRD", icon: FileText },
  { label: "Architecture", icon: Gauge },
  { label: "Tasks", icon: ListChecks },
  { label: "Agent runs", icon: Activity },
  { label: "Code", icon: Code2 },
  { label: "GitHub", icon: Github },
  { label: "Builds", icon: Gauge },
  { label: "Security", icon: ShieldCheck }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useSession();
  const setCommandOpen = useUiStore((state) => state.setCommandOpen);
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CommandPalette />
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 bg-[#111318] text-white lg:block">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-[#f5efe2] text-[#111318]">
            <Code2 className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="font-semibold">BuildOS</p>
            <p className="text-xs text-slate-400">Autonomous software factory</p>
          </div>
        </div>
        <div className="mx-3 mt-4 rounded-lg border border-white/10 bg-white/[0.045] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f4dfad]">Factory status</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-md border border-white/10 bg-black/20 p-3">
              <p className="text-slate-400">Mode</p>
              <p className="mt-1 font-medium text-emerald-300">Production</p>
            </div>
            <div className="rounded-md border border-white/10 bg-black/20 p-3">
              <p className="text-slate-400">PR gate</p>
              <p className="mt-1 font-medium text-amber-200">Approval</p>
            </div>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-white/[0.07] hover:text-white",
                pathname === item.href && "bg-white/[0.09] text-white"
              )}
            >
              <item.icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mx-3 mt-4 rounded-lg border border-white/10 bg-white/[0.035] p-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Project workflow</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {projectNav.map((item) => (
              <div key={item.label} className="grid aspect-square place-items-center rounded-md border border-white/10 bg-black/20" title={item.label}>
                <item.icon className="h-4 w-4 text-slate-400" aria-hidden />
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-4 left-3 right-3 rounded-lg border border-white/10 bg-white/[0.045] p-3">
          <p className="text-xs text-slate-400">Signed in workspace</p>
          <p className="mt-1 truncate text-sm font-medium">{user?.name ?? "Signed out"}</p>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur lg:px-8">
          <button
            onClick={() => setCommandOpen(true)}
            className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border bg-card px-3 text-left text-sm text-muted-foreground shadow-sm lg:max-w-xl"
          >
            <Search className="h-4 w-4" aria-hidden />
            Search projects, agents, files, approvals
          </button>
          <div className="hidden rounded-md border bg-card px-3 py-2 text-xs text-muted-foreground xl:block">
            BuildOS workspace · approval gates active
          </div>
          <Button variant="secondary" size="icon" onClick={toggleTheme} title="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
          </Button>
          {isAuthenticated ? (
            <div className="hidden rounded-md border px-3 py-2 text-sm md:block">{user?.name}</div>
          ) : (
            <Link href="/login">
              <Button variant="primary" size="sm" disabled={isLoading}>
                Login
              </Button>
            </Link>
          )}
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-7 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
