import { maxDrawdown } from "./utils";
import type { BacktestResult, BacktestStrategy, Bar } from "./types";

function monthKey(d: string) {
  return d.slice(0, 7);
}

function alignMonthly(series: Record<string, Bar[]>) {
  const months = new Set<string>();
  for (const bars of Object.values(series)) {
    for (const b of bars) months.add(monthKey(b.date));
  }
  const sorted = [...months].sort();
  const lastPx: Record<string, Record<string, number>> = {};
  for (const [code, bars] of Object.entries(series)) {
    const map: Record<string, number> = {};
    for (const b of bars) map[monthKey(b.date)] = b.close;
    lastPx[code] = map;
  }
  return { months: sorted, lastPx };
}

function ret(px: Record<string, number>, m0: string, m1: string) {
  const a = px[m0];
  const b = px[m1];
  if (!a || !b) return null;
  return b / a - 1;
}

function stats(equity: { date: string; value: number }[]): Omit<BacktestStrategy, "id" | "name" | "desc"> {
  if (equity.length < 3) {
    return { cagr: null, total: null, mdd: null, sharpe: null, years: null, equity, yearly: [] };
  }
  const start = equity[0].value;
  const end = equity[equity.length - 1].value;
  const years =
    (new Date(equity[equity.length - 1].date).getTime() - new Date(equity[0].date).getTime()) /
    (365.25 * 24 * 3600 * 1000);
  const total = end / start - 1;
  const cagr = years > 0 && start > 0 ? (end / start) ** (1 / years) - 1 : null;
  const mdd = maxDrawdown(equity.map((e) => e.value));
  const monthly: number[] = [];
  for (let i = 1; i < equity.length; i++) {
    monthly.push(equity[i].value / equity[i - 1].value - 1);
  }
  const avg = monthly.reduce((a, b) => a + b, 0) / monthly.length;
  const sd = Math.sqrt(monthly.reduce((a, b) => a + (b - avg) ** 2, 0) / Math.max(monthly.length - 1, 1));
  const sharpe = sd > 0 ? (avg * 12) / (sd * Math.sqrt(12)) : null;
  const byYear: Record<string, { a: number; b: number }> = {};
  for (const e of equity) {
    const y = e.date.slice(0, 4);
    if (!byYear[y]) byYear[y] = { a: e.value, b: e.value };
    byYear[y].b = e.value;
  }
  const yearly = Object.entries(byYear).map(([year, v]) => ({ year, ret: v.b / v.a - 1 }));
  return { cagr, total, mdd, sharpe, years, equity, yearly };
}

export function runPriceBacktest(
  prices: Record<string, Bar[]>,
  index: Bar[],
  names: Record<string, string>,
): BacktestResult {
  const { months, lastPx } = alignMonthly({ ...prices, __IDX__: index });
  const idx = lastPx.__IDX__ ?? {};
  const codes = Object.keys(prices);
  const look = 12;
  if (months.length < look + 6) {
    return {
      asOf: new Date().toISOString(),
      universeSize: codes.length,
      fetched: codes.length,
      start: months[0] ?? "",
      end: months.at(-1) ?? "",
      strategies: [],
      notes: ["시계열이 짧아 백테스트를 계산하지 못했습니다."],
    };
  }

  function simulate(
    pick: (mIdx: number) => string[],
    timing: boolean,
  ): { date: string; value: number }[] {
    let eq = 1;
    const path: { date: string; value: number }[] = [];
    for (let i = look; i < months.length - 1; i++) {
      const m = months[i];
      const nxt = months[i + 1];
      const idxNow = idx[m];
      const idxPast = idx[months[i - 3]] ?? idx[months[Math.max(0, i - 2)]];
      const riskOn = !timing || (idxNow != null && idxPast != null && idxNow >= idxPast);
      path.push({ date: m + "-28", value: eq });
      if (!riskOn) continue;
      const holds = pick(i);
      if (!holds.length) continue;
      const rs: number[] = [];
      for (const c of holds) {
        const r = ret(lastPx[c] ?? {}, m, nxt);
        if (r != null) rs.push(r);
      }
      if (rs.length) eq *= 1 + rs.reduce((a, b) => a + b, 0) / rs.length;
    }
    if (months.length) path.push({ date: months.at(-1)! + "-28", value: eq });
    return path;
  }

  const rsPick = (i: number) => {
    const m = months[i];
    const past = months[i - look];
    const scored = codes
      .map((c) => ({ c, r: ret(lastPx[c] ?? {}, past, m) }))
      .filter((x) => x.r != null) as { c: string; r: number }[];
    scored.sort((a, b) => b.r - a.r);
    return scored.slice(0, 20).map((x) => x.c);
  };

  const valueTiltPick = (i: number) => {
    const m = months[i];
    const past6 = months[i - 6] ?? months[i - look];
    const scored = codes
      .map((c) => {
        const r = ret(lastPx[c] ?? {}, past6, m);
        const px = lastPx[c]?.[m];
        return { c, r, px };
      })
      .filter((x) => x.r != null && x.px != null) as { c: string; r: number; px: number }[];
    const byPx = [...scored].sort((a, b) => a.px - b.px);
    const capScore = new Map(byPx.map((x, idx) => [x.c, 1 - idx / byPx.length]));
    scored.sort((a, b) => b.r * 0.55 + (capScore.get(b.c) ?? 0) * 0.45 - (a.r * 0.55 + (capScore.get(a.c) ?? 0) * 0.45));
    return scored.slice(0, 20).map((x) => x.c);
  };

  const eqPick = (_i: number) => codes;

  const mk = (
    id: string,
    name: string,
    desc: string,
    path: { date: string; value: number }[],
  ): BacktestStrategy => ({ id, name, desc, ...stats(path) });

  const bh = simulate(eqPick, false);
  const rs = simulate(rsPick, false);
  const rsM = simulate(rsPick, true);
  const combo = simulate(valueTiltPick, true);

  const start = months[look] ?? months[0];
  const end = months.at(-1) ?? "";

  return {
    asOf: new Date().toISOString(),
    universeSize: 100,
    fetched: codes.length,
    start,
    end,
    strategies: [
      mk("bh", "유니버스 동일가중", "코스피50+코스닥50을 매달 동일 비중. 벤치마크.", bh),
      mk(
        "rs",
        "오닐 선도주 RS20",
        "12개월 수익률 상위 20종목, 월간 리밸런싱. L(Leader) 단독.",
        rs,
      ),
      mk(
        "rsm",
        "오닐 RS20 + M 타이밍",
        "RS20을 쓰되, 코스피가 3개월 전보다 낮으면 현금. M 규칙의 단순화.",
        rsM,
      ),
      mk(
        "combo",
        "혼합 (RS + 상대적 소형 + M)",
        "6개월 모멘텀 55% + 유니버스 내 상대적 저가(소형 틸트) 45%, 시장 타이밍 적용. 대형주 유니버스에서 강환국 사이즈를 흉내.",
        combo,
      ),
    ],
    notes: [
      `실가격 ${codes.length}종목, ${start}~${end} 월간 리밸런싱.`,
      "거래비용·세금·슬리피지는 미반영. 실제 수익은 낮아진다.",
      "펀더멘털(PER·분기실적) 시계열이 없어 강환국 울트라의 완전 재현은 아님. 가격 모멘텀·사이즈 틸트·시장 타이밍으로 근사.",
      "유니버스가 시총 상위라 소형주 프리미엄은 거의 없다. 강환국 책의 40~50% 연복리와 직접 비교하면 안 된다.",
      "지금 시점의 시총 상위 100종목으로 과거를 돌리므로 생존편향이 있다. 당시 상위였다가 탈락한 종목은 빠져 수익이 과장된다.",
      `종목명 예시: ${codes
        .slice(0, 3)
        .map((c) => names[c] ?? c)
        .join(", ")}`,
    ],
  };
}
