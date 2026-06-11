export function MarkdownPreview({ content }: { content?: string }) {
  if (!content) return <p className="text-sm text-muted-foreground">No markdown generated yet.</p>;
  const lines = content.split("\n");
  return (
    <article className="space-y-3 text-sm leading-6">
      {lines.map((line, index) => {
        if (line.startsWith("# ")) return <h1 key={index} className="pt-2 text-2xl font-semibold">{line.slice(2)}</h1>;
        if (line.startsWith("## ")) return <h2 key={index} className="pt-4 text-lg font-semibold">{line.slice(3)}</h2>;
        if (line.startsWith("- ")) return <p key={index} className="pl-4 text-muted-foreground">• {line.slice(2)}</p>;
        if (!line.trim()) return <div key={index} className="h-1" />;
        return <p key={index} className="text-muted-foreground">{line}</p>;
      })}
    </article>
  );
}

