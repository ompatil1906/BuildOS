import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value?: string | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function statusTone(status?: string) {
  const normalized = (status ?? "").toLowerCase();
  if (["passed", "approved", "completed", "ready", "created", "pull_request_opened", "repository_created"].includes(normalized)) return "success";
  if (["warning", "needs_review", "pending"].includes(normalized)) return "warning";
  if (["failed", "rejected", "error"].includes(normalized)) return "danger";
  return "neutral";
}
