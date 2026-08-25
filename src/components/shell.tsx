import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "마켓" },
  { to: "/kang", label: "강환국" },
  { to: "/backtest", label: "백테스트" },
  { to: "/guide", label: "방법론" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex min-w-0 items-baseline gap-2">
            <span className="font-display text-lg tracking-tight">캔퀀트</span>
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-muted sm:inline">
              CANSLIM × KANG
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-sm px-3 py-2 text-sm text-muted transition-colors duration-(--motion-quick) hover:text-fg"
                activeProps={{ className: "text-fg" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">{children}</div>
      <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-subtle sm:px-6">
        공개된 시세·재무로 계산한 연구 데스크입니다. 투자 권유가 아니며, 손실 한도와 손절은 본인 책임입니다.
      </footer>
    </div>
  );
}

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-bg-elevated p-4 sm:p-5", className)}>{children}</section>
  );
}

export function Tone({
  status,
  children,
}: {
  status: "pass" | "watch" | "fail" | "na" | "up" | "down";
  children: React.ReactNode;
}) {
  const cls =
    status === "pass" || status === "up"
      ? "text-up"
      : status === "fail" || status === "down"
        ? "text-down"
        : status === "watch"
          ? "text-warn"
          : "text-muted";
  return <span className={cls}>{children}</span>;
}
