export type CheckStatus = "pass" | "watch" | "fail" | "na";

export type Check = {
  id: string;
  label: string;
  status: CheckStatus;
  value: string;
  note: string;
};

export type LetterScore = {
  letter: "C" | "A" | "N" | "S" | "L" | "I" | "M";
  title: string;
  subtitle: string;
  score: number | null;
  status: CheckStatus;
  summary: string;
  detail: string;
  oneil: string;
  grok: string;
  checks: Check[];
};

export type Bar = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type Snapshot = {
  code: string;
  name: string;
  market: "KOSPI" | "KOSDAQ";
  price: number | null;
  change: number | null;
  changePct: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  value: number | null;
  marketCap: number | null;
  foreignRate: number | null;
  high52: number | null;
  low52: number | null;
  per: number | null;
  eps: number | null;
  cnsPer: number | null;
  cnsEps: number | null;
  pbr: number | null;
  bps: number | null;
  dividendYield: number | null;
  dividend: number | null;
  consensusMean: number | null;
  targetPrice: number | null;
  peers: { code: string; name: string; changePct: number | null; price: number | null }[];
};

export type StatementRow = {
  label: string;
  annual: { period: string; value: number | null }[];
  quarterly: { period: string; value: number | null }[];
};

export type Fundamentals = {
  periodsAnnual: string[];
  periodsQuarter: string[];
  rows: StatementRow[];
};

export type KangBlock = {
  valueScore: number | null;
  qualityScore: number | null;
  growthScore: number | null;
  sizeScore: number | null;
  superValue: number | null;
  ultra: number | null;
  growthValue: number | null;
  notes: string[];
  flags: string[];
};

export type HybridVerdict = "strong" | "buy" | "hold" | "avoid";

export type StockReport = {
  snapshot: Snapshot;
  bars: Bar[];
  fundamentals: Fundamentals | null;
  canslim: LetterScore[];
  kang: KangBlock;
  hybrid: number | null;
  verdict: HybridVerdict;
  verdictText: string;
  market: MarketDesk;
};

export type MarketDesk = {
  kospi: IndexState;
  kosdaq: IndexState;
  season: string;
  overall: CheckStatus;
  headline: string;
  commentary: string;
  oneilM: string;
};

export type IndexState = {
  name: string;
  price: number | null;
  changePct: number | null;
  sma50: number | null;
  sma200: number | null;
  above50: boolean | null;
  above200: boolean | null;
  distDays25: number | null;
  followThrough: boolean | null;
  stage: string;
  bars: Bar[];
};

export type BacktestStrategy = {
  id: string;
  name: string;
  desc: string;
  cagr: number | null;
  total: number | null;
  mdd: number | null;
  sharpe: number | null;
  years: number | null;
  equity: { date: string; value: number }[];
  yearly: { year: string; ret: number }[];
};

export type BacktestResult = {
  asOf: string;
  universeSize: number;
  fetched: number;
  start: string;
  end: string;
  strategies: BacktestStrategy[];
  notes: string[];
};
