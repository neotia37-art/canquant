import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Bar } from "@/lib/types";

const tick = { fill: "var(--color-subtle)", fontSize: 11 };
const tooltipStyle = {
  background: "var(--color-bg-elevated)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--color-fg)",
};

export function PriceChart({ bars, height = 240 }: { bars: Bar[]; height?: number }) {
  const data = bars.slice(-180).map((b) => ({
    date: b.date.slice(5),
    close: b.close,
  }));
  if (!data.length) return <p className="text-sm text-muted">차트 데이터가 없습니다.</p>;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" tick={tick} axisLine={false} tickLine={false} minTickGap={28} />
          <YAxis domain={["auto", "auto"]} tick={tick} axisLine={false} tickLine={false} width={56} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="close" stroke="var(--color-accent)" strokeWidth={1.6} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function EquityChart({
  series,
}: {
  series: { id: string; name: string; color: string; points: { date: string; value: number }[] }[];
}) {
  const dates = new Set<string>();
  for (const s of series) for (const p of s.points) dates.add(p.date);
  const ordered = [...dates].sort();
  const data = ordered.map((date) => {
    const row: Record<string, string | number> = { date: date.slice(0, 7) };
    for (const s of series) {
      const p = s.points.find((x) => x.date === date);
      if (p) row[s.id] = Number((p.value * 100).toFixed(1));
    }
    return row;
  });
  if (!data.length) return null;
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" tick={tick} axisLine={false} tickLine={false} minTickGap={32} />
          <YAxis tick={tick} axisLine={false} tickLine={false} width={44} />
          <Tooltip contentStyle={tooltipStyle} />
          {series.map((s) => (
            <Line
              key={s.id}
              type="monotone"
              dataKey={s.id}
              name={s.name}
              stroke={s.color}
              strokeWidth={1.6}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
