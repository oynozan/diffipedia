"use client";

import { cn } from "@/utils/helpers";

type JsonLdPanelProps = {
  jsonld?: Record<string, unknown> | null;
  summaryLabel?: string;
  defaultOpen?: boolean;
  className?: string;
};

export default function JsonLdPanel({
  jsonld,
  summaryLabel = "Raw JSON-LD output",
  defaultOpen = false,
  className,
}: JsonLdPanelProps) {
  if (!jsonld) {
    return null;
  }

  return (
    <details
      className={cn(
        "space-y-3 rounded-md border border-border bg-gray20/30 p-4",
        className,
      )}
      open={defaultOpen}
    >
      <summary className="cursor-pointer text-sm font-semibold text-gray">
        {summaryLabel}
      </summary>
      <pre className="max-h-96 overflow-auto rounded-md bg-black/20 p-3 text-xs leading-relaxed text-gray-100">
        {JSON.stringify(jsonld, null, 2)}
      </pre>
    </details>
  );
}

