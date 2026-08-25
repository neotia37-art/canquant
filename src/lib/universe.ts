export type Market = "KOSPI" | "KOSDAQ";

export type UniverseStock = {
  code: string;
  name: string;
  market: Market;
};

/** 시총 상위 (우선주·ETF 제외). 2026-08 네이버 시가총액 기준. */
export const KOSPI50: UniverseStock[] = [
  { code: "005930", name: "삼성전자", market: "KOSPI" },
  { code: "000660", name: "SK하이닉스", market: "KOSPI" },
  { code: "402340", name: "SK스퀘어", market: "KOSPI" },
  { code: "009150", name: "삼성전기", market: "KOSPI" },
  { code: "005380", name: "현대차", market: "KOSPI" },
  { code: "373220", name: "LG에너지솔루션", market: "KOSPI" },
  { code: "207940", name: "삼성바이오로직스", market: "KOSPI" },
  { code: "105560", name: "KB금융", market: "KOSPI" },
  { code: "028260", name: "삼성물산", market: "KOSPI" },
  { code: "012450", name: "한화에어로스페이스", market: "KOSPI" },
  { code: "032830", name: "삼성생명", market: "KOSPI" },
  { code: "000270", name: "기아", market: "KOSPI" },
  { code: "055550", name: "신한지주", market: "KOSPI" },
  { code: "034020", name: "두산에너빌리티", market: "KOSPI" },
  { code: "329180", name: "HD현대중공업", market: "KOSPI" },
  { code: "012330", name: "현대모비스", market: "KOSPI" },
  { code: "068270", name: "셀트리온", market: "KOSPI" },
  { code: "006400", name: "삼성SDI", market: "KOSPI" },
  { code: "034730", name: "SK", market: "KOSPI" },
  { code: "086790", name: "하나금융지주", market: "KOSPI" },
  { code: "035420", name: "NAVER", market: "KOSPI" },
  { code: "066570", name: "LG전자", market: "KOSPI" },
  { code: "010130", name: "고려아연", market: "KOSPI" },
  { code: "000810", name: "삼성화재", market: "KOSPI" },
  { code: "010120", name: "LS ELECTRIC", market: "KOSPI" },
  { code: "042660", name: "한화오션", market: "KOSPI" },
  { code: "005490", name: "POSCO홀딩스", market: "KOSPI" },
  { code: "009540", name: "HD한국조선해양", market: "KOSPI" },
  { code: "298040", name: "효성중공업", market: "KOSPI" },
  { code: "267260", name: "HD현대일렉트릭", market: "KOSPI" },
  { code: "316140", name: "우리금융지주", market: "KOSPI" },
  { code: "096770", name: "SK이노베이션", market: "KOSPI" },
  { code: "011200", name: "HMM", market: "KOSPI" },
  { code: "017670", name: "SK텔레콤", market: "KOSPI" },
  { code: "015760", name: "한국전력", market: "KOSPI" },
  { code: "138040", name: "메리츠금융지주", market: "KOSPI" },
  { code: "042700", name: "한미반도체", market: "KOSPI" },
  { code: "006800", name: "미래에셋증권", market: "KOSPI" },
  { code: "051910", name: "LG화학", market: "KOSPI" },
  { code: "033780", name: "KT&G", market: "KOSPI" },
  { code: "010140", name: "삼성중공업", market: "KOSPI" },
  { code: "018260", name: "삼성에스디에스", market: "KOSPI" },
  { code: "267250", name: "HD현대", market: "KOSPI" },
  { code: "000150", name: "두산", market: "KOSPI" },
  { code: "003550", name: "LG", market: "KOSPI" },
  { code: "278470", name: "에이피알", market: "KOSPI" },
  { code: "024110", name: "기업은행", market: "KOSPI" },
  { code: "377300", name: "카카오페이", market: "KOSPI" },
  { code: "128940", name: "한미약품", market: "KOSPI" },
  { code: "241560", name: "두산밥캣", market: "KOSPI" },
];

export const KOSDAQ50: UniverseStock[] = [
  { code: "196170", name: "알테오젠", market: "KOSDAQ" },
  { code: "086520", name: "에코프로", market: "KOSDAQ" },
  { code: "247540", name: "에코프로비엠", market: "KOSDAQ" },
  { code: "277810", name: "레인보우로보틱스", market: "KOSDAQ" },
  { code: "036930", name: "주성엔지니어링", market: "KOSDAQ" },
  { code: "240810", name: "원익IPS", market: "KOSDAQ" },
  { code: "058470", name: "리노공업", market: "KOSDAQ" },
  { code: "028300", name: "HLB", market: "KOSDAQ" },
  { code: "039030", name: "이오테크닉스", market: "KOSDAQ" },
  { code: "214450", name: "파마리서치", market: "KOSDAQ" },
  { code: "087010", name: "펩트론", market: "KOSDAQ" },
  { code: "222800", name: "심텍", market: "KOSDAQ" },
  { code: "298380", name: "에이비엘바이오", market: "KOSDAQ" },
  { code: "403870", name: "HPSP", market: "KOSDAQ" },
  { code: "000250", name: "삼천당제약", market: "KOSDAQ" },
  { code: "319660", name: "피에스케이", market: "KOSDAQ" },
  { code: "108490", name: "로보티즈", market: "KOSDAQ" },
  { code: "141080", name: "리가켐바이오", market: "KOSDAQ" },
  { code: "257720", name: "실리콘투", market: "KOSDAQ" },
  { code: "095340", name: "ISC", market: "KOSDAQ" },
  { code: "440110", name: "파두", market: "KOSDAQ" },
  { code: "145020", name: "휴젤", market: "KOSDAQ" },
  { code: "084370", name: "유진테크", market: "KOSDAQ" },
  { code: "310210", name: "보로노이", market: "KOSDAQ" },
  { code: "214370", name: "케어젠", market: "KOSDAQ" },
  { code: "064760", name: "티씨케이", market: "KOSDAQ" },
  { code: "131290", name: "티에스이", market: "KOSDAQ" },
  { code: "095610", name: "테스", market: "KOSDAQ" },
  { code: "080220", name: "제주반도체", market: "KOSDAQ" },
  { code: "319400", name: "현대무벡스", market: "KOSDAQ" },
  { code: "357780", name: "솔브레인", market: "KOSDAQ" },
  { code: "347850", name: "디앤디파마텍", market: "KOSDAQ" },
  { code: "031980", name: "피에스케이홀딩스", market: "KOSDAQ" },
  { code: "067310", name: "하나마이크론", market: "KOSDAQ" },
  { code: "178320", name: "서진시스템", market: "KOSDAQ" },
  { code: "237690", name: "에스티팜", market: "KOSDAQ" },
  { code: "005290", name: "동진쎄미켐", market: "KOSDAQ" },
  { code: "214150", name: "클래시스", market: "KOSDAQ" },
  { code: "058610", name: "에스피지", market: "KOSDAQ" },
  { code: "226950", name: "올릭스", market: "KOSDAQ" },
  { code: "010170", name: "대한광통신", market: "KOSDAQ" },
  { code: "032820", name: "우리기술", market: "KOSDAQ" },
  { code: "263750", name: "펄어비스", market: "KOSDAQ" },
  { code: "140410", name: "메지온", market: "KOSDAQ" },
  { code: "098460", name: "고영", market: "KOSDAQ" },
  { code: "068760", name: "셀트리온제약", market: "KOSDAQ" },
  { code: "083650", name: "비에이치아이", market: "KOSDAQ" },
  { code: "140860", name: "파크시스템스", market: "KOSDAQ" },
  { code: "089030", name: "테크윙", market: "KOSDAQ" },
  { code: "950160", name: "코오롱티슈진", market: "KOSDAQ" },
];

export const UNIVERSE: UniverseStock[] = [...KOSPI50, ...KOSDAQ50];

const BY_CODE = new Map(UNIVERSE.map((s) => [s.code, s]));
const BY_NAME = new Map(UNIVERSE.map((s) => [s.name.replace(/\s/g, "").toLowerCase(), s]));

export function lookupUniverse(q: string): UniverseStock[] {
  const raw = q.trim();
  if (!raw) return UNIVERSE;
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 4) {
    const code = digits.padStart(6, "0").slice(-6);
    const hit = BY_CODE.get(code);
    return hit ? [hit] : [{ code, name: code, market: "KOSPI" }];
  }
  const n = raw.replace(/\s/g, "").toLowerCase();
  const exact = BY_NAME.get(n);
  if (exact) return [exact];
  return UNIVERSE.filter(
    (s) => s.name.toLowerCase().includes(n) || s.code.includes(raw),
  ).slice(0, 20);
}

export function yahooSymbol(code: string, market: Market) {
  return market === "KOSDAQ" ? `${code}.KQ` : `${code}.KS`;
}

export const FINANCE_HOLDING = new Set([
  "105560",
  "055550",
  "086790",
  "316140",
  "032830",
  "000810",
  "138040",
  "006800",
  "024110",
  "377300",
  "034730",
  "003550",
  "028260",
  "402340",
]);
