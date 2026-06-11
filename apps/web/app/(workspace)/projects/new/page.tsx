"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { createProject } from "@/lib/api";

const schema = z.object({
  name: z.string().min(2),
  idea: z.string().min(10),
  target_users: z.string().min(2),
  preferred_stack: z.string().min(2),
  required_features: z.string().min(2),
  deployment_preference: z.string().min(2),
  ai_features_required: z.string().optional(),
  complexity: z.enum(["simple", "standard", "advanced"])
});

type FormValues = z.infer<typeof schema>;

export default function NewProjectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "SupportFlow AI",
      idea: "AI customer support ticket SaaS for small ecommerce stores.",
      target_users: "Small ecommerce operators and support teams",
      preferred_stack: "Next.js, FastAPI, PostgreSQL",
      required_features: "Login, dashboard, ticket management, AI priority detection, admin panel, analytics, deployment pipeline",
      deployment_preference: "Docker Compose with GitHub Actions",
      ai_features_required: "AI priority detection, ticket summarization",
      complexity: "standard"
    }
  });
  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createProject({
        ...values,
        required_features: values.required_features.split(",").map((item) => item.trim()).filter(Boolean),
        ai_features_required: (values.ai_features_required ?? "").split(",").map((item) => item.trim()).filter(Boolean)
      }),
    onSuccess: async (project) => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push(`/projects/${project.id}`);
    }
  });

  return (
    <>
      <PageHeader title="New project" description="Describe the product and BuildOS will create the structured software factory workspace." />
      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="grid gap-4 lg:grid-cols-[1fr_390px]">
        <Card>
          <CardHeader>
            <CardTitle>Product Idea</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Project name</label>
              <Input {...form.register("name")} />
            </div>
            <div>
              <label className="text-sm font-medium">Idea</label>
              <Textarea {...form.register("idea")} />
            </div>
            <div>
              <label className="text-sm font-medium">Target users</label>
              <Input {...form.register("target_users")} />
            </div>
            <div>
              <label className="text-sm font-medium">Preferred stack</label>
              <Input {...form.register("preferred_stack")} />
            </div>
            <div>
              <label className="text-sm font-medium">Required features</label>
              <Textarea {...form.register("required_features")} />
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Build Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Deployment preference</label>
                <Input {...form.register("deployment_preference")} />
              </div>
              <div>
                <label className="text-sm font-medium">AI features</label>
                <Input {...form.register("ai_features_required")} />
              </div>
              <div>
                <label className="text-sm font-medium">Complexity</label>
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" {...form.register("complexity")}>
                  <option value="simple">Simple</option>
                  <option value="standard">Standard</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              {mutation.error ? <p className="text-sm text-red-500">{mutation.error.message}</p> : null}
              <Button className="w-full" type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Creating..." : "Create project"}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>What BuildOS creates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {["PRD with risks and success metrics", "Architecture and database plan", "Task board with acceptance criteria", "Generated starter code and CI/CD", "Approval-gated GitHub action", "Build and security report"].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </form>
    </>
  );
}
