import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Shell, Panel, Tone } from "@/components/shell";
import { PriceChart } from "@/components/price-chart";
import { getMarket, searchTickers } from "@/lib/api";
import { UNIVERSE } from "@/lib/universe";
import { fmtNum, fmtPct, padCode } from "@/lib/utils";
import type { MarketDesk } from "@/lib/types";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState(UNIVERSE.slice(0, 8));
  const [market, setMarket] = useState<MarketDesk | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    getMarket()
      .then(setMarket)
      .catch((e: Error) => setErr(e.message));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      searchTickers({ data: { q } })
        .then((r) => setHits(r.slice(0, 12)))
        .catch(() => {});
    }, 160);
    return () => clearTimeout(t);
  }, [q]);

  function go(e: FormEvent) {
    e.preventDefault();
    const first = hits[0];
    const code = first?.code ?? padCode(q);
    if (code) nav({ to: "/stock/$code", params: { code } });
  }

  return (
    <Shell>
      <div className="max-w-3xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">Korean equity desk</p>
        <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">
          오닐의 규칙으로 사고,
          <br />
          강환국의 숫자로 검증한다.
        </h1>
        <p className="mt-4 max-w-xl text-muted">
          종목 코드나 이름을 넣으면 CANSLIM 7개 조건과 한국형 가치·퀄리티·성장 팩터, 시장 방향(M)을 한 화면에
          해석합니다.
        </p>
      </div>

      <form onSubmit={go} className="mt-8 flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="삼성전자, 005930, 알테오젠…"
            className="h-12 w-full rounded-md border border-border bg-bg-elevated pr-3 pl-10 text-fg outline-none ring-accent/40 focus:ring-2"
          />
        </label>
        <button
          type="submit"
          className="h-12 rounded-md bg-accent px-6 font-medium text-accent-fg transition-transform duration-150 active:scale-[0.98]"
        >
          분석
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {hits.slice(0, 8).map((h) => (
          <button
            key={h.code}
            type="button"
            onClick={() => nav({ to: "/stock/$code", params: { code: h.code } })}
            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:text-fg"
          >
            {h.name} <span className="font-mono text-subtle">{h.code}</span>
          </button>
        ))}
      </div>

      {err ? <p className="mt-6 text-sm text-down">시장 데이터를 불러오지 못했습니다. {err}</p> : null}

      {market ? (
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <IndexPanel state={market.kospi} />
          <IndexPanel state={market.kosdaq} />
        </div>
      ) : (
        <p className="mt-10 text-sm text-muted">지수와 이동평균을 불러오는 중…</p>
      )}

      {market ? (
        <Panel className="mt-4">
          <p className="font-mono text-[11px] uppercase tracking-wider text-subtle">M · Market</p>
          <h2 className="mt-1 font-display text-2xl">{market.headline}</h2>
          <p className="mt-3 text-sm text-muted">{market.commentary}</p>
          <p className="mt-3 text-sm text-fg/80">{market.oneilM}</p>
          <p className="mt-2 text-sm text-subtle">{market.season}</p>
        </Panel>
      ) : null}
    </Shell>
  );
}

function IndexPanel({
  state,
}: {
  state: MarketDesk["kospi"];
}) {
  const up = (state.changePct ?? 0) >= 0;
  return (
    <Panel>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl">{state.name}</h2>
        <div className="text-right">
          <p className="font-mono text-lg tabular-nums">{fmtNum(state.price, 2)}</p>
          <Tone status={up ? "up" : "down"}>
            <span className="font-mono text-xs">{fmtPct(state.changePct)}</span>
          </Tone>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted">{state.stage}</p>
      <p className="mt-1 font-mono text-[11px] text-subtle">
        50DMA {fmtNum(state.sma50, 0)} · 200DMA {fmtNum(state.sma200, 0)} · 분배일 {state.distDays25 ?? "—"}
      </p>
      <div className="mt-3">
        <PriceChart bars={state.bars} height={180} />
      </div>
    </Panel>
  );
}
