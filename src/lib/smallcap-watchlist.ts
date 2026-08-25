/**
 * 스몰캡 관심 유니버스 — 키움「성장 가치의 재점화」19선 + 테마 후보.
 * 후보 발표 시 snapshot을 교체하고 분기 리밸런싱 창에 맞춰 재스크리닝.
 * 투자 권유가 아님. 코드는 공개 자료 기준이며 상장·변경 시 재확인.
 */

export type WatchSource = "kiwoom19" | "theme";
export type WatchTheme =
  | "energy_plant"
  | "tech_parts"
  | "healthcare"
  | "ai_infra"
  | "ess_battery"
  | "semi_equip"
  | "other";

export type WatchStock = {
  code: string;
  name: string;
  source: WatchSource;
  theme: WatchTheme;
  note: string;
  /** 코드 미확정·최근 상장 등으로 상세 링크 주의 */
  codeUncertain?: boolean;
};

/** 키움 스몰캡 모음집 19선 (시총 순으로 공개된 이름 순서) */
export const KIWOOM19: WatchStock[] = [
  { code: "083650", name: "비에이치아이", source: "kiwoom19", theme: "energy_plant", note: "HRSG·발전 플랜트. 수주·실적 개선 모멘텀으로 자주 언급" },
  { code: "124500", name: "아이티센글로벌", source: "kiwoom19", theme: "tech_parts", note: "IT·디지털 전환·그룹 투자. 실적 변동성 확인" },
  { code: "477850", name: "마키나락스", source: "kiwoom19", theme: "ai_infra", note: "피지컬 AI·제조 AI. 성장 스토리 강·밸류·흑자 여부 점검" },
  { code: "368770", name: "파이버프로", source: "kiwoom19", theme: "tech_parts", note: "광·계측 관련 스몰캡 후보" },
  { code: "290550", name: "디케이티", source: "kiwoom19", theme: "tech_parts", note: "전자부품·연성회로 계열" },
  { code: "002900", name: "TYM", source: "kiwoom19", theme: "other", note: "농기계 등. 시총·유동성 확인" },
  { code: "054950", name: "제이브이엠", source: "kiwoom19", theme: "healthcare", note: "약국 자동화·의료기기" },
  { code: "098070", name: "한텍", source: "kiwoom19", theme: "energy_plant", note: "화공·LNG 플랜트 기자재" },
  { code: "390110", name: "네오티스", source: "kiwoom19", theme: "tech_parts", note: "부품·소재 후보. 코드·실적 재확인" },
  { code: "389260", name: "대명에너지", source: "kiwoom19", theme: "energy_plant", note: "신재생·에너지" },
  { code: "038870", name: "에코아이", source: "kiwoom19", theme: "energy_plant", note: "환경·에너지. 코드 재확인", codeUncertain: true },
  { code: "382800", name: "지앤비에스에코", source: "kiwoom19", theme: "energy_plant", note: "환경·에코. 코드 재확인", codeUncertain: true },
  { code: "240600", name: "코스텍시스", source: "kiwoom19", theme: "tech_parts", note: "부품. 코드 재확인", codeUncertain: true },
  { code: "246710", name: "티앤알바이오팹", source: "kiwoom19", theme: "healthcare", note: "바이오·3D 프린팅 임플란트 등" },
  { code: "466100", name: "메쥬", source: "kiwoom19", theme: "healthcare", note: "의료기기. 신규 상장 성격·코드 재확인", codeUncertain: true },
  { code: "187790", name: "나노", source: "kiwoom19", theme: "tech_parts", note: "동명 종목 주의. 코드 재확인", codeUncertain: true },
  { code: "099190", name: "이지케어텍", source: "kiwoom19", theme: "healthcare", note: "의료 IT·병원 정보" },
  { code: "475230", name: "엔알비", source: "kiwoom19", theme: "other", note: "모듈러 등. 최근 상장" },
  { code: "452280", name: "페스카로", source: "kiwoom19", theme: "other", note: "코드·사업 재확인", codeUncertain: true },
];

/** 시장·방송에서 자주 묶인 테마 후보 (키움 19 외) */
export const THEME_CANDIDATES: WatchStock[] = [
  { code: "017550", name: "삼미금속", source: "theme", theme: "ai_infra", note: "단조·데이터센터/발전 인프라 부품 낙수" },
  { code: "006110", name: "삼아알미늄", source: "theme", theme: "ess_battery", note: "알박·ESS·전지 소재 가동률 회복 논점" },
  { code: "178320", name: "서진시스템", source: "theme", theme: "ess_battery", note: "ESS·전지 부품 중형" },
  { code: "107640", name: "한중엔시에스", source: "theme", theme: "ess_battery", note: "ESS 관련. 코드 재확인", codeUncertain: true },
  { code: "004490", name: "세방전지", source: "theme", theme: "ess_battery", note: "전지. 시총이 소형 필터를 벗어날 수 있음" },
  { code: "189330", name: "씨이랩", source: "theme", theme: "ai_infra", note: "AI 인프라 SW·대형 수주 스토리. 밸류 별도" },
  { code: "240810", name: "원익IPS", source: "theme", theme: "semi_equip", note: "반도체 장비. 중형~대형에 가깝면 소형 퀀트 제외" },
  { code: "084370", name: "유진테크", source: "theme", theme: "semi_equip", note: "반도체 장비. 성장 컨센서스 강한 편" },
];

export const WATCH_UNIVERSE: WatchStock[] = [...KIWOOM19, ...THEME_CANDIDATES];

export const THEME_LABEL: Record<WatchTheme, string> = {
  energy_plant: "에너지·플랜트",
  tech_parts: "장비·부품·테크",
  healthcare: "의료·헬스케어",
  ai_infra: "AI·데이터센터 인프라",
  ess_battery: "ESS·2차전지",
  semi_equip: "반도체 소부장",
  other: "기타",
};

/** 5단계 워크플로 (사용자 요청 반영) */
export const WORKFLOW_STEPS: { step: number; title: string; detail: string; action: string }[] = [
  {
    step: 1,
    title: "관심 유니버스 고정",
    detail: "키움 19선 + 테마 후보를 한 바구니 담는다. 후보 발표·리포트 갱신 시 이 스냅샷을 교체(초기화)한다.",
    action: "아래 테이블이 현재 스냅샷. 발표일이 바뀌면 asOf를 갱신.",
  },
  {
    step: 2,
    title: "네이버·FnGuide 펀더멘털",
    detail: "최근 4분기(또는 TTM) 매출·영업이익·순이익 YoY, PER·PSR·PBR을 종목별로 기입·비교.",
    action: "종목 행 → 캔퀀트 상세 또는 네이버 금융. 적자·일회성 이익은 성장 순위에서 감점.",
  },
  {
    step: 3,
    title: "거래대금·유동성",
    detail: "소형은 스프레드·미체결 리스크. 20일 평균 거래대금 하한(예: 3~5억)을 스스로 정한다.",
    action: "하한 미달 종목은 편입 보류 또는 비중 축소.",
  },
  {
    step: 4,
    title: "캔퀀트 강환국 교차",
    detail: "종목 상세의 성장가치·울트라·슈퍼가치 점수와 가치함정·대형·금융·지주 플래그를 확인.",
    action: "가치↑성장↑만 본편입. 가치↑성장↓은 함정 후보, 시총 상위는 소형 백테스트 CAGR을 기대하지 않음.",
  },
  {
    step: 5,
    title: "20종목 동일비중",
    detail: "한두 종목 몰빵 금지. 통과 종목이 20을 넘으면 평균순위(또는 하이브리드) 상위 20, 부족하면 현금 비중.",
    action: "종목당 5%. 분기 리밸런싱 창에 전량 교체·비중 재조정.",
  },
];

export const REBALANCE_PLAN: {
  id: string;
  window: string;
  trigger: string;
  actions: string[];
}[] = [
  {
    id: "q1",
    window: "5/20 ~ 5/31",
    trigger: "1Q 분기보고 공시 종료 후",
    actions: ["유니버스 스냅샷 유지 또는 신규 리포트 반영", "YoY·밸류 재계산", "유동성 필터", "캔퀀트 교차", "20 동일비중 리밸런싱"],
  },
  {
    id: "q2",
    window: "8/20 ~ 8/31",
    trigger: "반기보고 공시 종료 후",
    actions: ["동일 5단계", "여름철 소외·할인 구간이면 가치 순위를 더 엄격히"],
  },
  {
    id: "q3",
    window: "11/20 ~ 11/30",
    trigger: "3Q 분기보고 후",
    actions: ["동일 5단계", "연말 수급·테마 과열 종목은 유동성·밸류 재점검"],
  },
  {
    id: "q4",
    window: "4/1 ~ 4/10",
    trigger: "사업보고서·연간 실적 안정화 후",
    actions: ["연간 성장·ROE 반영", "키움 등 연간 스몰캡 모음집 발표 시 유니버스 초기화"],
  },
];

/** 후보 발표 시 초기화 체크리스트 */
export const RESET_CHECKLIST: string[] = [
  "증권사 스몰캡 모음집·전략노트 발표일 기록",
  "KIWOOM19 / THEME_CANDIDATES 교체 (코드 검증)",
  "universeAsOf 날짜 갱신",
  "이전 포트 편입 종목 중 유니버스 이탈분 매도 예정 목록 작성",
  "다음 분기 리밸런싱 창까지 홀딩 규칙 고정 (임의 교체 금지)",
];

export const UNIVERSE_META = {
  title: "스몰캡 관심 유니버스",
  sourceLabel: "키움 스몰캡 모음집: 성장 가치의 재점화 + 테마 후보",
  /** 공개 텔레그램·리서치 기준 스냅샷 시점 */
  asOf: "2026-08",
  targetCount: 20,
  equalWeightPct: 5,
  liquidityHint: "20일 평균 거래대금 3~5억 원 이상 권장 (자체 기준)",
  disclaimer:
    "키움 리스트와 테마 후보는 연구·관심용입니다. 매수 추천이 아니며, 코드·실적·유동성은 반드시 재확인하세요.",
};

export function activeRebalanceWindow(now = new Date()): (typeof REBALANCE_PLAN)[0] | null {
  const m = now.getMonth() + 1;
  const d = now.getDate();
  if (m === 5 && d >= 20) return REBALANCE_PLAN[0];
  if (m === 8 && d >= 20) return REBALANCE_PLAN[1];
  if (m === 11 && d >= 20) return REBALANCE_PLAN[2];
  if (m === 4 && d <= 10) return REBALANCE_PLAN[3];
  if (m === 8) return REBALANCE_PLAN[1];
  return null;
}
