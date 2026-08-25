import { Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { Shell, Panel, Tone } from "@/components/shell";
import { analyzeStock } from "@/lib/api";
import {
  type CapUniverseConfig,
  type RankMetric,
  type RankResult,
  RANK_METRICS,
  WORKFLOW_STEPS,
  REBALANCE_PLAN,
  RESET_CHECKLIST,
  activeRebalanceWindow,
  metricValue,
  CAP_CONFIGS,
} from "@/lib/cap-universes";
import type { StockReport } from "@/lib/types";

function canslimAvg(rep: StockReport): number | null {
  const scores = rep.canslim.map((c) => c.score).filter((s): s is number => s != null && Number.isFinite(s));
  if (!scores.length) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (t: T, i: number) => Promise<R>,
  onEach?: (done: number) => void,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  let done = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
      done++;
      onEach?.(done);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return out;
}

export function CapUniversePage({ config }: { config: CapUniverseConfig }) {
  const window = activeRebalanceWindow();
  const [metric, setMetric] = useState<RankMetric>("hybrid");
  const [ranks, setRanks] = useState<Record<string, RankResult>>({});
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [rankError, setRankError] = useState<string | null>(null);
  const [onlyRanked, setOnlyRanked] = useState(false);
  const [topN, setTopN] = useState(20);

  const runRank = useCallback(async () => {
    setBusy(true);
    setRankError(null);
    const codes = config.rows.map((r) => r.code);
    setProgress({ done: 0, total: codes.length });
    try {
      const results = await mapPool(
        codes,
        3,
        async (code) => {
          try {
            const rep = await analyzeStock({ data: { code } });
            return {
              code,
              hybrid: rep.hybrid,
              ultra: rep.kang.ultra,
              growthValue: rep.kang.growthValue,
              superValue: rep.kang.superValue,
              canslim: canslimAvg(rep),
              verdict: rep.verdict,
            } satisfies RankResult;
          } catch (e) {
            return {
              code,
              hybrid: null,
              ultra: null,
              growthValue: null,
              superValue: null,
              canslim: null,
              verdict: null,
              error: e instanceof Error ? e.message : "실패",
            } satisfies RankResult;
          }
        },
        (done) => setProgress({ done, total: codes.length }),
      );
      const map: Record<string, RankResult> = {};
      for (const r of results) map[r.code] = r;
      setRanks(map);
      setOnlyRanked(true);
    } catch (e) {
      setRankError(e instanceof Error ? e.message : "순위 산출 실패");
    } finally {
      setBusy(false);
    }
  }, [config.rows]);

  const sortedRows = useMemo(() => {
    const rows = [...config.rows];
    const hasRank = Object.keys(ranks).length > 0;
    if (!hasRank) return rows;
    rows.sort((a, b) => {
      const va = metricValue(ranks[a.code] ?? emptyRank(a.code), metric);
      const vb = metricValue(ranks[b.code] ?? emptyRank(b.code), metric);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return vb - va;
    });
    if (onlyRanked) return rows.slice(0, topN);
    return rows;
  }, [config.rows, ranks, metric, onlyRanked, topN]);

  return (
    <Shell>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Cap universe · {config.size}</p>
      <h1 className="mt-1 font-display text-4xl">{config.title}</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">{config.subtitle}</p>
      <p className="mt-1 text-xs text-subtle">
        스냅샷 {config.asOf} · 목표 {config.targetCount}×{config.equalWeightPct}% · 종목 {config.rows.length}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {CAP_CONFIGS.map((c) => (
          <Link
            key={c.path}
            to={c.path}
            className={`rounded-sm border px-3 py-1.5 text-xs ${
              c.path === config.path ? "border-fg text-fg" : "border-border text-muted hover:text-fg"
            }`}
          >
            {c.navLabel}
          </Link>
        ))}
      </div>

      <Panel className="mt-6 border-warn/30 bg-[color-mix(in_oklab,var(--color-warn)_8%,var(--color-bg-elevated))]">
        <p className="text-sm font-medium text-fg">리밸런싱</p>
        {window ? (
          <p className="mt-1 text-sm text-muted">
            현재 창: <span className="text-warn">{window.id.toUpperCase()}</span> · {window.window}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">분기 실적 공시 후 창에서 재스크리닝.</p>
        )}
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted">
          {config.caveats.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </Panel>

      <h2 className="mt-10 font-display text-2xl">캔퀀트 순위 분류</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        유니버스 전 종목에 서버 분석(하이브리드·울트라·성장가치·슈퍼가치·CANSLIM)을 돌린 뒤 선택한 지표로 정렬합니다.
      </p>
      <Panel className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">지표</span>
          {RANK_METRICS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMetric(m.id)}
              className={`rounded-sm border px-2.5 py-1 text-xs ${
                metric === m.id ? "border-fg text-fg" : "border-border text-muted hover:text-fg"
              }`}
              title={m.hint}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-subtle">{RANK_METRICS.find((m) => m.id === metric)?.hint}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void runRank()}
            className="rounded-sm bg-fg px-4 py-2 text-sm text-bg disabled:opacity-50"
          >
            {busy ? `산출 중 ${progress.done}/${progress.total}` : "캔퀀트 순위 산출"}
          </button>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={onlyRanked} onChange={(e) => setOnlyRanked(e.target.checked)} />
            상위만 표시
          </label>
          <label className="flex items-center gap-1 text-xs text-muted">
            Top
            <input
              type="number"
              min={5}
              max={50}
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value) || 20)}
              className="w-14 rounded border border-border bg-bg px-1 py-0.5 text-fg"
            />
          </label>
        </div>
        {busy ? (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${progress.total ? (100 * progress.done) / progress.total : 0}%` }}
            />
          </div>
        ) : null}
        {rankError ? <p className="mt-2 text-xs text-down">{rankError}</p> : null}
        <p className="mt-2 text-xs text-subtle">
          판정: strong≥72 · buy≥58 · avoid<42. 순위는 연구용이며 매수 신호가 아닙니다.
        </p>
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

      <h2 className="mt-12 font-display text-2xl">
        유니버스 {onlyRanked && Object.keys(ranks).length ? `· ${metric} Top ${topN}` : ""}
      </h2>
      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-bg-elevated text-xs text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">코드</th>
              <th className="px-3 py-2 font-medium">종목</th>
              <th className="px-3 py-2 font-medium">하이브리드</th>
              <th className="px-3 py-2 font-medium">울트라</th>
              <th className="px-3 py-2 font-medium">성장가치</th>
              <th className="px-3 py-2 font-medium">판정</th>
              <th className="px-3 py-2 font-medium">메모</th>
              <th className="px-3 py-2 font-medium">링크</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((s, idx) => {
              const r = ranks[s.code];
              return (
                <tr key={`${s.code}-${s.name}`} className="border-b border-border/60 hover:bg-bg-elevated/50">
                  <td className="px-3 py-2 font-mono text-xs text-muted">{idx + 1}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted">
                    {s.code}
                    {s.codeUncertain ? <span className="ml-1 text-warn">?</span> : null}
                  </td>
                  <td className="px-3 py-2 text-fg">{s.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{fmt(r?.hybrid)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{fmt(r?.ultra)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{fmt(r?.growthValue)}</td>
                  <td className="px-3 py-2 text-xs">
                    {r?.verdict ? (
                      <Tone status={verdictTone(r.verdict)}>{r.verdict}</Tone>
                    ) : r?.error ? (
                      <span className="text-down">err</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="max-w-[200px] px-3 py-2 text-xs text-muted">{s.note ?? s.theme ?? ""}</td>
                  <td className="px-3 py-2">
                    <Link to="/stock/$code" params={{ code: s.code }} className="text-xs text-accent hover:underline">
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
              );
            })}
          </tbody>
        </table>
      </div>

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
            <div className="flex justify-between gap-2">
              <span className="font-mono text-xs uppercase text-muted">{r.id}</span>
              <span className="text-sm text-fg">{r.window}</span>
            </div>
            <p className="mt-1 text-xs text-muted">{r.trigger}</p>
            <ul className="mt-2 list-disc pl-4 text-xs text-muted">
              {r.actions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>

      <h2 className="mt-12 font-display text-2xl">후보·스냅샷 초기화</h2>
      <Panel className="mt-4">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
          {RESET_CHECKLIST.map((c) => (
            <li key={c}>{c}</li>
          ))}
          <li className="text-fg">대형·중형은 universe.ts / 소형은 smallcap-watchlist.ts 를 갱신</li>
        </ol>
      </Panel>

      <p className="mt-8 text-xs text-subtle">
        연구 데스크입니다. 투자 권유가 아니며, 구간별 백테스트 특성이 다릅니다. 손실 한도는 본인 책임입니다.
      </p>
    </Shell>
  );
}

function emptyRank(code: string): RankResult {
  return { code, hybrid: null, ultra: null, growthValue: null, superValue: null, canslim: null, verdict: null };
}

function fmt(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toFixed(0);
}

function verdictTone(v: string): "pass" | "watch" | "fail" | "na" {
  if (v === "strong" || v === "buy") return "pass";
  if (v === "avoid") return "fail";
  if (v === "hold") return "watch";
  return "na";
}
