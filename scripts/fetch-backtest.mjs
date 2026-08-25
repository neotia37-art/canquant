#!/usr/bin/env node
/**
 * Prefetch Yahoo 5y bars for KOSPI50+KOSDAQ50 and write a static snapshot.
 * Self-contained (no TS imports) so Node can run it without the Vite resolver.
 */
import { writeFileSync } from "node:fs";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const KOSPI50 = [
  ["005930", "삼성전자"],
  ["000660", "SK하이닉스"],
  ["402340", "SK스퀘어"],
  ["009150", "삼성전기"],
  ["005380", "현대차"],
  ["373220", "LG에너지솔루션"],
  ["207940", "삼성바이오로직스"],
  ["105560", "KB금융"],
  ["028260", "삼성물산"],
  ["012450", "한화에어로스페이스"],
  ["032830", "삼성생명"],
  ["000270", "기아"],
  ["055550", "신한지주"],
  ["034020", "두산에너빌리티"],
  ["329180", "HD현대중공업"],
  ["012330", "현대모비스"],
  ["068270", "셀트리온"],
  ["006400", "삼성SDI"],
  ["034730", "SK"],
  ["086790", "하나금융지주"],
  ["035420", "NAVER"],
  ["066570", "LG전자"],
  ["010130", "고려아연"],
  ["000810", "삼성화재"],
  ["010120", "LS ELECTRIC"],
  ["042660", "한화오션"],
  ["005490", "POSCO홀딩스"],
  ["009540", "HD한국조선해양"],
  ["298040", "효성중공업"],
  ["267260", "HD현대일렉트릭"],
  ["316140", "우리금융지주"],
  ["096770", "SK이노베이션"],
  ["011200", "HMM"],
  ["017670", "SK텔레콤"],
  ["015760", "한국전력"],
  ["138040", "메리츠금융지주"],
  ["042700", "한미반도체"],
  ["006800", "미래에셋증권"],
  ["051910", "LG화학"],
  ["033780", "KT&G"],
  ["010140", "삼성중공업"],
  ["018260", "삼성에스디에스"],
  ["267250", "HD현대"],
  ["000150", "두산"],
  ["003550", "LG"],
  ["278470", "에이피알"],
  ["024110", "기업은행"],
  ["377300", "카카오페이"],
  ["128940", "한미약품"],
  ["241560", "두산밥캣"],
];

const KOSDAQ50 = [
  ["196170", "알테오젠"],
  ["086520", "에코프로"],
  ["247540", "에코프로비엠"],
  ["277810", "레인보우로보틱스"],
  ["036930", "주성엔지니어링"],
  ["240810", "원익IPS"],
  ["058470", "리노공업"],
  ["028300", "HLB"],
  ["039030", "이오테크닉스"],
  ["214450", "파마리서치"],
  ["087010", "펩트론"],
  ["222800", "심텍"],
  ["298380", "에이비엘바이오"],
  ["403870", "HPSP"],
  ["000250", "삼천당제약"],
  ["319660", "피에스케이"],
  ["108490", "로보티즈"],
  ["141080", "리가켐바이오"],
  ["257720", "실리콘투"],
  ["095340", "ISC"],
  ["440110", "파두"],
  ["145020", "휴젤"],
  ["084370", "유진테크"],
  ["310210", "보로노이"],
  ["214370", "케어젠"],
  ["064760", "티씨케이"],
  ["131290", "티에스이"],
  ["095610", "테스"],
  ["080220", "제주반도체"],
  ["319400", "현대무벡스"],
  ["357780", "솔브레인"],
  ["347850", "디앤디파마텍"],
  ["031980", "피에스케이홀딩스"],
  ["067310", "하나마이크론"],
  ["178320", "서진시스템"],
  ["237690", "에스티팜"],
  ["005290", "동진쎄미켐"],
  ["214150", "클래시스"],
  ["058610", "에스피지"],
  ["226950", "올릭스"],
  ["010170", "대한광통신"],
  ["032820", "우리기술"],
  ["263750", "펄어비스"],
  ["140410", "메지온"],
  ["098460", "고영"],
  ["068760", "셀트리온제약"],
  ["083650", "비에이치아이"],
  ["140860", "파크시스템스"],
  ["089030", "테크윙"],
  ["950160", "코오롱티슈진"],
];

const UNIVERSE = [
  ...KOSPI50.map(([code, name]) => ({ code, name, market: "KOSPI" })),
  ...KOSDAQ50.map(([code, name]) => ({ code, name, market: "KOSDAQ" })),
];

async function yahooBars(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5y&interval=1d`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${symbol}`);
  const raw = await res.json();
  const r = raw.chart?.result?.[0];
  const ts = r?.timestamp ?? [];
  const q = r?.indicators?.quote?.[0];
  const bars = [];
  for (let i = 0; i < ts.length; i++) {
    const c = q?.close?.[i];
    if (c == null || !Number.isFinite(c)) continue;
    bars.push({
      date: new Date(ts[i] * 1000).toISOString().slice(0, 10),
      open: q?.open?.[i] ?? c,
      high: q?.high?.[i] ?? c,
      low: q?.low?.[i] ?? c,
      close: c,
      volume: q?.volume?.[i] ?? 0,
    });
  }
  return bars;
}

function monthKey(d) {
  return d.slice(0, 7);
}

function alignMonthly(series) {
  const months = new Set();
  for (const bars of Object.values(series)) {
    for (const b of bars) months.add(monthKey(b.date));
  }
  const sorted = [...months].sort();
  const lastPx = {};
  for (const [code, bars] of Object.entries(series)) {
    const map = {};
    for (const b of bars) map[monthKey(b.date)] = b.close;
    lastPx[code] = map;
  }
  return { months: sorted, lastPx };
}

function ret(px, m0, m1) {
  const a = px[m0];
  const b = px[m1];
  if (!a || !b) return null;
  return b / a - 1;
}

function maxDrawdown(equity) {
  let peak = -Infinity;
  let mdd = 0;
  for (const x of equity) {
    if (x > peak) peak = x;
    if (peak > 0) mdd = Math.min(mdd, x / peak - 1);
  }
  return mdd;
}

function stats(equity) {
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
  const monthly = [];
  for (let i = 1; i < equity.length; i++) monthly.push(equity[i].value / equity[i - 1].value - 1);
  const avg = monthly.reduce((a, b) => a + b, 0) / monthly.length;
  const sd = Math.sqrt(monthly.reduce((a, b) => a + (b - avg) ** 2, 0) / Math.max(monthly.length - 1, 1));
  const sharpe = sd > 0 ? (avg * 12) / (sd * Math.sqrt(12)) : null;
  const byYear = {};
  for (const e of equity) {
    const y = e.date.slice(0, 4);
    if (!byYear[y]) byYear[y] = { a: e.value, b: e.value };
    byYear[y].b = e.value;
  }
  const yearly = Object.entries(byYear).map(([year, v]) => ({ year, ret: v.b / v.a - 1 }));
  return { cagr, total, mdd, sharpe, years, equity, yearly };
}

function runPriceBacktest(prices, index, names) {
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

  function simulate(pick, timing) {
    let eq = 1;
    const path = [];
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
      const rs = [];
      for (const c of holds) {
        const r = ret(lastPx[c] ?? {}, m, nxt);
        if (r != null) rs.push(r);
      }
      if (rs.length) eq *= 1 + rs.reduce((a, b) => a + b, 0) / rs.length;
    }
    if (months.length) path.push({ date: months.at(-1) + "-28", value: eq });
    return path;
  }

  const rsPick = (i) => {
    const m = months[i];
    const past = months[i - look];
    const scored = codes.map((c) => ({ c, r: ret(lastPx[c] ?? {}, past, m) })).filter((x) => x.r != null);
    scored.sort((a, b) => b.r - a.r);
    return scored.slice(0, 20).map((x) => x.c);
  };

  const valueTiltPick = (i) => {
    const m = months[i];
    const past6 = months[i - 6] ?? months[i - look];
    const scored = codes
      .map((c) => ({ c, r: ret(lastPx[c] ?? {}, past6, m), px: lastPx[c]?.[m] }))
      .filter((x) => x.r != null && x.px != null);
    const byPx = [...scored].sort((a, b) => a.px - b.px);
    const capScore = new Map(byPx.map((x, idx) => [x.c, 1 - idx / byPx.length]));
    scored.sort(
      (a, b) => b.r * 0.55 + (capScore.get(b.c) ?? 0) * 0.45 - (a.r * 0.55 + (capScore.get(a.c) ?? 0) * 0.45),
    );
    return scored.slice(0, 20).map((x) => x.c);
  };

  const mk = (id, name, desc, path) => ({ id, name, desc, ...stats(path) });
  const start = months[look] ?? months[0];
  const end = months.at(-1) ?? "";

  return {
    asOf: new Date().toISOString(),
    universeSize: 100,
    fetched: codes.length,
    start,
    end,
    strategies: [
      mk("bh", "유니버스 동일가중", "코스피50+코스닥50을 매달 동일 비중. 벤치마크.", simulate(() => codes, false)),
      mk("rs", "오닐 선도주 RS20", "12개월 수익률 상위 20종목, 월간 리밸런싱. L(Leader) 단독.", simulate(rsPick, false)),
      mk(
        "rsm",
        "오닐 RS20 + M 타이밍",
        "RS20을 쓰되, 코스피가 3개월 전보다 낮으면 현금. M 규칙의 단순화.",
        simulate(rsPick, true),
      ),
      mk(
        "combo",
        "혼합 (RS + 상대적 소형 + M)",
        "6개월 모멘텀 55% + 유니버스 내 상대적 저가(소형 틸트) 45%, 시장 타이밍 적용.",
        simulate(valueTiltPick, true),
      ),
    ],
    notes: [
      `실가격 ${codes.length}종목, ${start}~${end} 월간 리밸런싱.`,
      "거래비용·세금·슬리피지는 미반영. 실제 수익은 낮아진다.",
      "펀더멘털(PER·분기실적) 시계열이 없어 강환국 울트라의 완전 재현은 아님. 가격 모멘텀·사이즈 틸트·시장 타이밍으로 근사.",
      "유니버스가 시총 상위라 소형주 프리미엄은 거의 없다. 강환국 책의 40~50% 연복리와 직접 비교하면 안 된다.",
      `종목명 예시: ${codes
        .slice(0, 3)
        .map((c) => names[c] ?? c)
        .join(", ")}`,
    ],
  };
}

async function chunked(items, size, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    const part = items.slice(i, i + size);
    out.push(...(await Promise.all(part.map(fn))));
    await new Promise((r) => setTimeout(r, 180));
  }
  return out;
}

const names = {};
const prices = {};
let ok = 0;
let fail = 0;

await chunked(UNIVERSE, 6, async (s) => {
  names[s.code] = s.name;
  try {
    const bars = await yahooBars(`${s.code}.${s.market === "KOSDAQ" ? "KQ" : "KS"}`);
    if (bars.length > 200) {
      prices[s.code] = bars;
      ok += 1;
    } else fail += 1;
  } catch (e) {
    fail += 1;
    console.error("fail", s.code, s.name, e.message);
  }
  if ((ok + fail) % 10 === 0) console.error(`progress ${ok + fail}/${UNIVERSE.length} ok=${ok}`);
});

let index = [];
try {
  index = await yahooBars("^KS11");
} catch (e) {
  console.error("index fail", e.message);
}

const data = runPriceBacktest(prices, index, names);
writeFileSync(new URL("../public/backtest-snapshot.json", import.meta.url), JSON.stringify(data));
console.log(
  JSON.stringify(
    {
      fetched: data.fetched,
      start: data.start,
      end: data.end,
      ok,
      fail,
      strategies: data.strategies.map((s) => ({
        id: s.id,
        cagr: s.cagr,
        total: s.total,
        mdd: s.mdd,
        sharpe: s.sharpe,
      })),
    },
    null,
    2,
  ),
);
