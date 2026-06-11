export type ApiEnvelope<T> =
  | { success: true; data: T; message: string }
  | { success: false; error: { code: string; message: string; details?: unknown } };

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type Project = {
  id: string;
  name: string;
  slug: string;
  idea: string;
  target_users: string;
  preferred_stack: string;
  complexity: "simple" | "standard" | "advanced" | string;
  status: string;
  created_at: string;
  updated_at?: string | null;
};

export type PRD = {
  id: string;
  project_id: string;
  content_markdown: string;
  content_json: Record<string, unknown>;
  version: number;
  created_at: string;
};

export type Architecture = {
  id: string;
  project_id: string;
  content_markdown: string;
  frontend_plan: Record<string, unknown>;
  backend_plan: Record<string, unknown>;
  database_plan: Record<string, unknown>;
  ai_plan: Record<string, unknown>;
  devops_plan: Record<string, unknown>;
  security_plan: Record<string, unknown>;
  created_at: string;
};

export type Task = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  complexity: string;
  status: string;
  dependencies_json: string[];
  acceptance_criteria_json: string[];
  created_at?: string;
};

export type GeneratedFile = {
  id: string;
  project_id: string;
  path: string;
  language: string;
  content: string;
  purpose: string;
  status: string;
};

export type AgentRun = {
  id: string;
  project_id: string;
  agent_name: string;
  input_json: Record<string, unknown>;
  output_json: Record<string, unknown>;
  status: string;
  started_at: string;
  completed_at?: string | null;
  error_message?: string | null;
  steps?: AgentStep[];
};

export type AgentStep = {
  id: string;
  step_name: string;
  tool_used: string;
  status: string;
  input_json: Record<string, unknown>;
  output_json: Record<string, unknown>;
  created_at: string;
};

export type Approval = {
  id: string;
  project_id: string;
  action_type: string;
  action_summary: string;
  risk_level: string;
  payload_json: Record<string, unknown>;
  status: string;
  created_at: string;
  decided_at?: string | null;
};

export type BuildReport = {
  id: string;
  project_id: string;
  status: string;
  summary: string;
  logs: string;
  test_results_json: {
    stages?: Array<{ name: string; status: string; duration?: string; note?: string }>;
    readiness_score?: number;
    generated_files?: number;
  };
  security_findings_json: Array<{ severity: string; message: string; path?: string }>;
  created_at: string;
};

export type AuditLog = {
  id: string;
  user_id?: string | null;
  project_id?: string | null;
  action: string;
  metadata_json: Record<string, unknown>;
  ip_address?: string | null;
  created_at: string;
};

