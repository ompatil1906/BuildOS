"use client";

import dynamic from "next/dynamic";
import { Copy, Download } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import type { GeneratedFile } from "@/types";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export function CodeViewer({ files }: { files: GeneratedFile[] }) {
  const [selectedId, setSelectedId] = useState(files[0]?.id);
  const selected = useMemo(() => files.find((file) => file.id === selectedId) ?? files[0], [files, selectedId]);

  if (!selected) {
    return <p className="text-sm text-muted-foreground">Generate code to inspect files.</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardContent className="p-2">
          <div className="max-h-[650px] overflow-auto">
            {files.map((file) => (
              <button
                key={file.id}
                onClick={() => setSelectedId(file.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
                  selected.id === file.id && "bg-muted"
                )}
              >
                <span className="min-w-0 truncate">{file.path}</span>
                <span className="text-xs text-muted-foreground">{file.language}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{selected.path}</p>
            <p className="text-xs text-muted-foreground">{selected.purpose}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={selected.status} />
            <Button variant="secondary" size="icon" title="Copy code" onClick={() => navigator.clipboard.writeText(selected.content)}>
              <Copy className="h-4 w-4" aria-hidden />
            </Button>
            <Button variant="secondary" size="icon" title="Download project ZIP placeholder">
              <Download className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
        <div className="h-[620px]">
          <MonacoEditor
            height="620px"
            language={selected.language === "tsx" ? "typescript" : selected.language}
            theme="vs-dark"
            value={selected.content}
            options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, wordWrap: "on" }}
          />
        </div>
      </Card>
    </div>
  );
}

