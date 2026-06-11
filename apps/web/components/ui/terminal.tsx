export function Terminal({ logs }: { logs?: string }) {
  return (
    <pre className="terminal max-h-[420px] overflow-auto rounded-lg border border-white/10 p-4 text-xs leading-6">
      {logs || "[WAITING] Run a build simulation to stream pipeline logs."}
    </pre>
  );
}

