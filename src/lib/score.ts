import { FINANCE_HOLDING } from "./universe";
import { clamp, isFuturePeriod, mean, parsePeriod, pctChange, sma } from "./utils";
import type {
  Bar,
  Check,
  CheckStatus,
  Fundamentals,
  IndexState,
  KangBlock,
  LetterScore,
  MarketDesk,
  Snapshot,
  StatementRow,
} from "./types";

function statusFromScore(score: number | null): CheckStatus {
  if (score == null) return "na";
  if (score >= 72) return "pass";
  if (score >= 48) return "watch";
  return "fail";
}

function scoreFromThreshold(value: number | null, good: number, great: number, higherBetter = true) {
  if (value == null) return null;
  const v = higherBetter ? value : -value;
  const g = higherBetter ? good : -good;
  const gr = higherBetter ? great : -great;
  if (v >= gr) return clamp(80 + (v - gr), 80, 100);
  if (v >= g) return clamp(55 + ((v - g) / (gr - g || 1)) * 25, 55, 79);
  if (v >= g * 0.4) return clamp(30 + ((v - g * 0.4) / (g * 0.6 || 1)) * 24, 25, 54);
  return clamp(10 + v, 0, 24);
}

function row(f: Fundamentals | null, label: string): StatementRow | undefined {
  if (!f) return undefined;
  return f.rows.find((r) => r.label.includes(label));
}

function usable(arr: { period: string; value: number | null }[]) {
  return arr.filter((x) => x.value != null && !isFuturePeriod(x.period) && !/[Ee]$/.test(x.period) && !x.period.includes("E"));
}

function lastValid(arr: { period?: string; value: number | null }[]) {
  for (let i = arr.length - 1; i >= 0; i--) {
    const p = arr[i];
    if (p.value == null) continue;
    if (p.period && (isFuturePeriod(p.period) || /E/i.test(p.period))) continue;
    return p.value;
  }
  return null;
}

/** 전년 동기 대비. 분기끼리 연속 비교(QoQ)를 YoY로 쓰지 않는다. */
function yoyPair(arr: { period: string; value: number | null }[]) {
  const valid = usable(arr);
  if (!valid.length) {
    return { last: null as number | null, prev: null as number | null, yoy: null as number | null, lastPeriod: "", prevPeriod: "" };
  }
  const last = valid[valid.length - 1];
  const lp = parsePeriod(last.period);
  let prev = null as (typeof last) | null;
  for (let i = valid.length - 2; i >= 0; i--) {
    const pp = parsePeriod(valid[i].period);
    if (lp && pp && pp.m === lp.m && pp.y === lp.y - 1) {
      prev = valid[i];
      break;
    }
  }
  if (!prev && valid.length >= 2 && lp) {
    const cand = valid[valid.length - 2];
    const pp = parsePeriod(cand.period);
    // 연간이거나 결산월이 12개월 전후인 경우만 허용
    if (pp && lp.y - pp.y === 1 && Math.abs(lp.m - pp.m) <= 1) prev = cand;
  }
  return {
    last: last.value,
    prev: prev?.value ?? null,
    yoy: prev?.value != null ? pctChange(prev.value, last.value) : null,
    lastPeriod: last.period,
    prevPeriod: prev?.period ?? "",
  };
}

/** 각 분기의 전년동기 성장률 시계열 — 가속 판단용 */
function yoySeries(arr: { period: string; value: number | null }[]) {
  const valid = usable(arr);
  const g: number[] = [];
  for (const row of valid) {
    const lp = parsePeriod(row.period);
    if (!lp || row.value == null) continue;
    const prev = valid.find((x) => {
      const pp = parsePeriod(x.period);
      return pp && pp.m === lp.m && pp.y === lp.y - 1 && x.value != null;
    });
    if (prev?.value != null) {
      const p = pctChange(prev.value, row.value);
      if (p != null) g.push(p);
    }
  }
  return g;
}

function rsReturn(bars: Bar[], days: number) {
  if (bars.length < days + 1) return null;
  const a = bars[bars.length - 1 - days]?.close;
  const b = bars[bars.length - 1]?.close;
  return pctChange(a, b);
}

function volumeAvg(bars: Bar[], n = 50) {
  const slice = bars.slice(-n);
  return mean(slice.map((b) => b.volume));
}

function distributionDays(bars: Bar[], window = 25) {
  const slice = bars.slice(-window);
  if (!slice.some((b) => b.volume > 0)) return null;
  let n = 0;
  for (let i = 1; i < slice.length; i++) {
    const down = slice[i].close < slice[i - 1].close;
    const heavy = slice[i].volume > slice[i - 1].volume;
    if (down && heavy) n += 1;
  }
  return n;
}

function followThrough(bars: Bar[]) {
  if (bars.length < 10) return false;
  const last10 = bars.slice(-10);
  let downStreak = 0;
  let maxDown = 0;
  for (let i = 1; i < last10.length; i++) {
    if (last10[i].close < last10[i - 1].close) {
      downStreak += 1;
      maxDown = Math.max(maxDown, downStreak);
    } else downStreak = 0;
  }
  const rally: { idx: number; ret: number; volUp: boolean }[] = [];
  for (let i = 1; i < last10.length; i++) {
    const ret = (last10[i].close / last10[i - 1].close - 1) * 100;
    if (ret >= 1.5) {
      rally.push({ idx: i, ret, volUp: last10[i].volume > last10[i - 1].volume });
    }
  }
  return maxDown >= 3 && rally.some((r) => r.idx >= 4 && r.volUp);
}

export function buildIndexState(name: string, price: number | null, changePct: number | null, bars: Bar[]): IndexState {
  const closes = bars.map((b) => b.close);
  const s50 = sma(closes, 50);
  const s200 = sma(closes, 200);
  const sma50 = s50[s50.length - 1] ?? null;
  const sma200 = s200[s200.length - 1] ?? null;
  const last = closes[closes.length - 1] ?? price;
  const above50 = last != null && sma50 != null ? last > sma50 : null;
  const above200 = last != null && sma200 != null ? last > sma200 : null;
  const dist = bars.length ? distributionDays(bars, 25) : null;
  let stage = "데이터 부족";
  if (above50 != null && above200 != null) {
    if (above50 && above200) stage = "상승 추세 (Stage 2 후보)";
    else if (!above50 && above200) stage = "단기 조정";
    else if (above50 && !above200) stage = "회복 시도";
    else stage = "약세 (Stage 4 위험)";
  }
  return {
    name,
    price: last ?? price,
    changePct,
    sma50,
    sma200,
    above50,
    above200,
    distDays25: dist,
    followThrough: bars.length ? followThrough(bars) : null,
    stage,
    bars,
  };
}

export function buildMarketDesk(kospi: IndexState, kosdaq: IndexState): MarketDesk {
  const month = new Date().getMonth() + 1;
  const season =
    month >= 11 || month <= 4
      ? "11~4월 구간 — 강환국 계절성상 한국 주식의 통계적 우위 구간"
      : "5~10월 구간 — 한국 시장 계절성상 평균 수익이 약한 구간";

  const k = kospi.above50 && kospi.above200;
  const q = kosdaq.above50 && kosdaq.above200;
  const distBad = (kospi.distDays25 ?? 0) >= 5 || (kosdaq.distDays25 ?? 0) >= 5;

  let overall: CheckStatus = "watch";
  if (k && q && !distBad) overall = "pass";
  else if (!kospi.above50 && !kospi.above200) overall = "fail";

  const headline =
    overall === "pass"
      ? "시장 방향(M) 우호적 — 개별 종목 매수는 허용 구간"
      : overall === "fail"
        ? "시장 방향(M) 비우호 — 오닐은 현금 비중을 우선"
        : "시장은 혼조 — 선도주만 선별, 추격 매수 금지";

  const commentary = [
    `코스피 ${kospi.stage}. 50일선 ${kospi.above50 ? "위" : kospi.above50 === false ? "아래" : "불명"}, 200일선 ${kospi.above200 ? "위" : kospi.above200 === false ? "아래" : "불명"}.`,
    `코스닥 ${kosdaq.stage}.`,
    `최근 25거래일 분배일(하락+거래량 증가) 코스피 ${kospi.distDays25 ?? "—"}회, 코스닥 ${kosdaq.distDays25 ?? "—"}회. 오닐은 25일 내 5회면 랠리 종료 경고.`,
    kospi.followThrough ? "코스피에서 단기 폴로스루 데이 패턴이 관측됩니다." : "확실한 폴로스루 데이는 아직 아닙니다.",
    season,
  ].join(" ");

  const oneilM =
    "오닐: 종목이 CANSLIM 6개 조건을 통과해도 시장이 꺾이면 3/4는 같이 하락한다. 매수는 확인된 상승장에서만. 분배일이 쌓이면 신규 매수를 멈추고, 약세장에서는 현금을 방어 자산으로 본다.";

  return { kospi, kosdaq, season, overall, headline, commentary, oneilM };
}

function kospiStatus(s: IndexState): CheckStatus {
  if (s.above50 && s.above200) return "pass";
  if (s.above50 === false && s.above200 === false) return "fail";
  return "watch";
}

export function scoreCanslim(
  snap: Snapshot,
  bars: Bar[],
  fund: Fundamentals | null,
  market: MarketDesk,
  peerRs: number | null,
): LetterScore[] {
  const qNP = row(fund, "당기순이익")?.quarterly ?? [];
  const qSales = row(fund, "매출")?.quarterly ?? [];
  const qOP = row(fund, "영업이익")?.quarterly ?? [];
  const aNP = row(fund, "당기순이익")?.annual ?? [];
  const aSales = row(fund, "매출")?.annual ?? [];
  const aROE = row(fund, "ROE")?.annual ?? [];

  const npYoy = yoyPair(qNP);
  const salesYoy = yoyPair(qSales);
  const opYoy = yoyPair(qOP);
  const qGrowths = yoySeries(qNP);
  const accel = qGrowths.length >= 2 ? qGrowths[qGrowths.length - 1] > qGrowths[qGrowths.length - 2] : null;

  const cScoreParts = [
    scoreFromThreshold(npYoy.yoy, 18, 40),
    scoreFromThreshold(salesYoy.yoy, 15, 30),
    accel == null ? null : accel ? 82 : 40,
  ].filter((x) => x != null) as number[];
  const cScore = mean(cScoreParts);

  const yoyLabel = (p: ReturnType<typeof yoyPair>) =>
    p.yoy == null ? "—" : `${p.lastPeriod || "최근"} vs ${p.prevPeriod || "전년"} ${p.yoy.toFixed(1)}%`;

  const cChecks: Check[] = [
    {
      id: "eps-yoy",
      label: "최근 분기 이익 전년동기",
      status: (npYoy.yoy ?? -999) >= 25 ? "pass" : (npYoy.yoy ?? -999) >= 18 ? "watch" : npYoy.yoy == null ? "na" : "fail",
      value: yoyLabel(npYoy),
      note: "오닐 C는 직전 분기가 아니라 전년 같은 분기다. 최소 +18%, 이상적 +25~50% 이상. 이미 확정된 실적만 본다.",
    },
    {
      id: "sales-yoy",
      label: "최근 분기 매출 전년동기",
      status: (salesYoy.yoy ?? -999) >= 25 ? "pass" : (salesYoy.yoy ?? -999) >= 10 ? "watch" : salesYoy.yoy == null ? "na" : "fail",
      value: yoyLabel(salesYoy),
      note: "이익만 뛰고 매출이 정체면 비용 절감·일회성 가능성.",
    },
    {
      id: "op-yoy",
      label: "최근 분기 영업이익 전년동기",
      status: (opYoy.yoy ?? -999) >= 20 ? "pass" : opYoy.yoy == null ? "na" : opYoy.yoy >= 0 ? "watch" : "fail",
      value: yoyLabel(opYoy),
      note: "본업 수익력. 강환국 C(실적 가속)와 겹치는 핵심 축.",
    },
    {
      id: "accel",
      label: "이익 가속(YoY Acceleration)",
      status: accel == null ? "na" : accel ? "pass" : "fail",
      value: accel == null ? "—" : accel ? "가속" : "감속",
      note: "전년동기 성장률이 직전 분기보다 커야 한다. QoQ가 아니라 YoY의 가속. 오닐·강환국 모두 강조.",
    },
  ];

  const aYoy = yoyPair(aNP);
  const aSalesYoy = yoyPair(aSales);
  const roe = lastValid(aROE) ?? (snap.eps && snap.bps ? (snap.eps / snap.bps) * 100 : null);
  const yearsUp = usable(aNP).filter((x) => (x.value ?? 0) > 0).length;
  const aScore = mean(
    [scoreFromThreshold(aYoy.yoy, 15, 30), scoreFromThreshold(roe, 17, 25), yearsUp >= 3 ? 70 : 40].filter(
      (x) => x != null,
    ) as number[],
  );

  const aChecks: Check[] = [
    {
      id: "annual-eps",
      label: "연간 순이익 증가",
      status: (aYoy.yoy ?? -999) >= 25 ? "pass" : (aYoy.yoy ?? 0) > 0 ? "watch" : aYoy.yoy == null ? "na" : "fail",
      value: aYoy.yoy == null ? "—" : `${aYoy.yoy.toFixed(1)}%`,
      note: "최근 3년 연속 증가가 이상적. 한 해라도 큰 적자면 A는 탈락에 가깝다.",
    },
    {
      id: "roe",
      label: "ROE",
      status: (roe ?? 0) >= 17 ? "pass" : (roe ?? 0) >= 10 ? "watch" : roe == null ? "na" : "fail",
      value: roe == null ? "—" : `${roe.toFixed(1)}%`,
      note: "오닐은 17% 이상을 선호. 자본을 얼마나 효율적으로 이익으로 바꾸는가. 추정치·미래 결산월은 제외.",
    },
    {
      id: "annual-sales",
      label: "연간 매출 증가",
      status: (aSalesYoy.yoy ?? 0) >= 10 ? "pass" : aSalesYoy.yoy == null ? "na" : "watch",
      value: aSalesYoy.yoy == null ? "—" : `${aSalesYoy.yoy.toFixed(1)}%`,
      note: "이익만 성장하고 매출이 꺾이면 지속가능성 의심.",
    },
  ];

  const offHigh = snap.price != null && snap.high52 ? (snap.price / snap.high52 - 1) * 100 : null;
  const offLow = snap.price != null && snap.low52 ? (snap.price / snap.low52 - 1) * 100 : null;
  const nearHigh = offHigh != null && offHigh >= -15;
  const newHighish = offHigh != null && offHigh >= -5;
  const r3 = rsReturn(bars, 63);
  const nScore = mean([nearHigh ? 78 : offHigh != null && offHigh > -35 ? 48 : 28, (r3 ?? 0) > 10 ? 70 : 40]);

  const nChecks: Check[] = [
    {
      id: "52w",
      label: "52주 고가 대비",
      status: newHighish ? "pass" : nearHigh ? "watch" : offHigh == null ? "na" : "fail",
      value: offHigh == null ? "—" : `${offHigh.toFixed(1)}%`,
      note: "오닐은 신고가·피벗에서 산다. 저점 평균단가 전략과 정반대. 고가 대비 -5% 이내가 매수 존에 가깝다.",
    },
    {
      id: "base",
      label: "저가 대비 위치",
      status: (offLow ?? 0) >= 30 ? "watch" : "na",
      value: offLow == null ? "—" : `저가 대비 ${offLow.toFixed(0)}%`,
      note: "바닥에서 너무 안 오른 종목은 '싸다'가 아니라 소외주일 수 있다 (L과 연결).",
    },
    {
      id: "new-biz",
      label: "New 정성 요인",
      status: "watch",
      value: "주관 판단",
      note: "신제품·신산업·신경영진·수주. 계량화 어려움 — 오닐 N의 비계량 핵심. 사업 공시·업종 테마를 별도 확인. 수직 급등은 베이스가 아니다.",
    },
  ];

  const volAvg = volumeAvg(bars, 50);
  const lastVol = bars.at(-1)?.volume ?? snap.volume;
  const volRatio = volAvg && lastVol ? lastVol / volAvg : null;
  const mcap = snap.marketCap;
  const smallish = mcap != null && mcap < 5e12;
  const sScore = mean([smallish ? 70 : 42, volRatio != null && volRatio >= 1.4 ? 75 : volRatio != null && volRatio < 0.7 ? 55 : 50]);

  const sChecks: Check[] = [
    {
      id: "mcap",
      label: "시가총액(공급)",
      status: smallish ? "pass" : mcap == null ? "na" : "watch",
      value: mcap == null ? "—" : `${(mcap / 1e12).toFixed(1)}조`,
      note: "발행주식·시총이 작을수록 수급에 민감. 대형 우량주는 S에서 감점되는 것이 오닐 원문에 가깝다.",
    },
    {
      id: "vol",
      label: "거래량 / 50일 평균",
      status: (volRatio ?? 0) >= 1.4 ? "pass" : volRatio == null ? "na" : "watch",
      value: volRatio == null ? "—" : `${volRatio.toFixed(2)}배`,
      note: "돌파 당일 평균 대비 +40~50% 이상 거래량이 수요의 증거. 상승 없는 거래량 급증은 분배.",
    },
    {
      id: "demand",
      label: "수요 질",
      status: snap.changePct != null && snap.changePct > 0 && (volRatio ?? 0) > 1 ? "pass" : "watch",
      value: snap.changePct != null && snap.changePct > 0 ? "상승+거래" : "약함",
      note: "주가↑·거래량↑ = 기관 매집 후보. 주가↓·거래량↑ = 분배.",
    },
  ];

  const r63 = rsReturn(bars, 63);
  const r252 = rsReturn(bars, 252);
  const idxR63 = rsReturn(snap.market === "KOSDAQ" ? market.kosdaq.bars : market.kospi.bars, 63);
  const rel = r63 != null && idxR63 != null ? r63 - idxR63 : r63;
  const lScore = scoreFromThreshold(rel, 5, 20);

  const lChecks: Check[] = [
    {
      id: "rs-3m",
      label: "3개월 수익률 vs 지수",
      status: (rel ?? -999) >= 10 ? "pass" : (rel ?? -999) >= 0 ? "watch" : rel == null ? "na" : "fail",
      value: rel == null ? "—" : `${rel > 0 ? "+" : ""}${rel.toFixed(1)}%p`,
      note: "오닐 RS 80+에 해당. 업종 내 1등만. 싼 소외주는 더 싸질 수 있다.",
    },
    {
      id: "rs-12m",
      label: "12개월 수익률",
      status: (r252 ?? -999) >= 20 ? "pass" : (r252 ?? 0) > 0 ? "watch" : r252 == null ? "na" : "fail",
      value: r252 == null ? "—" : `${r252.toFixed(1)}%`,
      note: "강환국 N(52주 수익률)과 동일한 축. 한국 소형주는 역모멘텀이 강해질 수 있으나 대형·선도주는 모멘텀이 유효.",
    },
    {
      id: "peers",
      label: "업종 동료",
      status: snap.peers.length ? "watch" : "na",
      value: snap.peers.length ? `${snap.peers.length}개 비교` : "—",
      note:
        "같은 산업에서 더 많이 오른 쪽이 리더. 동료만 오르고 나만 안 오르면 소외주." +
        (peerRs != null ? ` 동료 상대강도 참고값 ${peerRs.toFixed(1)}.` : ""),
    },
  ];

  const cons = snap.consensusMean;
  const iScore = mean(
    [
      cons != null ? (cons >= 3.8 ? 80 : cons >= 3.2 ? 58 : 35) : null,
      snap.foreignRate != null ? (snap.foreignRate >= 15 && snap.foreignRate <= 55 ? 70 : 50) : 50,
      snap.targetPrice && snap.price ? (snap.targetPrice / snap.price - 1 > 0.15 ? 72 : 48) : null,
    ].filter((x) => x != null) as number[],
  );

  const iChecks: Check[] = [
    {
      id: "consensus",
      label: "컨센서스 (5점 만점)",
      status: (cons ?? 0) >= 3.8 ? "pass" : cons == null ? "na" : "watch",
      value: cons == null ? "—" : cons.toFixed(2),
      note: "기관 관심의 대리변수. 오닐은 '질 좋은 소수 기관'을 선호하고 과보유는 경계.",
    },
    {
      id: "target",
      label: "목표가 괴리",
      status:
        snap.targetPrice && snap.price && snap.targetPrice / snap.price - 1 > 0.2
          ? "pass"
          : snap.targetPrice
            ? "watch"
            : "na",
      value:
        snap.targetPrice && snap.price ? `${(((snap.targetPrice - snap.price) / snap.price) * 100).toFixed(0)}%` : "—",
      note: "목표가 자체가 후행일 수 있음. 방향만 참고.",
    },
    {
      id: "foreign",
      label: "외인 소진율",
      status: snap.foreignRate == null ? "na" : snap.foreignRate > 70 ? "watch" : "pass",
      value: snap.foreignRate == null ? "—" : `${snap.foreignRate.toFixed(1)}%`,
      note: "너무 낮으면 소외, 너무 높으면 추가 매수 여력 제한. 증감 추세가 레벨보다 중요.",
    },
  ];

  const mLetter: LetterScore = {
    letter: "M",
    title: "Market Direction",
    subtitle: "시장의 방향",
    score: market.overall === "pass" ? 82 : market.overall === "fail" ? 28 : 52,
    status: market.overall,
    summary: market.headline,
    detail: market.commentary,
    oneil: market.oneilM,
    grok: "한국은 베타가 높다. M이 실패인데 개별 실적만 보고 풀베팅하면 CANSLIM이 아니라 역방향 베팅이다. 강환국도 개별주 MDD 50%대를 전제하므로, M이 약하면 비중을 자산배분으로 낮추는 편이 생존에 유리하다.",
    checks: [
      {
        id: "m-k",
        label: "코스피 vs 이동평균",
        status: kospiStatus(market.kospi),
        value: market.kospi.stage,
        note: "50·200일선 위 = 상승장 후보.",
      },
      {
        id: "m-q",
        label: "코스닥 vs 이동평균",
        status: kospiStatus(market.kosdaq),
        value: market.kosdaq.stage,
        note: "코스닥이 무너지면 소형·성장 팩터는 특히 취약.",
      },
      {
        id: "m-dist",
        label: "분배일 (25일)",
        status: (market.kospi.distDays25 ?? 0) >= 5 ? "fail" : market.kospi.distDays25 == null ? "na" : "watch",
        value: `K ${market.kospi.distDays25 ?? "—"} / Q ${market.kosdaq.distDays25 ?? "—"}`,
        note: "5회 이상이면 신규 매수 중단을 검토. 거래량이 없는 지수 데이터는 분배일을 세지 않는다.",
      },
    ],
  };

  const letters: LetterScore[] = [
    {
      letter: "C",
      title: "Current Quarterly Earnings",
      subtitle: "최근 분기 실적",
      score: cScore,
      status: statusFromScore(cScore),
      summary:
        npYoy.yoy != null
          ? `전년동기 이익 ${npYoy.yoy.toFixed(0)}%, 매출 ${salesYoy.yoy?.toFixed(0) ?? "—"}% (${npYoy.lastPeriod || "최근 분기"}).`
          : "전년동기 분기 실적을 아직 맞추지 못했습니다.",
      detail:
        "오닐은 미래의 이익을 예측해 사지 말고, 이미 재무제표에 찍힌 급증을 사라고 했다. 비교 기준은 직전 분기가 아니라 전년 같은 분기다. 강환국 한국형 CANSLIM의 C도 분기 매출·이익·가속이다.",
      oneil:
        "최소 분기 EPS +18%(가능하면 +25~50%+), 매출도 동반 성장, 최근 2~3개 분기 성장률이 가속. 일회성 이익은 제외. 이익률이 개선되는 쪽을 선호.",
      grok:
        "한국은 분기 실적 발표 직후 갭이 크다. C가 좋아도 이미 가격에 선반영됐을 수 있으니 N(신고가)과 L(상대강도)이 같이 열려 있는지 본다. 이익 증가 + 주가 하락이면 가치함정 또는 시장 M 문제다.",
      checks: cChecks,
    },
    {
      letter: "A",
      title: "Annual Earnings Increase",
      subtitle: "연간 이익 성장",
      score: aScore,
      status: statusFromScore(aScore),
      summary: `연간 이익 변화 ${aYoy.yoy?.toFixed(0) ?? "—"}%, ROE ${roe?.toFixed(1) ?? "—"}%.`,
      detail: "한 분기 반등이 아니라 수년간의 이익 체력. 강환국 반쪽 전략은 A를 빼서 백테스트 수익은 높았지만 퀄리티가 낮아질 수 있다.",
      oneil: "최근 3년 연간 EPS가 매년 증가, 연 25% 성장, ROE 17% 이상. 안정적 성장이 폭발적 분기와 겹칠 때 대시세가 나온다.",
      grok: "한국 시클리컬(반도체·조선·화학)은 연간 이익이 출렁인다. A가 약해도 C가 저점에서 가속이면 사이클 초입일 수 있다. 반대로 A만 좋고 C가 꺾이면 고점이다.",
      checks: aChecks,
    },
    {
      letter: "N",
      title: "New Highs & New Conditions",
      subtitle: "신고가·새로운 것",
      score: nScore,
      status: statusFromScore(nScore),
      summary: `52주 고가 대비 ${offHigh?.toFixed(1) ?? "—"}%.`,
      detail: "오닐의 가장 반직관적 규칙: 싸 보이는 주식이 아니라 새 고점 근처의 강한 주식을 산다.",
      oneil:
        "신제품·신경영·신산업 + 컵위드핸들·이중바닥·플랫베이스 피벗. 피벗에서 5% 이상 추격 금지. 8주 이상 베이스. 신고가는 위험 신호가 아니라 수요의 증거.",
      grok:
        "한국 개인은 물린 종목을 평단 맞추려 한다. N은 그 본능을 거부한다. 다만 한국 테마 급등은 베이스 없이 수직 상승하는 경우가 많아, 피벗 규칙을 어기면 되돌림 20~40%가 흔하다. 고가 -5% 밖이면 기다린다.",
      checks: nChecks,
    },
    {
      letter: "S",
      title: "Supply and Demand",
      subtitle: "수급",
      score: sScore,
      status: statusFromScore(sScore),
      summary: `시총 ${mcap ? (mcap / 1e12).toFixed(1) + "조" : "—"}, 거래량 배수 ${volRatio?.toFixed(2) ?? "—"}.`,
      detail: "적은 공급 + 기관 수요. 강환국이 시총 하위 20%를 쓰는 이유와 같다.",
      oneil: "유통주식 수가 적을수록 상승에 유리. 자사주 매입도 공급 감소. 돌파 시 평균 대비 거래량 급증이 필수.",
      grok: "이 앱의 백테스트 유니버스는 시총 상위 50이라 S 관점에선 불리하다. 삼성전자를 CANSLIM 완전체로 보기 어려운 이유. 대형주는 대신 I(기관)와 M이 더 잘 작동한다.",
      checks: sChecks,
    },
    {
      letter: "L",
      title: "Leader or Laggard",
      subtitle: "선도주 vs 소외주",
      score: lScore,
      status: statusFromScore(lScore),
      summary: `3개월 초과수익 ${rel?.toFixed(1) ?? "—"}%p, 12개월 ${r252?.toFixed(1) ?? "—"}%.`,
      detail: "같은 업종에서 안 오른 주식을 '아직 안 올라서 싸다'고 사는 것이 오닐이 가장 말리는 실수.",
      oneil: "RS 80 이상(가능하면 87~95). 주도 산업의 주도주. 소외주는 더 소외된다.",
      grok:
        "한국 소형주는 논문·강환국 영상에서 역모멘텀이 관측되기도 한다. 다만 시총 상위·기관 수급 종목은 미국처럼 모멘텀이 우세한 편. 이 유니버스에선 L을 정방향으로 적용한다.",
      checks: lChecks,
    },
    {
      letter: "I",
      title: "Institutional Sponsorship",
      subtitle: "기관 스폰서",
      score: iScore,
      status: statusFromScore(iScore),
      summary: `컨센서스 ${cons?.toFixed(2) ?? "—"}, 외인 ${snap.foreignRate?.toFixed(1) ?? "—"}%.`,
      detail: "개인은 시세를 못 만든다. 오닐은 기관이 사기 시작하는 주식을 원한다.",
      oneil: "보유 기관 수가 늘고 있어야 한다. 질 좋은 펀드가 소수 들어오는 단계가 이상적. 이미 모든 기관이 들고 있으면 연료가 없다.",
      grok: "한국은 외국인·국민연금 수급이 곧 I다. 공매도·프로그램 매매로 일별 방향이 왜곡되니, 일간 외인 순매수 한 줄보다 3개월 보유 비중 변화가 낫다. 컨센서스 4.0+는 이미 crowded일 수 있다.",
      checks: iChecks,
    },
    mLetter,
  ];

  return letters;
}

export function scoreKang(snap: Snapshot, fund: Fundamentals | null): KangBlock {
  const per = snap.per;
  const pbr = snap.pbr;
  const dy = snap.dividendYield;
  const qNP = row(fund, "당기순이익")?.quarterly ?? [];
  const qSales = row(fund, "매출")?.quarterly ?? [];
  const qOP = row(fund, "영업이익")?.quarterly ?? [];
  const aROE = row(fund, "ROE")?.annual ?? [];
  const roe = lastValid(aROE);
  const npY = yoyPair(qNP).yoy;
  const saY = yoyPair(qSales).yoy;
  const opY = yoyPair(qOP).yoy;

  const valueScore = mean(
    [
      per != null && per > 0 ? clamp(100 - per * 3.2, 5, 98) : null,
      pbr != null && pbr > 0 ? clamp(100 - pbr * 28, 5, 98) : null,
      dy != null ? clamp(dy * 18, 0, 90) : null,
    ].filter((x) => x != null) as number[],
  );

  const qualityScore = mean(
    [roe != null ? clamp(roe * 3.2, 0, 100) : null, snap.eps != null && snap.eps > 0 ? 60 : 25].filter(
      (x) => x != null,
    ) as number[],
  );

  const growthScore = mean(
    [scoreFromThreshold(npY, 10, 30), scoreFromThreshold(saY, 8, 25), scoreFromThreshold(opY, 10, 30)].filter(
      (x) => x != null,
    ) as number[],
  );

  const sizeScore =
    snap.marketCap == null ? null : clamp(100 - Math.log10(Math.max(snap.marketCap, 1e10)) * 12, 5, 90);

  const superValue = valueScore;
  const ultra = mean([valueScore, qualityScore, growthScore].filter((x) => x != null) as number[]);
  const growthValue = mean([valueScore, growthScore].filter((x) => x != null) as number[]);

  const notes: string[] = [
    "강환국 슈퍼가치 ≈ PER·PBR(·PCR·PSR) 다중 저평가 순위.",
    "울트라 ≈ 가치 + 퀄리티(ROE·GP/A) + 펀더멘털 모멘텀.",
    "성장가치 ≈ 저평가 + 매출/영업/순이익 성장. 소형주에서 역사적 연복리 40%대가 나온 조합.",
  ];
  const flags: string[] = [];
  if (FINANCE_HOLDING.has(snap.code)) {
    flags.push("금융·지주 성격 — 강환국 기본 필터에서 종종 제외. PER/PBR 왜곡 가능.");
  }
  if (snap.marketCap && snap.marketCap > 1e13) {
    flags.push("시총 상위 대형주 — 소형주 프리미엄(강환국 핵심)이 적용되지 않음.");
  }
  if ((pbr ?? 99) < 0.8 && (roe ?? 99) < 5) {
    flags.push("저PBR + 저ROE = 가치함정 후보. 싸다고 사지 말 것.");
  }
  if ((per ?? 0) < 0) flags.push("적자 또는 의미 없는 PER.");

  return { valueScore, qualityScore, growthScore, sizeScore, superValue, ultra, growthValue, notes, flags };
}

export function hybridScore(letters: LetterScore[], kang: KangBlock, market: MarketDesk) {
  const cAvg = mean(letters.filter((l) => l.letter !== "M").map((l) => l.score).filter((x) => x != null) as number[]);
  const m = letters.find((l) => l.letter === "M")?.score ?? 50;
  const k = kang.ultra ?? kang.growthValue ?? kang.superValue;
  if (cAvg == null && k == null) return null;
  let h = (cAvg ?? 50) * 0.55 + (k ?? 50) * 0.35 + m * 0.1;
  if (market.overall === "fail") h *= 0.82;
  return clamp(h, 0, 100);
}
