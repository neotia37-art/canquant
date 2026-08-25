import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { LetterScore } from "@/lib/types";
import { Tone } from "./shell";
import { cn } from "@/lib/utils";

export const statusLabel: Record<string, string> = {
  pass: "통과",
  watch: "주의",
  fail: "탈락",
  na: "데이터 부족",
};

export function LetterCard({ item, defaultOpen = true }: { item: LetterScore; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <article className="rounded-lg border border-border bg-bg-subtle/60 p-4">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-start gap-3 text-left">
        <span className="font-display text-3xl leading-none text-accent">{item.letter}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-medium">
              {item.subtitle}
              <span className="ml-2 font-mono text-[11px] font-normal text-subtle">{item.title}</span>
            </h3>
            <span className="font-mono text-sm tabular-nums text-muted">
              {item.score == null ? "—" : Math.round(item.score)}
              <span className="text-subtle"> /100</span>
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">{item.summary}</p>
          <Tone status={item.status}>
            <span className="mt-1 inline-block font-mono text-[11px] uppercase tracking-wider">{statusLabel[item.status]}</span>
          </Tone>
        </div>
        <ChevronDown className={cn("mt-1 size-4 shrink-0 text-subtle transition-transform duration-(--motion-quick)", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="mt-4 space-y-4 border-t border-border pt-4 text-sm">
          <p className="text-fg/90">{item.detail}</p>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-subtle">O'Neil</p>
            <p className="mt-1 text-muted">{item.oneil}</p>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-subtle">Grok 보완</p>
            <p className="mt-1 text-muted">{item.grok}</p>
          </div>
          <ul className="space-y-2">
            {item.checks.map((c) => (
              <li key={c.id} className="rounded-md border border-border bg-bg px-3 py-2">
                <div className="flex items-baseline justify-between gap-3">
                  <span>{c.label}</span>
                  <Tone status={c.status}>
                    <span className="font-mono text-xs tabular-nums">{c.value}</span>
                  </Tone>
                </div>
                <p className="mt-1 text-xs text-subtle">{c.note}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
