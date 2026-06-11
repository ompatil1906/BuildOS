"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Code2, Workflow } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signup } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await signup({ name, email, password });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f5efe2] px-6 py-10 text-[#171923] lg:grid-cols-[520px_1fr]">
      <section className="grid place-items-center">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-lg border border-[#d8ccb3] bg-white p-7 shadow-soft">
        <Link href="/" className="flex items-center gap-2 text-sm text-slate-600">
          <Code2 className="h-4 w-4" aria-hidden />
          BuildOS
        </Link>
        <h1 className="serif-display mt-6 text-3xl font-semibold">Create account</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Create a local workspace for product generation, approvals, and build reports.</p>
        <div className="mt-6 space-y-3">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" />
          <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
          <Input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" />
        </div>
        {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
        <Button className="mt-5 w-full" type="submit">Create account</Button>
      </form>
      </section>
      <section className="paper-grid hidden rounded-lg border border-[#d8ccb3] bg-white/55 p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-[#171923] text-white">
            <Workflow className="h-5 w-5" aria-hidden />
          </span>
          <span className="font-semibold">Autonomous software factory</span>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7c5f2a]">Workspace contents</p>
          <h2 className="serif-display mt-5 max-w-xl text-5xl font-semibold leading-tight">PRDs, architecture, tasks, files, approvals, and reports.</h2>
          <p className="mt-5 max-w-xl leading-8 text-slate-700">
            BuildOS is designed to show a complete engineering lifecycle, not a single generated snippet.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {["Planning", "Code", "Release"].map((item) => (
            <div key={item} className="rounded-md border border-[#d8ccb3] bg-white p-3 text-center font-medium">{item}</div>
          ))}
        </div>
      </section>
    </main>
  );
}
