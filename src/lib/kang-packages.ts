/** 강환국 전략 패키지 — 종목 리스트가 아니라 규칙. 출처: 인터뷰·책·영상 공개 내용 정리. */

export type KangPackageId = "growthValue" | "ultra" | "superValue";

export type KangPackage = {
  id: KangPackageId;
  name: string;
  tagline: string;
  why: string;
  interpretation: string;
  valueFactors: string[];
  growthFactors: string[];
  qualityFactors: string[];
  historicalNote: string;
  riskNote: string;
  canquantField: "growthValue" | "ultra" | "superValue";
};

export const KANG_PACKAGES: KangPackage[] = [
  {
    id: "growthValue",
    name: "성장가치 (소형)",
    tagline: "싸면서 실적이 커지는 20종목",
    why: "저평가만 사면 정체·함정에 빠지고, 성장만 사면 비싸게 산다. 가치 4개와 성장 4개의 평균순위로 ‘싸면서 커지는’ 교집합만 남긴다.",
    interpretation:
      "평균순위가 높은 종목은 시총 대비 매출·이익 지표가 낮고(저평가), 동시에 전년동기 대비 매출·매출총이익·영업·순이익이 함께 늘고 있다. 한 축만 강한 종목은 순위에서 밀린다.",
    valueFactors: ["PER", "PSR", "PGPR(시총/매출총이익)", "POR(시총/영업이익)"],
    growthFactors: ["매출 YoY", "매출총이익 YoY", "영업이익 YoY", "순이익 YoY"],
    qualityFactors: [],
    historicalNote: "소형(시총 하위 20%) 적용 시 장기 백테스트에서 연복리 40%대·원금 배수 성장이 자주 인용됐다. MDD는 50%대 전후.",
    riskNote: "소형·저유동성·분기 교체 비용. 대형주에 같은 규칙을 적용하고 소형 CAGR을 기대하면 안 된다.",
    canquantField: "growthValue",
  },
  {
    id: "ultra",
    name: "울트라",
    tagline: "가치 + 퀄리티 + 이익 모멘텀",
    why: "성장가치에 수익력(ROE·GP/A 등)을 더해 싸기만 한 부실을 줄인다. 한국에서 분기 영업·순이익 성장(이익 모멘텀)이 특히 강했던 조합.",
    interpretation:
      "가치·퀄리티·성장 세 축의 평균이 높아야 한다. 가치만 높고 퀄리티·성장이 낮으면 가치함정 후보, 성장만 높으면 고평가 성장주로 울트라 순위에서 밀린다.",
    valueFactors: ["PER", "PBR", "PSR", "PCR 등 다중 저평가"],
    growthFactors: ["분기 영업이익 YoY", "분기 순이익 YoY"],
    qualityFactors: ["ROE", "GP/A(매출총이익/자산)"],
    historicalNote: "소형 적용 시 과거 연 30~40%대, MDD 50%대 구간이 자주 언급된다.",
    riskNote: "퀄리티 필터가 있어도 소형주 MDD는 크다. 금융·지주는 지표 왜곡으로 기본 제외.",
    canquantField: "ultra",
  },
  {
    id: "superValue",
    name: "슈퍼가치",
    tagline: "다중 저평가 순위",
    why: "그레이엄식 ‘싸게 산다’를 PER·PBR·PSR·PCR 등 여러 지표의 평균순위로 구현한다. 성장 조건 없이 저평가 밀도만 본다.",
    interpretation:
      "여러 밸류 지표에서 동시에 순위가 좋다는 뜻이다. 성장이 없어도 통과하므로, 반드시 적자·관리 제외와 함께 써야 한다. 저PBR+저ROE는 함정 가능성이 높다.",
    valueFactors: ["PER", "PBR", "PSR", "PCR(또는 PFCR)"],
    growthFactors: [],
    qualityFactors: [],
    historicalNote: "소형·분기 리밸런싱 조합에서 장기 고수익 백테스트가 보고됐다.",
    riskNote: "성장 축이 없어 정체 기업·자산 함정이 섞일 수 있다. 성장가치·울트라와 병행 해석 권장.",
    canquantField: "superValue",
  },
];

export const GROWTH_VALUE_FILTERS: { step: number; label: string; detail: string }[] = [
  { step: 1, label: "관리·거래정지·정리매매 제외", detail: "상장폐지·유동성 함정 차단" },
  { step: 2, label: "최근 분기·연간 적자 제외", detail: "이익을 내는 기업만" },
  { step: 3, label: "금융주 제외", detail: "PER/PBR/PSR 왜곡" },
  { step: 4, label: "지주사 제외", detail: "연결·자산 구조 왜곡" },
  { step: 5, label: "중국기업 제외", detail: "회계·지배구조 리스크" },
  { step: 6, label: "시가총액 하위 20%", detail: "소형주 프리미엄 — 수익의 큰 원천" },
  { step: 7, label: "(실무) 거래대금 하한", detail: "원안 외 선택. 예: 20일 평균 3~5억 — 체결력" },
];

export const GROWTH_VALUE_FACTORS = {
  value: [
    { key: "PER", dir: "낮을수록 1등", def: "시가총액 / 순이익(TTM 또는 최근 분기 연환산)" },
    { key: "PSR", dir: "낮을수록 1등", def: "시가총액 / 매출(TTM)" },
    { key: "PGPR", dir: "낮을수록 1등", def: "시가총액 / 매출총이익" },
    { key: "POR", dir: "낮을수록 1등", def: "시가총액 / 영업이익" },
  ],
  growth: [
    { key: "매출 YoY", dir: "높을수록 1등", def: "최근 분기 vs 전년 동기 (QoQ 금지)" },
    { key: "매출총이익 YoY", dir: "높을수록 1등", def: "전년 동기 대비" },
    { key: "영업이익 YoY", dir: "높을수록 1등", def: "전년 동기 대비 — 한국에서 특히 강한 축" },
    { key: "순이익 YoY", dir: "높을수록 1등", def: "전년 동기 대비 — 일회성 주의" },
  ],
};

export const REBALANCE_CALENDAR: {
  id: string;
  label: string;
  window: string;
  basis: string;
}[] = [
  { id: "q1", label: "1Q", window: "5/20 ~ 5/31", basis: "1~3월 분기보고서 (법정 ~5/15)" },
  { id: "q2", label: "2Q", window: "8/20 ~ 8/31", basis: "반기보고서 (법정 ~8/15)" },
  { id: "q3", label: "3Q", window: "11/20 ~ 11/30", basis: "7~9월 분기보고서 (법정 ~11/15)" },
  { id: "q4", label: "4Q", window: "4/1 ~ 4/10", basis: "사업보고서·연간 (법정 ~3/31)" },
];

/** 종목이 패키지에 들어갔을 때 해석 프레임 */
export const INTERPRETATION_FRAMES: {
  title: string;
  pattern: string;
  read: string;
  action: string;
}[] = [
  {
    title: "가치↑ 성장↑",
    pattern: "성장가치·울트라 상위",
    read: "싸면서 실적이 커지는 전형. 규칙이 노리는 교집합.",
    action: "동일비중 편입 후보. 유동성·관리 재확인 후 보유.",
  },
  {
    title: "가치↑ 성장↓",
    pattern: "슈퍼가치만 높음",
    read: "싸 보이지만 성장이 없다. 저PBR+저ROE면 가치함정 후보.",
    action: "성장가치 순위에서 탈락하는 것이 정상. 단독 매수 지양.",
  },
  {
    title: "가치↓ 성장↑",
    pattern: "고평가 성장",
    read: "실적은 좋으나 이미 비싸다. 오닐 C·N과 겹칠 수 있으나 강환국 성장가치와는 결이 다름.",
    action: "성장가치 평균순위에서 밀림. CANSLIM 탭과 교차 확인.",
  },
  {
    title: "시총 상위 대형",
    pattern: "시총 하위 20% 탈락",
    read: "강환국 고수익의 핵심인 소형 프리미엄이 없다.",
    action: "같은 8팩터를 써도 소형 백테스트 CAGR을 기대하지 말 것.",
  },
];

export function currentRebalanceHint(now = new Date()): {
  active: (typeof REBALANCE_CALENDAR)[0] | null;
  message: string;
} {
  const m = now.getMonth() + 1;
  const d = now.getDate();
  if (m === 5 && d >= 20) return { active: REBALANCE_CALENDAR[0], message: "1Q 리밸런싱 창입니다. 분기보고 반영 후 20종목을 다시 뽑으세요." };
  if (m === 8 && d >= 20) return { active: REBALANCE_CALENDAR[1], message: "2Q(반기) 리밸런싱 창입니다. 반기보고서 반영 후 성장가치 20종목을 교체하세요." };
  if (m === 11 && d >= 20) return { active: REBALANCE_CALENDAR[2], message: "3Q 리밸런싱 창입니다." };
  if (m === 4 && d <= 10) return { active: REBALANCE_CALENDAR[3], message: "4Q·연간 리밸런싱 창입니다." };
  if (m === 8) return { active: REBALANCE_CALENDAR[1], message: "2Q 리밸런싱 구간(8/20~31)에 가깝습니다. 반기 실적 공시가 끝난 뒤 순위를 돌리세요." };
  return {
    active: null,
    message: "분기 실적 공시가 끝난 뒤 유니버스를 다시 뽑아 교체합니다. look-ahead(미공시 실적)를 쓰지 마세요.",
  };
}
