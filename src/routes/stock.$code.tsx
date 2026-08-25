import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell, Panel, Tone } from "@/components/shell";
import { LetterCard, statusLabel } from "@/components/letter-card";
import { PriceChart } from "@/components/price-chart";
import { analyzeStock, grokComment } from "@/lib/api";
import { fmtNum, fmtPct, fmtWon } from "@/lib/utils";
import type { StockReport } from "@/lib/types";

export const Route = createFileRoute("/stock/$code")({ component: StockPage });

const verdictKo = {
  strong: "비중 확대 후보",
  buy: "관심",
  hold: "관망",
  avoid: "회피",
};

function StockPage() {
  const { code } = Route.useParams();
  const [rep, setRep] = useState<StockReport | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ai, setAi] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    setRep(null);
    setErr(null);
    setAi(null);
    analyzeStock({ data: { code } })
      .then(setRep)
      .catch((e: Error) => setErr(e.message || "분석 실패"));
  }, [code]);

  async function askAi() {
    if (!rep) return;
    setAiBusy(true);
    const prompt = `종목 ${rep.snapshot.name}(${rep.snapshot.code}) 하이브리드 ${rep.hybrid?.toFixed(0)} 판정 ${rep.verdict}.
CANSLIM: ${rep.canslim.map((c) => `${c.letter}:${c.score?.toFixed(0)} ${c.summary}`).join(" | ")}
강환국 울트라 ${rep.kang.ultra?.toFixed(0)} 가치 ${rep.kang.valueScore?.toFixed(0)} 성장 ${rep.kang.growthScore?.toFixed(0)}
시장: ${rep.market.headline}
3단락으로 매수 전 체크리스트를 써라.`;
    const r = await grokComment({ data: { prompt } });
    setAiBusy(false);
    if (r.ok) setAi(r.text);
    else setAi(r.error);
  }

  if (err) {
    return (
      <Shell>
        <p className="text-down">{err}</p>
        <Link to="/" className="mt-4 inline-block text-sm text-muted">
          돌아가기
        </Link>
      </Shell>
    );
  }
  if (!rep) {
    return (
      <Shell>
        <p className="font-mono text-sm text-muted">실적·수급·지수를 조합하는 중… {code}</p>
      </Shell>
    );
  }

  const s = rep.snapshot;
  const up = (s.changePct ?? 0) >= 0;

  return (
    <Shell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] text-subtle">
            {s.market} · {s.code}
          </p>
          <h1 className="font-display text-4xl">{s.name}</h1>
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <span className="font-mono text-2xl tabular-nums">{fmtNum(s.price, 0)}</span>
            <Tone status={up ? "up" : "down"}>
              <span className="font-mono tabular-nums">
                {fmtNum(s.change, 0)} ({fmtPct(s.changePct)})
              </span>
            </Tone>
          </div>
        </div>
        <div className="rounded-md border border-border px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-wider text-subtle">Hybrid</p>
          <p className="font-display text-3xl tabular-nums">{rep.hybrid == null ? "—" : Math.round(rep.hybrid)}</p>
          <p className="text-sm text-muted">{verdictKo[rep.verdict]}</p>
        </div>
      </div>

      <p className="mt-4 max-w-3xl text-sm text-muted">{rep.verdictText}</p>

      <div className="mt-6 grid grid-cols-7 gap-1 sm:gap-2">
        {rep.canslim.map((c) => (
          <div key={c.letter} className="rounded-md border border-border bg-bg-elevated px-1 py-2 text-center sm:px-2">
            <p className="font-display text-lg leading-none sm:text-xl">{c.letter}</p>
            <p className="mt-1 font-mono text-[11px] tabular-nums">{c.score == null ? "—" : Math.round(c.score)}</p>
            <Tone status={c.status}>
              <span className="font-mono text-[10px]">{statusLabel[c.status]}</span>
            </Tone>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {[
          ["PER", s.per],
          ["PBR", s.pbr],
          ["EPS", s.eps],
          ["배당%", s.dividendYield],
          ["시총", null as number | null],
          ["외인%", s.foreignRate],
          ["52주최고", s.high52],
          ["목표가", s.targetPrice],
        ].map(([k, v]) => (
          <div key={String(k)} className="rounded-md border border-border bg-bg-elevated px-3 py-2">
            <p className="font-mono text-[11px] text-subtle">{k}</p>
            <p className="font-mono tabular-nums">{k === "시총" ? fmtWon(s.marketCap) : fmtNum(v as number | null, 2)}</p>
          </div>
        ))}
      </div>

      <Panel className="mt-4">
        <h2 className="font-display text-xl">가격</h2>
        <PriceChart bars={rep.bars} />
      </Panel>

      <div className="mt-8">
        <h2 className="font-display text-2xl">CANSLIM 전 항목</h2>
        <p className="mt-1 text-sm text-muted">
          오닐이 말한 일곱 글자를 빠짐없이 점수·체크·원문 취지·보완 해석으로 펼칩니다. C는 전년 동기 대비입니다.
        </p>
        <div className="mt-4 grid gap-3">
          {rep.canslim.map((c) => (
            <LetterCard key={c.letter} item={c} />
          ))}
        </div>
      </div>

      <Panel className="mt-6">
        <h2 className="font-display text-2xl">강환국 팩터</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["가치", rep.kang.valueScore],
            ["퀄리티", rep.kang.qualityScore],
            ["성장", rep.kang.growthScore],
            ["사이즈", rep.kang.sizeScore],
            ["슈퍼가치", rep.kang.superValue],
            ["울트라", rep.kang.ultra],
            ["성장가치", rep.kang.growthValue],
          ].map(([k, v]) => (
            <div key={String(k)}>
              <p className="font-mono text-[11px] text-subtle">{k}</p>
              <p className="font-mono text-lg tabular-nums">{v == null ? "—" : Math.round(v as number)}</p>
            </div>
          ))}
        </div>
        <ul className="mt-4 space-y-1 text-sm text-muted">
          {rep.kang.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        {rep.kang.flags.length ? (
          <ul className="mt-3 space-y-1 text-sm text-warn">
            {rep.kang.flags.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        ) : null}
      </Panel>

      {rep.fundamentals ? (
        <Panel className="mt-4 overflow-x-auto">
          <h2 className="font-display text-xl">기업실적 (네이버, 추정치 제외)</h2>
          <p className="mt-1 text-xs text-subtle">분기 · 전년동기 비교의 원천</p>
          <table className="mt-3 w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-subtle">
                <th className="py-1 font-medium">분기</th>
                {rep.fundamentals.periodsQuarter.map((p) => (
                  <th key={p} className="py-1 font-mono font-normal">
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rep.fundamentals.rows
                .filter((r) => ["매출액", "영업이익", "당기순이익", "ROE"].some((x) => r.label.includes(x)))
                .map((r) => (
                  <tr key={r.label} className="border-t border-border">
                    <td className="py-2">{r.label}</td>
                    {r.quarterly.map((c) => (
                      <td key={c.period} className="py-2 font-mono tabular-nums">
                        {c.value == null ? "—" : fmtNum(c.value, 0)}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-subtle">연간</p>
          <table className="mt-2 w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="text-subtle">
                <th className="py-1 font-medium">연간</th>
                {rep.fundamentals.periodsAnnual.map((p) => (
                  <th key={p} className="py-1 font-mono font-normal">
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rep.fundamentals.rows
                .filter((r) => ["매출액", "영업이익", "당기순이익", "ROE"].some((x) => r.label.includes(x)))
                .map((r) => (
                  <tr key={`a-${r.label}`} className="border-t border-border">
                    <td className="py-2">{r.label}</td>
                    {r.annual.map((c) => (
                      <td key={c.period} className="py-2 font-mono tabular-nums">
                        {c.value == null ? "—" : fmtNum(c.value, 0)}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </Panel>
      ) : null}

      {s.peers.length ? (
        <Panel className="mt-4">
          <h2 className="font-display text-xl">업종 동료 (L)</h2>
          <ul className="mt-3 divide-y divide-border">
            {s.peers.map((p) => (
              <li key={p.code} className="flex items-center justify-between py-2 text-sm">
                <Link to="/stock/$code" params={{ code: p.code }} className="hover:text-accent">
                  {p.name} <span className="font-mono text-subtle">{p.code}</span>
                </Link>
                <Tone status={(p.changePct ?? 0) >= 0 ? "up" : "down"}>
                  <span className="font-mono">{fmtPct(p.changePct)}</span>
                </Tone>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl">Grok 추가 해석</h2>
          <button
            type="button"
            disabled={aiBusy}
            onClick={askAi}
            className="h-11 rounded-md bg-accent px-4 text-sm font-medium text-accent-fg disabled:opacity-50"
          >
            {aiBusy ? "작성 중…" : "이 종목 해석 요청"}
          </button>
        </div>
        {ai ? (
          <div className="mt-3 whitespace-pre-wrap text-sm text-muted">{ai}</div>
        ) : (
          <p className="mt-2 text-sm text-subtle">버튼은 사용자 동작 시에만 API를 호출합니다.</p>
        )}
      </Panel>
    </Shell>
  );
}
