import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell, Panel, Tone } from "@/components/shell";
import {
  WATCH_UNIVERSE,
  KIWOOM19,
  THEME_CANDIDATES,
  THEME_LABEL,
  WORKFLOW_STEPS,
  REBALANCE_PLAN,
  RESET_CHECKLIST,
  UNIVERSE_META,
  activeRebalanceWindow,
  type WatchSource,
  type WatchTheme,
} from "@/lib/smallcap-watchlist";

export const Route = createFileRoute("/watchlist")({ component: WatchlistPage });

function WatchlistPage() {
  const [source, setSource] = useState<"all" | WatchSource>("all");
  const [theme, setTheme] = useState<"all" | WatchTheme>("all");
  const window = activeRebalanceWindow();

  const rows = useMemo(() => {
    return WATCH_UNIVERSE.filter((s) => {
      if (source !== "all" && s.source !== source) return false;
      if (theme !== "all" && s.theme !== theme) return false;
      return true;
    });
  }, [source, theme]);

  return (
    <Shell>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Small-cap watch → 20 equal weight</p>
      <h1 className="mt-1 font-display text-4xl">{UNIVERSE_META.title}</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        {UNIVERSE_META.sourceLabel}. 스냅샷 <span className="text-fg">{UNIVERSE_META.asOf}</span>. 목표{" "}
        <strong className="text-fg">{UNIVERSE_META.targetCount}종목 × {UNIVERSE_META.equalWeightPct}%</strong> 동일비중.
        후보가 새로 발표되면 유니버스를 초기화하고 분기 창에 리밸런싱합니다.
      </p>

      <Panel className="mt-6 border-warn/30 bg-[color-mix(in_oklab,var(--color-warn)_8%,var(--color-bg-elevated))]">
        <p className="text-sm font-medium text-fg">리밸런싱 상태</p>
        {window ? (
          <p className="mt-1 text-sm text-muted">
            현재 창: <span className="text-warn">{window.id.toUpperCase()}</span> · {window.window} · {window.trigger}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">분기 실적 공시 종료 후 창에서 전량 재스크리닝·비중 재조정.</p>
        )}
        <p className="mt-2 text-xs text-subtle">{UNIVERSE_META.liquidityHint}</p>
      </Panel>

      <h2 className="mt-10 font-display text-2xl">5단계 워크플로</h2>
      <div className="mt-4 grid gap-3">
        {WORKFLOW_STEPS.map((s) => (
          <Panel key={s.step} className="flex gap-4">
            <span className="font-mono text-lg text-muted">{s.step}</span>
            <div>
              <h3 className="font-medium">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.detail}</p>
              <p className="mt-1 text-xs text-fg">{s.action}</p>
            </div>
          </Panel>
        ))}
      </div>

      <h2 className="mt-12 font-display text-2xl">관심 유니버스</h2>
      <p className="mt-2 text-sm text-muted">
        키움 19 <Tone status="pass">{KIWOOM19.length}</Tone> · 테마{" "}
        <Tone status="watch">{THEME_CANDIDATES.length}</Tone> · 표시 {rows.length}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {(
          [
            ["all", "전체"],
            ["kiwoom19", "키움19"],
            ["theme", "테마"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setSource(k)}
            className={`rounded-sm border px-3 py-1.5 text-xs transition-colors ${
              source === k ? "border-fg text-fg" : "border-border text-muted hover:text-fg"
            }`}
          >
            {label}
          </button>
        ))}
        <span className="mx-1 text-border">|</span>
        {(
          [
            ["all", "테마 전체"],
            ["energy_plant", "에너지"],
            ["tech_parts", "부품"],
            ["healthcare", "의료"],
            ["ai_infra", "AI인프라"],
            ["ess_battery", "ESS"],
            ["semi_equip", "반도체"],
            ["other", "기타"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTheme(k)}
            className={`rounded-sm border px-3 py-1.5 text-xs transition-colors ${
              theme === k ? "border-fg text-fg" : "border-border text-muted hover:text-fg"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-bg-elevated text-xs text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">코드</th>
              <th className="px-3 py-2 font-medium">종목</th>
              <th className="px-3 py-2 font-medium">출처</th>
              <th className="px-3 py-2 font-medium">테마</th>
              <th className="px-3 py-2 font-medium">메모</th>
              <th className="px-3 py-2 font-medium">교차</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={`${s.code}-${s.name}`} className="border-b border-border/60 hover:bg-bg-elevated/50">
                <td className="px-3 py-2 font-mono text-xs text-muted">
                  {s.code}
                  {s.codeUncertain ? <span className="ml-1 text-warn">?</span> : null}
                </td>
                <td className="px-3 py-2 text-fg">{s.name}</td>
                <td className="px-3 py-2 text-xs text-muted">{s.source === "kiwoom19" ? "키움19" : "테마"}</td>
                <td className="px-3 py-2 text-xs text-muted">{THEME_LABEL[s.theme]}</td>
                <td className="max-w-[280px] px-3 py-2 text-xs text-muted">{s.note}</td>
                <td className="px-3 py-2">
                  <Link
                    to="/stock/$code"
                    params={{ code: s.code }}
                    className="text-xs text-accent underline-offset-2 hover:underline"
                  >
                    캔퀀트
                  </Link>
                  <a
                    href={`https://finance.naver.com/item/main.naver?code=${s.code}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 text-xs text-muted hover:text-fg"
                  >
                    네이버
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-subtle">
        ? 표시는 코드 재확인 권장. 캔퀀트 상세는 시세·재무 API가 되는 종목만 강환국 점수가 채워집니다.
      </p>

      <h2 className="mt-12 font-display text-2xl">리밸런싱 계획</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {REBALANCE_PLAN.map((r) => (
          <Panel
            key={r.id}
            className={
              window?.id === r.id
                ? "border-warn/40 bg-[color-mix(in_oklab,var(--color-warn)_6%,transparent)]"
                : undefined
            }
          >
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-mono text-sm uppercase text-muted">{r.id}</h3>
              <span className="text-sm text-fg">{r.window}</span>
            </div>
            <p className="mt-1 text-xs text-muted">{r.trigger}</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted">
              {r.actions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>

      <h2 className="mt-12 font-display text-2xl">후보 발표 시 초기화</h2>
      <Panel className="mt-4">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
          {RESET_CHECKLIST.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-subtle">
          데이터 파일: <code className="text-muted">src/lib/smallcap-watchlist.ts</code> — asOf·배열만 교체하면 탭이
          갱신됩니다.
        </p>
      </Panel>

      <Panel className="mt-8">
        <h3 className="font-medium">20 동일비중으로 가는 길</h3>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>유니버스에서 관리·적자·금융·지주 성격 제외</li>
          <li>거래대금 하한 통과</li>
          <li>매출·영업·순이익 YoY와 PER·PSR·PBR 기입 후 순위 또는 하이브리드</li>
          <li>캔퀀트 가치함정·대형 플래그 탈락</li>
          <li>상위 20 × 5%. 부족 분은 현금</li>
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/kang" className="rounded-sm border border-border px-3 py-2 text-sm text-muted hover:text-fg">
            강환국 패키지
          </Link>
          <Link to="/guide" className="rounded-sm border border-border px-3 py-2 text-sm text-muted hover:text-fg">
            방법론
          </Link>
          <Link to="/" className="rounded-sm border border-border px-3 py-2 text-sm text-muted hover:text-fg">
            종목 검색
          </Link>
        </div>
      </Panel>

      <p className="mt-8 text-xs text-subtle">{UNIVERSE_META.disclaimer}</p>
    </Shell>
  );
}
