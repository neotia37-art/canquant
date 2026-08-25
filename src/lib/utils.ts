import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseLooseNumber(raw: string | number | null | undefined): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const s = String(raw).trim();
  if (!s || s === "-" || s === "N/A" || s === "n/a") return null;
  const negative = s.startsWith("-") || s.startsWith("▼") || s.startsWith("↓");
  const t = s.replace(/[▼▲↑↓+,%배원주석추정]/g, "").replace(/,/g, "").trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return negative && n > 0 ? -n : n;
}

/** "1,464조 4,928억" / "5조 1,148억" → 원 단위 */
export function parseKoreanMoney(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const s = raw.replace(/\s/g, "");
  const jo = s.match(/([\d,.]+)조/);
  const eok = s.match(/([\d,.]+)억/);
  const man = s.match(/([\d,.]+)만/);
  let won = 0;
  let hit = false;
  if (jo) {
    won += Number(jo[1].replace(/,/g, "")) * 1e12;
    hit = true;
  }
  if (eok) {
    won += Number(eok[1].replace(/,/g, "")) * 1e8;
    hit = true;
  }
  if (man && !jo && !eok) {
    won += Number(man[1].replace(/,/g, "")) * 1e4;
    hit = true;
  }
  if (!hit) return parseLooseNumber(raw);
  return won;
}

export function fmtNum(n: number | null | undefined, digits = 2): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("ko-KR", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export function fmtPct(n: number | null | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

export function fmtWon(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(n / 1e12).toFixed(2)}조`;
  if (abs >= 1e8) return `${(n / 1e8).toFixed(0)}억`;
  if (abs >= 1e4) return `${(n / 1e4).toFixed(0)}만`;
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}

export function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export function mean(xs: number[]) {
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function stdev(xs: number[]) {
  if (xs.length < 2) return null;
  const m = mean(xs)!;
  const v = xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(v);
}

export function cagr(start: number, end: number, years: number) {
  if (start <= 0 || end <= 0 || years <= 0) return null;
  return (end / start) ** (1 / years) - 1;
}

export function maxDrawdown(equity: number[]) {
  let peak = -Infinity;
  let mdd = 0;
  for (const x of equity) {
    if (x > peak) peak = x;
    if (peak > 0) mdd = Math.min(mdd, x / peak - 1);
  }
  return mdd;
}

export function sma(values: number[], window: number): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= window) sum -= values[i - window];
    out.push(i >= window - 1 ? sum / window : null);
  }
  return out;
}

export function pctChange(from: number | null | undefined, to: number | null | undefined) {
  if (from == null || to == null || from === 0) return null;
  return ((to - from) / Math.abs(from)) * 100;
}

export function padCode(input: string) {
  const digits = input.replace(/\D/g, "");
  if (!digits) return input.trim();
  return digits.padStart(6, "0").slice(-6);
}

/** "2026.12" 같은 결산월이 아직 끝나지 않았으면 true (추정치 제외). */
export function isFuturePeriod(p: string) {
  const m = p.match(/(\d{4})\.(\d{2})/);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (!y || !mo) return false;
  return new Date(y, mo, 0).getTime() > Date.now();
}

export function parsePeriod(p: string): { y: number; m: number } | null {
  const hit = p.match(/(\d{4})\.(\d{2})/);
  if (!hit) return null;
  const y = Number(hit[1]);
  const m = Number(hit[2]);
  if (!y || !m) return null;
  return { y, m };
}
