import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell, Panel } from "@/components/shell";
import { EquityChart } from "@/components/price-chart";
import { runBacktest } from "@/lib/api";
import { fmtPct } from "@/lib/utils";
import type { BacktestResult } from "@/lib/types";

export const Route = createFileRoute("/backtest")({ component: BacktestPage });

const colors = ["var(--color-accent)", "var(--color-up)", "#8aa0b4", "var(--color-warn)"];

function BacktestPage() {
  const [res, setRes] = useState<BacktestResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [source, setSource] = useState<"snapshot" | "live" | null>(null);

  useEffect(() => {
    fetch("/backtest-snapshot.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: BacktestResult | null) => {
        if (d?.strategies?.length) {
          setRes(d);
          setSource("snapshot");
        }
      })
      .catch(() => {});
  }, []);

  async function run() {
    setBusy(true);
    setErr(null);
    try {
      const r = await runBacktest();
      setRes(r);
      setSource("live");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">Universe test</p>
      <h1 className="mt-2 font-display text-4xl">코스피 50 + 코스닥 50</h1>
      <p className="mt-3 max-w-2xl text-muted">
        지금 시점의 시총 상위 100종목 실가격으로 월간 리밸런싱을 돌립니다. 오닐의 선도주(L)와 시장 방향(M), 유니버스 내
        상대적 소형 틸트를 비교합니다. 강환국 책의 소형주 40~50% 연복리와는 유니버스가 다릅니다.
      </p>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="mt-6 h-12 rounded-md bg-accent px-6 font-medium text-accent-fg disabled:opacity-50"
      >
        {busy ? "약 100종목 시세를 수집하는 중 (최초 1~2분)…" : res ? "실시간으로 다시 계산" : "백테스트 실행"}
      </button>
      {source === "snapshot" ? (
        <p className="mt-2 text-xs text-subtle">저장된 스냅샷을 먼저 보여 줍니다. 버튼을 누르면 시세를 다시 받습니다.</p>
      ) : null}
      {err ? <p className="mt-3 text-sm text-down">{err}</p> : null}

      {res ? (
        <div className="mt-8 space-y-6">
          <p className="text-sm text-muted">
            {res.start} ~ {res.end} · 수집 {res.fetched}종목 / 목표 {res.universeSize}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {res.strategies.map((s) => (
              <Panel key={s.id}>
                <h2 className="font-display text-xl">{s.name}</h2>
                <p className="mt-1 text-sm text-muted">{s.desc}</p>
                <dl className="mt-4 grid grid-cols-2 gap-2 font-mono text-sm tabular-nums">
                  <div>
                    <dt className="text-subtle">CAGR</dt>
                    <dd>{fmtPct((s.cagr ?? 0) * 100)}</dd>
                  </div>
                  <div>
                    <dt className="text-subtle">누적</dt>
                    <dd>{fmtPct((s.total ?? 0) * 100)}</dd>
                  </div>
                  <div>
                    <dt className="text-subtle">MDD</dt>
                    <dd className="text-down">{fmtPct((s.mdd ?? 0) * 100)}</dd>
                  </div>
                  <div>
                    <dt className="text-subtle">Sharpe</dt>
                    <dd>{s.sharpe == null ? "—" : s.sharpe.toFixed(2)}</dd>
                  </div>
                </dl>
              </Panel>
            ))}
          </div>
          <Panel>
            <h2 className="font-display text-xl">자산곡선 (시작=100)</h2>
            <EquityChart
              series={res.strategies.map((s, i) => ({
                id: s.id,
                name: s.name,
                color: colors[i % colors.length],
                points: s.equity,
              }))}
            />
          </Panel>
          {res.strategies[0]?.yearly?.length ? (
            <Panel className="overflow-x-auto">
              <h2 className="font-display text-xl">연도별 수익률</h2>
              <table className="mt-3 w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="text-subtle">
                    <th className="py-1 font-medium">연도</th>
                    {res.strategies.map((s) => (
                      <th key={s.id} className="py-1 font-normal">
                        {s.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {res.strategies[0].yearly.map((y, i) => (
                    <tr key={y.year} className="border-t border-border font-mono tabular-nums">
                      <td className="py-2">{y.year}</td>
                      {res.strategies.map((s) => (
                        <td key={s.id} className="py-2">
                          {fmtPct((s.yearly[i]?.ret ?? 0) * 100)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          ) : null}
          <Panel>
            <h2 className="font-display text-xl">해석</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
              {res.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
              <li>
                이 구간은 한국 대형·성장주 강세장이었습니다. 동일가중이 이미 연 50%대를 낸 것은 전략 알파가 아니라 유니버스
                효과에 가깝습니다.
              </li>
              <li>
                오닐 RS20이 동일가중을 이긴 것은 L(선도주)이 이 유니버스에서 유효했다는 뜻입니다. M 타이밍은 상승장을
                일부 현금으로 비워 CAGR을 낮췄습니다 — 약세장 방어용이지, 강세장 수익 극대화용이 아닙니다.
              </li>
              <li>
                상위 대형주에서는 소형주 퀀트의 알파가 축소됩니다. 강환국 울트라·성장가치를 이 숫자와 비교하면 안 됩니다.
              </li>
            </ul>
          </Panel>
        </div>
      ) : (
        <Panel className="mt-8">
          <h2 className="font-display text-xl">설계</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>벤치마크: 100종목 월간 동일가중</li>
            <li>오닐 RS20: 12개월 수익률 상위 20</li>
            <li>RS20+M: 코스피 3개월 모멘텀이 음수면 현금</li>
            <li>혼합: 6개월 RS + 상대적 저가(사이즈 틸트) + M</li>
          </ul>
        </Panel>
      )}
    </Shell>
  );
}
