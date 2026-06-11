import { KeyRound } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ApiKeysPage() {
  return (
    <>
      <PageHeader title="API keys" description="Safe storage placeholders for AI and GitHub providers. Secrets are never exposed to frontend code." />
      <Card>
        <CardHeader>
          <CardTitle>Provider keys</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {["Gemini API key", "OpenAI API key", "GitHub token", "Encryption key"].map((label) => (
            <div key={label}>
              <label className="text-sm font-medium">{label}</label>
              <div className="mt-2 flex gap-2">
                <Input type="password" placeholder="Stored server-side only" disabled />
                <Button variant="secondary" size="icon" title="API key updates require approval">
                  <KeyRound className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

