"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Code2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@buildos.dev");
  const [password, setPassword] = useState("buildos-demo");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <main className="grid min-h-screen bg-[#111318] px-6 py-10 text-white lg:grid-cols-[1fr_520px]">
      <section className="premium-grid hidden rounded-lg border border-white/10 p-10 lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-[#f5efe2] text-[#111318]">
            <Code2 className="h-5 w-5" aria-hidden />
          </span>
          BuildOS
        </Link>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f4dfad]">Secure demo workspace</p>
          <h1 className="serif-display mt-5 max-w-xl text-5xl font-semibold leading-tight text-[#f7efe3]">Return to the software factory.</h1>
          <p className="mt-5 max-w-xl leading-8 text-slate-300">
            Inspect generated PRDs, architecture, code, approval records, build reports, and audit trails from one operating surface.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.045] p-4 text-sm text-slate-300">
          <ShieldCheck className="h-5 w-5 text-emerald-300" aria-hidden />
          Demo actions stay approval-gated.
        </div>
      </section>
      <section className="grid place-items-center">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-lg border border-white/10 bg-white p-7 text-[#171923] shadow-2xl">
        <Link href="/" className="text-sm text-slate-500">BuildOS</Link>
        <h1 className="serif-display mt-6 text-3xl font-semibold">Login</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Use the seeded demo account to open the complete SupportFlow AI workspace.</p>
        <div className="mt-6 space-y-3">
          <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
          <Input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" />
        </div>
        {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
        <Button className="mt-5 w-full" type="submit">Continue</Button>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          New here? <Link href="/signup" className="text-primary">Create account</Link>
        </p>
      </form>
      </section>
    </main>
  );
}
