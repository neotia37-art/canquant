import { createServerFn } from "@tanstack/react-start";
import { UNIVERSE, lookupUniverse, type Market, yahooSymbol } from "./universe";
import { parseKoreanMoney, parseLooseNumber, padCode, isFuturePeriod } from "./utils";
import { buildIndexState, buildMarketDesk, hybridScore, scoreCanslim, scoreKang } from "./score";
import { runPriceBacktest } from "./backtest-engine";
import type { Bar, Fundamentals, MarketDesk, Snapshot, StatementRow, StockReport, BacktestResult } from "./types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

async function fetchText(url: string, timeout = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json,text/html,*/*" },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

async function fetchJson<T>(url: string, timeout = 12000): Promise<T> {
  const text = await fetchText(url, timeout);
  return JSON.parse(text) as T;
}

function num(v: unknown) {
  if (typeof v === "number") return v;
  return parseLooseNumber(String(v ?? ""));
}

type NaverBasic = {
  itemCode: string;
  stockName: string;
  closePrice: string;
  compareToPreviousClosePrice: string;
  fluctuationsRatio: string;
  stockExchangeName?: string;
  marketStatus?: string;
};

type NaverInfo = { code: string; key: string; value: string };
type NaverInteg = {
  stockName: string;
  itemCode: string;
  totalInfos?: NaverInfo[];
  consensusInfo?: { recommMean?: string; priceTargetMean?: string };
  industryCompareInfo?: {
    itemCode: string;
    stockName: string;
    fluctuationsRatio?: string;
    closePrice?: string;
  }[];
};

type NaverPrice = {
  localTradedAt: string;
  closePrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  accumulatedTradingVolume?: string;
};

function infoMap(infos: NaverInfo[] = []) {
  const m = new Map<string, string>();
  for (const i of infos) m.set(i.code, i.value);
  return m;
}

function toBars(rows: NaverPrice[]): Bar[] {
  return rows
    .map((r) => ({
      date: r.localTradedAt.slice(0, 10),
      open: num(r.openPrice) ?? 0,
      high: num(r.highPrice) ?? 0,
      low: num(r.lowPrice) ?? 0,
      close: num(r.closePrice) ?? 0,
      volume: num(r.accumulatedTradingVolume) ?? 0,
    }))
    .filter((b) => b.close > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function naverBasic(code: string) {
  return fetchJson<NaverBasic>(`https://m.stock.naver.com/api/stock/${code}/basic`);
}

async function naverInteg(code: string) {
  return fetchJson<NaverInteg>(`https://m.stock.naver.com/api/stock/${code}/integration`);
}

async function naverPrices(code: string, pageSize = 60) {
  const size = Math.min(pageSize, 60);
  const pages: NaverPrice[] = [];
  for (let page = 1; page <= 8; page++) {
    const chunk = await fetchJson<NaverPrice[]>(
      `https://m.stock.naver.com/api/stock/${code}/price?pageSize=${size}&page=${page}`,
    );
    if (!Array.isArray(chunk) || !chunk.length) break;
    pages.push(...chunk);
    if (chunk.length < size) break;
  }
  return toBars(pages);
}

async function indexBasic(sym: "KOSPI" | "KOSDAQ") {
  return fetchJson<{
    stockName: string;
    closePrice: string;
    fluctuationsRatio: string;
  }>(`https://m.stock.naver.com/api/index/${sym}/basic`);
}

async function indexPrices(sym: "KOSPI" | "KOSDAQ") {
  const rows: NaverPrice[] = [];
  for (let page = 1; page <= 12; page++) {
    const chunk = await fetchJson<NaverPrice[]>(
      `https://m.stock.naver.com/api/index/${sym}/price?pageSize=60&page=${page}`,
    );
    if (!Array.isArray(chunk) || !chunk.length) break;
    rows.push(...chunk);
    if (chunk.length < 60) break;
  }
  return toBars(rows);
}

async function yahooBars(symbol: string): Promise<Bar[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5y&interval=1d`;
  const raw = await fetchJson<{
    chart?: {
      result?: {
        timestamp?: number[];
        indicators?: {
          quote?: {
            close?: (number | null)[];
            volume?: (number | null)[];
            open?: (number | null)[];
            high?: (number | null)[];
            low?: (number | null)[];
          }[];
        };
      }[];
    };
  }>(url);
  const r = raw.chart?.result?.[0];
  const ts = r?.timestamp ?? [];
  const q = r?.indicators?.quote?.[0];
  const bars: Bar[] = [];
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

function mergeVolume(price: Bar[], volSrc: Bar[]): Bar[] {
  if (!volSrc.length) return price;
  const map = new Map(volSrc.map((b) => [b.date, b.volume]));
  return price.map((b) => ({ ...b, volume: map.get(b.date) || b.volume }));
}

async function indexBarsWithVolume(sym: "KOSPI" | "KOSDAQ"): Promise<Bar[]> {
  const yahooSym = sym === "KOSPI" ? "^KS11" : "^KQ11";
  const [naver, yahoo] = await Promise.all([indexPrices(sym).catch(() => [] as Bar[]), yahooBars(yahooSym).catch(() => [] as Bar[])]);
  if (yahoo.length >= 200 && naver.length) return mergeVolume(naver.length >= 60 ? naver : yahoo, yahoo);
  if (yahoo.length >= 200) return yahoo;
  return naver;
}

function parseMainHtml(html: string): Fundamentals | null {
  const section = html.split('class="section cop_analysis"')[1];
  if (!section) return null;
  const table = section.split("</table>")[0];
  if (!table) return null;
  const thead = table.split("</thead>")[0] ?? table;
  const periods = [...thead.matchAll(/20\d{2}\.\d{2}/g)].map((m) => m[0]);
  if (periods.length < 4) return null;
  const annual = periods.slice(0, 4);
  const quarterly = periods.slice(4, 10);
  const labels = ["매출액", "영업이익", "당기순이익", "ROE", "부채비율", "유보율", "EPS", "PER", "PBR"];
  const rows: StatementRow[] = [];
  for (const label of labels) {
    const re = new RegExp(`<strong>${label}[^<]*</strong>[\\s\\S]*?</tr>`);
    const block = table.match(re)?.[0];
    if (!block) continue;
    const nums = [...block.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => {
      const t = m[1].replace(/<[^>]+>/g, "").replace(/,/g, "").trim();
      if (!t || t === "-") return null;
      const n = Number(t);
      return Number.isFinite(n) ? n : null;
    });
    rows.push({
      label,
      annual: annual.map((p, i) => ({ period: p, value: isFuturePeriod(p) ? null : (nums[i] ?? null) })),
      quarterly: quarterly.map((p, i) => ({
        period: p,
        value: isFuturePeriod(p) ? null : (nums[i + annual.length] ?? null),
      })),
    });
  }
  if (!rows.length) return null;
  return { periodsAnnual: annual, periodsQuarter: quarterly, rows };
}

async function fetchFundamentals(code: string): Promise<Fundamentals | null> {
  try {
    const html = await fetchText(`https://finance.naver.com/item/main.naver?code=${code}`, 10000);
    return parseMainHtml(html);
  } catch {
    return null;
  }
}

function marketOf(code: string, exchangeName?: string): Market {
  const u = UNIVERSE.find((s) => s.code === code);
  if (u) return u.market;
  if (exchangeName?.includes("코스닥") || exchangeName === "KOSDAQ") return "KOSDAQ";
  return "KOSPI";
}

async function buildSnapshot(code: string): Promise<Snapshot> {
  const [basic, integ] = await Promise.all([naverBasic(code), naverInteg(code)]);
  const im = infoMap(integ.totalInfos);
  const market = marketOf(code, basic.stockExchangeName);
  return {
    code,
    name: basic.stockName || integ.stockName,
    market,
    price: num(basic.closePrice),
    change: num(basic.compareToPreviousClosePrice),
    changePct: num(basic.fluctuationsRatio),
    open: num(im.get("openPrice")),
    high: num(im.get("highPrice")),
    low: num(im.get("lowPrice")),
    volume: num(im.get("accumulatedTradingVolume")),
    value: parseKoreanMoney(im.get("accumulatedTradingValue") ?? ""),
    marketCap: parseKoreanMoney(im.get("marketValue") ?? ""),
    foreignRate: num(im.get("foreignRate")),
    high52: num(im.get("highPriceOf52Weeks")),
    low52: num(im.get("lowPriceOf52Weeks")),
    per: num(im.get("per")),
    eps: num(im.get("eps")),
    cnsPer: num(im.get("cnsPer")),
    cnsEps: num(im.get("cnsEps")),
    pbr: num(im.get("pbr")),
    bps: num(im.get("bps")),
    dividendYield: num(im.get("dividendYieldRatio")),
    dividend: num(im.get("dividend")),
    consensusMean: num(integ.consensusInfo?.recommMean),
    targetPrice: num(integ.consensusInfo?.priceTargetMean),
    peers: (integ.industryCompareInfo ?? []).slice(0, 8).map((p) => ({
      code: p.itemCode,
      name: p.stockName,
      changePct: num(p.fluctuationsRatio),
      price: num(p.closePrice),
    })),
  };
}

let marketCache: { at: number; data: MarketDesk } | null = null;

async function loadMarketDesk(): Promise<MarketDesk> {
  if (marketCache && Date.now() - marketCache.at < 60_000) return marketCache.data;
  const [kb, qb, kp, qp] = await Promise.all([
    indexBasic("KOSPI"),
    indexBasic("KOSDAQ"),
    indexBarsWithVolume("KOSPI"),
    indexBarsWithVolume("KOSDAQ"),
  ]);
  const kospi = buildIndexState("코스피", num(kb.closePrice), num(kb.fluctuationsRatio), kp);
  const kosdaq = buildIndexState("코스닥", num(qb.closePrice), num(qb.fluctuationsRatio), qp);
  const data = buildMarketDesk(kospi, kosdaq);
  marketCache = { at: Date.now(), data };
  return data;
}

export const getMarket = createServerFn({ method: "GET" }).handler(async () => {
  return loadMarketDesk();
});

export const analyzeStock = createServerFn({ method: "POST" })
  .validator((d: { code: string }) => ({ code: padCode(d.code) }))
  .handler(async ({ data }): Promise<StockReport> => {
    const code = data.code;
    const [snap, rawBars, fund, market] = await Promise.all([
      buildSnapshot(code),
      naverPrices(code, 60).catch(() => [] as Bar[]),
      fetchFundamentals(code),
      loadMarketDesk(),
    ]);
    let bars = rawBars;
    if (bars.length < 220) {
      try {
        const y = await yahooBars(yahooSymbol(code, snap.market));
        if (y.length > bars.length) bars = y;
      } catch {
        /* keep whatever we have */
      }
    }
    const kang = scoreKang(snap, fund);
    const canslim = scoreCanslim(snap, bars, fund, market, null);
    const hybrid = hybridScore(canslim, kang, market);
    let verdict: StockReport["verdict"] = "hold";
    if ((hybrid ?? 0) >= 72 && market.overall !== "fail") verdict = "strong";
    else if ((hybrid ?? 0) >= 58) verdict = "buy";
    else if ((hybrid ?? 0) < 42) verdict = "avoid";
    const verdictText =
      verdict === "strong"
        ? "CANSLIM과 퀀트가 동시에 열리는 구간. 그래도 분할 매수·손절 규칙은 지킨다."
        : verdict === "buy"
          ? "후보군. 약한 알파벳(특히 M·C)을 확인하고 비중을 낮게."
          : verdict === "avoid"
            ? "오닐 기준 탈락이 많다. 싸다는 이유만으로 담지 말 것."
            : "관망. 피벗·실적 가속·시장 방향 중 빈칸을 채울 때까지 기다린다.";
    return { snapshot: snap, bars, fundamentals: fund, canslim, kang, hybrid, verdict, verdictText, market };
  });

type SearchItem = {
  code: string;
  name: string;
  typeCode?: string;
  category?: string;
  isEtf?: boolean;
};

export const searchTickers = createServerFn({ method: "GET" })
  .validator((d: { q?: string }) => ({ q: String(d?.q ?? "") }))
  .handler(async ({ data }) => {
    const q = data.q.trim();
    if (!q) return UNIVERSE.slice(0, 12);
    const local = lookupUniverse(q);
    try {
      const json = await fetchJson<{
        isSuccess?: boolean;
        result?: { items?: SearchItem[] };
      }>(`https://m.stock.naver.com/front-api/search/autoComplete?query=${encodeURIComponent(q)}&target=stock`);
      const mapped = (json.result?.items ?? [])
        .filter(
          (i) =>
            i.category === "stock" &&
            !i.isEtf &&
            /^\d{6}$/.test(i.code) &&
            (i.typeCode === "KOSPI" || i.typeCode === "KOSDAQ"),
        )
        .map((i) => ({
          code: i.code,
          name: i.name,
          market: (i.typeCode === "KOSDAQ" ? "KOSDAQ" : "KOSPI") as Market,
        }));
      const seen = new Set<string>();
      const out: { code: string; name: string; market: Market }[] = [];
      for (const s of [...mapped, ...local]) {
        if (seen.has(s.code)) continue;
        seen.add(s.code);
        out.push(s);
      }
      return out.slice(0, 20);
    } catch {
      return local.slice(0, 20);
    }
  });

type CacheBT = { at: number; data: BacktestResult };
let btCache: CacheBT | null = null;

export const runBacktest = createServerFn({ method: "POST" }).handler(async () => {
  if (btCache && Date.now() - btCache.at < 1000 * 60 * 60 * 12) return btCache.data;
  const names: Record<string, string> = {};
  const prices: Record<string, Bar[]> = {};
  const list = UNIVERSE;
  const chunk = 8;
  for (let i = 0; i < list.length; i += chunk) {
    const part = list.slice(i, i + chunk);
    await Promise.all(
      part.map(async (s) => {
        names[s.code] = s.name;
        try {
          const bars = await yahooBars(yahooSymbol(s.code, s.market));
          if (bars.length > 200) prices[s.code] = bars;
        } catch {
          try {
            const bars = await naverPrices(s.code, 60);
            if (bars.length > 200) prices[s.code] = bars;
          } catch {
            /* skip */
          }
        }
      }),
    );
  }
  let index = marketCache?.data.kospi.bars ?? [];
  if (index.length < 200) {
    try {
      index = await yahooBars("^KS11");
    } catch {
      index = await indexPrices("KOSPI");
    }
  }
  const data = runPriceBacktest(prices, index, names);
  btCache = { at: Date.now(), data };
  return data;
});

export const grokComment = createServerFn({ method: "POST" })
  .validator((d: { prompt: string }) => d)
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "AI 해석을 이 환경에서 쓸 수 없습니다." };
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 900,
        messages: [
          {
            role: "system",
            content:
              "너는 한국 주식 리서치 애널리스트다. 윌리엄 오닐 CANSLIM과 강환국 퀀트를 모두 쓰되, 과장을 금한다. 한국어로 간결히. 매수 강요 금지. 리스크를 명시.",
          },
          { role: "user", content: data.prompt },
        ],
      }),
    });
    if (!res.ok) return { ok: false as const, error: `xAI ${res.status}` };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return { ok: true as const, text: body.choices?.[0]?.message?.content ?? "" };
  });
