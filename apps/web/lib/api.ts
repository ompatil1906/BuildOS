import type {
  AgentRun,
  ApiEnvelope,
  Approval,
  Architecture,
  AuditLog,
  BuildReport,
  GeneratedFile,
  PRD,
  Project,
  Task,
  User
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const TOKEN_KEY = "buildos.access_token";

export type ProjectCreateInput = {
  name: string;
  idea: string;
  target_users: string;
  preferred_stack: string;
  required_features: string[];
  deployment_preference: string;
  ai_features_required: string[];
  complexity: "simple" | "standard" | "advanced";
};

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window !== "undefined") window.localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });
  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!payload.success) {
    throw new Error(payload.error.message);
  }
  return payload.data;
}

export async function login(email: string, password: string) {
  const data = await request<{ access_token: string; user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  setToken(data.access_token);
  return data;
}

export async function signup(input: { name: string; email: string; password: string }) {
  const data = await request<{ access_token: string; user: User }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(input)
  });
  setToken(data.access_token);
  return data;
}

export const getMe = () => request<User>("/auth/me");
export const createProject = (input: ProjectCreateInput) => request<Project>("/projects", { method: "POST", body: JSON.stringify(input) });
export const getProjects = () => request<Project[]>("/projects");
export const getProject = (id: string) => request<Project>(`/projects/${id}`);
export const generatePRD = (id: string) => request<PRD>(`/projects/${id}/generate-prd`, { method: "POST" });
export const getPRD = (id: string) => request<PRD | null>(`/projects/${id}/prd`);
export const generateArchitecture = (id: string) => request<Architecture>(`/projects/${id}/generate-architecture`, { method: "POST" });
export const getArchitecture = (id: string) => request<Architecture | null>(`/projects/${id}/architecture`);
export const generateTasks = (id: string) => request<Task[]>(`/projects/${id}/generate-tasks`, { method: "POST" });
export const getTasks = (id: string) => request<Task[]>(`/projects/${id}/tasks`);
export const generateCode = (id: string) => request<GeneratedFile[]>(`/projects/${id}/generate-code`, { method: "POST" });
export const getGeneratedFiles = (id: string) => request<GeneratedFile[]>(`/projects/${id}/files`);
export const getAgentRuns = (id: string) => request<AgentRun[]>(`/projects/${id}/agent-runs`);
export const requestApproval = (id: string, input: Pick<Approval, "action_type" | "action_summary" | "risk_level" | "payload_json">) =>
  request<Approval>(`/projects/${id}/approvals`, { method: "POST", body: JSON.stringify(input) });
export const getApprovals = (id: string) => request<Approval[]>(`/projects/${id}/approvals`);
export const approveAction = (id: string) => request<Approval>(`/approvals/${id}/approve`, { method: "POST" });
export const rejectAction = (id: string) => request<Approval>(`/approvals/${id}/reject`, { method: "POST" });
export const simulateBuild = (id: string) => request<BuildReport>(`/projects/${id}/builds/simulate`, { method: "POST" });
export const getBuildReports = (id: string) => request<BuildReport[]>(`/projects/${id}/builds`);
export const getAuditLogs = () => request<AuditLog[]>("/audit-logs");
export const getProjectAuditLogs = (id: string) => request<AuditLog[]>(`/projects/${id}/audit-logs`);
export const getGitHubStatus = (id: string) => request<Record<string, unknown>>(`/projects/${id}/github/status`);
export const connectGitHub = (id: string, input: { github_username: string; access_token: string }) =>
  request<Record<string, unknown>>(`/projects/${id}/github/connect`, { method: "POST", body: JSON.stringify(input) });
export const createGitHubRepo = (id: string, input: { approval_id: string; repo_name: string; branch_name: string; private: boolean }) =>
  request<Record<string, unknown>>(`/projects/${id}/github/create-repo`, {
    method: "POST",
    body: JSON.stringify({ ...input, dry_run: false })
  });
export const createGitHubPR = (id: string, input: { approval_id: string; repo_name: string; branch_name: string }) =>
  request<Record<string, unknown>>(`/projects/${id}/github/create-pr`, {
    method: "POST",
    body: JSON.stringify({ ...input, dry_run: false })
  });
