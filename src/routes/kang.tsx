import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell, Panel, Tone } from "@/components/shell";
import {
  KANG_PACKAGES,
  GROWTH_VALUE_FILTERS,
  GROWTH_VALUE_FACTORS,
  REBALANCE_CALENDAR,
  INTERPRETATION_FRAMES,
  currentRebalanceHint,
} from "@/lib/kang-packages";

export const Route = createFileRoute("/kang")({ component: KangPage });

function KangPage() {
  const hint = currentRebalanceHint();

  return (
    <Shell>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Kang quant packages</p>
          <h1 className="mt-1 font-display text-4xl">강환국 패키지</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            강환국은 <strong className="text-fg">특정 종목 리스트를 추천하지 않습니다</strong>. 공개하는 것은
            규칙(패키지)입니다. 아래는 성장가치·울트라·슈퍼가치의 조건, 종목이 뽑히는 이유, 해석 프레임입니다.
            분기마다 종목이 바뀌며, 과거 연복리는 소형 유니버스 백테스트 기준입니다.
          </p>
        </div>
      </div>

      <Panel className="mt-6 border-warn/30 bg-[color-mix(in_oklab,var(--color-warn)_8%,var(--color-bg-elevated))]">
        <p className="text-sm font-medium text-fg">리밸런싱</p>
        <p className="mt-1 text-sm text-muted">{hint.message}</p>
        {hint.active ? (
          <p className="mt-2 font-mono text-xs text-warn">
            현재 창: {hint.active.label} · {hint.active.window} · {hint.active.basis}
          </p>
        ) : null}
      </Panel>

      <h2 className="mt-10 font-display text-2xl">세 가지 패키지</h2>
      <p className="mt-2 text-sm text-muted">
        캔퀀트 종목 상세의 강환국 점수(슈퍼가치·울트라·성장가치)는 이 패키지 방향의 절대 점수 근사입니다. 원본은
        유니버스 내 <em>순위</em>입니다.
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {KANG_PACKAGES.map((p) => (
          <Panel key={p.id} className="flex flex-col">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{p.id}</p>
            <h3 className="mt-1 font-display text-xl">{p.name}</h3>
            <p className="mt-1 text-sm text-accent">{p.tagline}</p>
            <p className="mt-3 text-sm text-muted">
              <span className="text-fg">왜 이 패키지인가. </span>
              {p.why}
            </p>
            <p className="mt-2 text-sm text-muted">
              <span className="text-fg">해석. </span>
              {p.interpretation}
            </p>
            <div className="mt-3 space-y-2 text-xs text-muted">
              {p.valueFactors.length ? (
                <p>
                  <span className="text-fg">가치 · </span>
                  {p.valueFactors.join(" · ")}
                </p>
              ) : null}
              {p.growthFactors.length ? (
                <p>
                  <span className="text-fg">성장 · </span>
                  {p.growthFactors.join(" · ")}
                </p>
              ) : null}
              {p.qualityFactors.length ? (
                <p>
                  <span className="text-fg">퀄리티 · </span>
                  {p.qualityFactors.join(" · ")}
                </p>
              ) : null}
            </div>
            <p className="mt-3 border-t border-border pt-3 text-xs text-muted">{p.historicalNote}</p>
            <p className="mt-2 text-xs text-down/90">{p.riskNote}</p>
          </Panel>
        ))}
      </div>

      <h2 className="mt-12 font-display text-2xl">성장가치 20 · 스크리닝 체크리스트</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        원안: 필터 후 가치 4 + 성장 4의 <strong className="text-fg">평균순위 상위 20</strong>, 동일비중, 분기 1회
        교체. 점수가 아니라 순위입니다.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel>
          <h3 className="font-medium">필터 순서</h3>
          <ol className="mt-3 space-y-2">
            {GROWTH_VALUE_FILTERS.map((f) => (
              <li key={f.step} className="flex gap-3 text-sm">
                <span className="font-mono text-muted">{f.step}</span>
                <span>
                  <span className="text-fg">{f.label}</span>
                  <span className="mt-0.5 block text-xs text-muted">{f.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel>
          <h3 className="font-medium">리밸런싱 달력</h3>
          <ul className="mt-3 space-y-2">
            {REBALANCE_CALENDAR.map((r) => (
              <li
                key={r.id}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  hint.active?.id === r.id ? "border-warn/40 bg-[color-mix(in_oklab,var(--color-warn)_6%,transparent)]" : "border-border"
                }`}
              >
                <span className="font-mono text-xs text-muted">{r.label}</span>
                <span className="ml-2 text-fg">{r.window}</span>
                <span className="mt-0.5 block text-xs text-muted">{r.basis}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">실적 공시가 끝난 뒤 실행. 미공시 실적으로 순위를 매기지 말 것.</p>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel>
          <h3 className="font-medium">가치 4 · 낮을수록 1등</h3>
          <ul className="mt-3 space-y-2">
            {GROWTH_VALUE_FACTORS.value.map((f) => (
              <li key={f.key} className="text-sm">
                <span className="text-fg">{f.key}</span>
                <span className="ml-2 font-mono text-[11px] text-muted">{f.dir}</span>
                <span className="mt-0.5 block text-xs text-muted">{f.def}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <h3 className="font-medium">성장 4 · 높을수록 1등 (전년 동기 YoY)</h3>
          <ul className="mt-3 space-y-2">
            {GROWTH_VALUE_FACTORS.growth.map((f) => (
              <li key={f.key} className="text-sm">
                <span className="text-fg">{f.key}</span>
                <span className="ml-2 font-mono text-[11px] text-muted">{f.dir}</span>
                <span className="mt-0.5 block text-xs text-muted">{f.def}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel className="mt-4">
        <h3 className="font-medium">순위 → 20종목</h3>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>필터 통과 종목만으로 가치 4·성장 4 각각 순위</li>
          <li>8개 순위의 산술평균 (결측 규칙은 사전에 하나로 고정)</li>
          <li>평균순위 오름차순 상위 20 · 동일비중 5%</li>
          <li>동점 시 시총 더 작거나 영업이익 YoY 순위 우선 — 미리 하나만 정함</li>
        </ol>
      </Panel>

      <h2 className="mt-12 font-display text-2xl">종목이 뽑혔을 때 해석</h2>
      <p className="mt-2 text-sm text-muted">
        “추천 종목”이 아니라, 규칙 결과 종목을 어떻게 읽을지입니다. 캔퀀트 종목 페이지의 가치·성장·울트라
        점수와 맞춰 보세요.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {INTERPRETATION_FRAMES.map((f) => (
          <Panel key={f.title}>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-medium">{f.title}</h3>
              <Tone status="watch">{f.pattern}</Tone>
            </div>
            <p className="mt-2 text-sm text-muted">{f.read}</p>
            <p className="mt-2 text-xs text-fg">{f.action}</p>
          </Panel>
        ))}
      </div>

      <Panel className="mt-8">
        <h3 className="font-medium">캔퀀트에서 확인하는 법</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>
            종목 검색 후 상세의 <strong className="text-fg">강환국 팩터</strong> — 가치·퀄리티·성장·슈퍼가치·울트라·성장가치
            점수와 플래그(가치함정·대형·금융·지주).
          </li>
          <li>
            하이브리드는 CANSLIM 55% + 울트라 35% + M 10%. 약세장이면 추가 헤어컷.
          </li>
          <li>
            시총 상위 유니버스(코스피·코스닥 상위)는 소형 성장가치 원안과 다릅니다. 소형 필터는 직접 스크리닝(퀀터스
            등)에서 적용하세요.
          </li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/"
            className="rounded-sm border border-border px-3 py-2 text-sm text-muted transition-colors hover:text-fg"
          >
            종목 검색
          </Link>
          <Link
            to="/guide"
            className="rounded-sm border border-border px-3 py-2 text-sm text-muted transition-colors hover:text-fg"
          >
            방법론
          </Link>
          <Link
            to="/backtest"
            className="rounded-sm border border-border px-3 py-2 text-sm text-muted transition-colors hover:text-fg"
          >
            백테스트
          </Link>
        </div>
      </Panel>

      <p className="mt-8 text-xs text-subtle">
        투자 권유가 아닙니다. 강환국 공개 전략의 규칙·해석을 정리한 연구 화면이며, 실제 편입 종목은 분기 데이터와
        시총 순위에 따라 달라집니다. 손실 한도와 실행은 본인 책임입니다.
      </p>
    </Shell>
  );
}
