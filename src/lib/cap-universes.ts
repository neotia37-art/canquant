/**
 * 시총 구간별 관심 유니버스 + 캔퀀트 순위 분류 규칙.
 * 대형=코스피 시총상위, 중형=코스닥 시총상위, 소형=키움19+테마.
 */
import { KOSPI50, KOSDAQ50, FINANCE_HOLDING, type UniverseStock } from "./universe";
import {
  WATCH_UNIVERSE,
  type WatchStock,
  WORKFLOW_STEPS,
  REBALANCE_PLAN,
  RESET_CHECKLIST,
  activeRebalanceWindow,
} from "./smallcap-watchlist";

export type CapSize = "large" | "mid" | "small";

export type CapRow = {
  code: string;
  name: string;
  market?: string;
  theme?: string;
  note?: string;
  source?: string;
  codeUncertain?: boolean;
};

export type RankMetric = "hybrid" | "ultra" | "growthValue" | "superValue" | "canslim";

export const RANK_METRICS: { id: RankMetric; label: string; hint: string }[] = [
  { id: "hybrid", label: "하이브리드", hint: "CANSLIM 55% + 울트라 35% + M 10%" },
  { id: "ultra", label: "울트라", hint: "가치·퀄리티·성장 평균 (강환국)" },
  { id: "growthValue", label: "성장가치", hint: "가치+성장 방향 점수" },
  { id: "superValue", label: "슈퍼가치", hint: "다중 저평가 방향" },
  { id: "canslim", label: "CANSLIM 평균", hint: "C·A·N·S·L·I·M 점수 평균" },
];

export type CapUniverseConfig = {
  size: CapSize;
  path: "/largecap" | "/midcap" | "/watchlist";
  navLabel: string;
  title: string;
  subtitle: string;
  asOf: string;
  targetCount: number;
  equalWeightPct: number;
  caveats: string[];
  rows: CapRow[];
};

function fromUniverse(list: UniverseStock[], theme: string): CapRow[] {
  return list.map((s) => ({
    code: s.code,
    name: s.name,
    market: s.market,
    theme,
    note: FINANCE_HOLDING.has(s.code) ? "금융·지주 — 강환국 팩터 왜곡 가능" : undefined,
    source: s.market,
  }));
}

function fromWatch(list: WatchStock[]): CapRow[] {
  return list.map((s) => ({
    code: s.code,
    name: s.name,
    theme: s.theme,
    note: s.note,
    source: s.source,
    codeUncertain: s.codeUncertain,
  }));
}

export const LARGE_CAP: CapUniverseConfig = {
  size: "large",
  path: "/largecap",
  navLabel: "대형",
  title: "대형캡 관심 유니버스",
  subtitle: "코스피 시총 상위(캔퀀트 KOSPI50). 소형 성장가치 CAGR을 그대로 기대하면 안 됩니다. CANSLIM·M·기관 수급 비중이 더 큽니다.",
  asOf: "2026-08",
  targetCount: 20,
  equalWeightPct: 5,
  caveats: [
    "시총 상위는 강환국 소형 프리미엄이 약함 — 울트라·성장가치 점수는 상대 비교용",
    "금융·지주는 PER/PBR 왜곡 → 플래그 확인 후 제외 또는 비중 축소",
    "시장(M) 실패 시 하이브리드 헤어컷 — 약세장에서 대형도 현금 우선",
  ],
  rows: fromUniverse(KOSPI50, "kospi50"),
};

export const MID_CAP: CapUniverseConfig = {
  size: "mid",
  path: "/midcap",
  navLabel: "중형",
  title: "미들캡 관심 유니버스",
  subtitle: "코스닥 시총 상위(캔퀀트 KOSDAQ50). 성장·테마 민감도가 크고, 소형보다 유동성은 낫지만 대형보다 변동성이 큽니다.",
  asOf: "2026-08",
  targetCount: 20,
  equalWeightPct: 5,
  caveats: [
    "코스닥 상위는 ‘중형’으로 분류하나 일부는 이미 대형에 가까운 시총",
    "바이오·로보틱스 등 고성장 테마는 밸류 과열·적자 구간이 섞임 → 성장가치 교차 필수",
    "거래대금은 대체로 충분하나 테마 순환 시 급락 리스크",
  ],
  rows: fromUniverse(KOSDAQ50, "kosdaq50"),
};

export const SMALL_CAP: CapUniverseConfig = {
  size: "small",
  path: "/watchlist",
  navLabel: "스몰캡",
  title: "스몰캡 관심 유니버스",
  subtitle: "키움 성장가치 재점화 19선 + 테마 후보. 소형 프리미엄·유동성 하한을 함께 봅니다.",
  asOf: "2026-08",
  targetCount: 20,
  equalWeightPct: 5,
  caveats: [
    "소형은 스프레드·미체결 — 20일 평균 거래대금 하한(예: 3~5억) 권장",
    "코드 ? 표시는 재확인 필요",
    "후보 발표 시 유니버스 초기화 후 분기 리밸런싱",
  ],
  rows: fromWatch(WATCH_UNIVERSE),
};

export const CAP_CONFIGS = [LARGE_CAP, MID_CAP, SMALL_CAP] as const;

export { WORKFLOW_STEPS, REBALANCE_PLAN, RESET_CHECKLIST, activeRebalanceWindow };

export type RankResult = {
  code: string;
  hybrid: number | null;
  ultra: number | null;
  growthValue: number | null;
  superValue: number | null;
  canslim: number | null;
  verdict: string | null;
  error?: string;
};

export function metricValue(r: RankResult, m: RankMetric): number | null {
  if (m === "hybrid") return r.hybrid;
  if (m === "ultra") return r.ultra;
  if (m === "growthValue") return r.growthValue;
  if (m === "superValue") return r.superValue;
  return r.canslim;
}
