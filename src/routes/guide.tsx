import { createFileRoute } from "@tanstack/react-router";
import { Shell, Panel } from "@/components/shell";

export const Route = createFileRoute("/guide")({ component: Guide });

const letters = [
  {
    k: "C",
    t: "Current Quarterly Earnings",
    d: "최근 분기 EPS(또는 순이익)가 전년 동기 대비 최소 +18%, 이상적 +25~50% 이상. 매출도 같이 늘고, 성장률이 가속해야 한다. 오닐은 아직 안 난 실적을 맞히지 말고 이미 찍힌 급증을 사라고 했다. 강환국 C는 분기 매출·이익·가속 비율의 순위화.",
  },
  {
    k: "A",
    t: "Annual Earnings Increase",
    d: "최근 3년 연간 이익이 매년 증가, 연 25% 전후, ROE 17%+. 강환국 2023년 ‘반쪽 CANSLIM’은 A·L·M을 빼고도 연복리 50.4%가 나왔다고 밝혔지만, 빠진 세 조건은 리스크 관리의 핵심이다.",
  },
  {
    k: "N",
    t: "New",
    d: "신제품·신산업·신경영진 + 신고가. 컵위드핸들, 이중바닥, 플랫베이스의 피벗에서 매수하고 피벗 대비 +5% 이상 추격하지 않는다. 베이스는 보통 8주 이상. 신고가는 위험이 아니라 수요다.",
  },
  {
    k: "S",
    t: "Supply and Demand",
    d: "유통 물량이 적고, 돌파 때 평균 대비 거래량 +40~50% 이상. 자사주 매입은 공급 감소. 강환국이 시총 하위 20%를 고수하는 이유. 시총 상위 50은 이 조건에서 구조적으로 불리하다.",
  },
  {
    k: "L",
    t: "Leader or Laggard",
    d: "RS 80+ (가능하면 87~95). 주도 산업의 1등만. 같은 업종에서 안 오른 종목을 ‘아직 안 올라서 싸다’고 사는 것이 오닐이 가장 금지한 실수. 한국 초소형주는 역모멘텀이 나타나기도 하므로 유니버스를 구분해야 한다.",
  },
  {
    k: "I",
    t: "Institutional Sponsorship",
    d: "질 좋은 기관이 들어오기 시작해야 한다. 0도 문제, 이미 모든 펀드가 만차인 것도 문제. 한국에서는 외국인 소진율·컨센서스·목표가 괴리를 대리변수로 쓴다.",
  },
  {
    k: "M",
    t: "Market Direction",
    d: "종목의 75%는 시장을 따른다. 분배일(하락+거래량 증가)이 25거래일 내 5회면 랠리 종료 경고. 조정 후 4~10거래일 사이 지수 +1.5% 이상·거래량 증가가 폴로스루 데이. 약세장에서는 현금. 강환국 반쪽 전략이 A·L·M을 뺀 이유이자, 실전에서 가장 위험한 생략.",
  },
];

function Guide() {
  return (
    <Shell>
      <h1 className="font-display text-4xl">방법론</h1>
      <p className="mt-3 max-w-2xl text-muted">
        이 데스크는 오닐의 체크리스트를 생략하지 않습니다. 강환국 팩터는 그 위에 한국 시장에서 검증된 계량 층을
        올립니다. 백테스트 숫자는 과거이며, 소형주 전략의 역사적 연복리를 대형주에 이식하면 안 됩니다.
      </p>
      <div className="mt-8 grid gap-3">
        {letters.map((l) => (
          <Panel key={l.k}>
            <p className="font-display text-3xl text-accent">{l.k}</p>
            <h2 className="mt-1 font-medium">{l.t}</h2>
            <p className="mt-2 text-sm text-muted">{l.d}</p>
          </Panel>
        ))}
      </div>
      <Panel className="mt-6">
        <h2 className="font-display text-2xl">강환국 층</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>슈퍼가치: PER·PBR 등 다중 저평가.</li>
          <li>울트라: 가치 + 퀄리티 + 펀더멘털 모멘텀. 소형 적용 시 과거 연 30~40%대, MDD 50%대.</li>
          <li>성장가치: 저평가 + 성장. 소형 하위 20%에서 과거 연 ~45%, MDD ~57%.</li>
          <li>필터: 관리·적자·금융·지주·중국기업 제외가 기본. 이 앱은 시총 상위도 분석하므로 필터를 강제하지 않고 경고한다.</li>
          <li>계절성: 한국 주식은 11~4월이 통계적으로 강했다. M과 겹쳐 해석.</li>
        </ul>
      </Panel>
      <Panel className="mt-4">
        <h2 className="font-display text-2xl">Grok이 덧붙인 규칙</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>저PBR + 저ROE는 가치함정으로 표시한다.</li>
          <li>M이 실패면 하이브리드 점수를 깎는다. 오닐을 무시하고 퀀트만 돌리지 않는다.</li>
          <li>대형주는 S 감점. ‘반쪽 전략’의 고수익을 삼성전자에 기대지 말 것.</li>
          <li>피벗 없이 수직 급등한 한국 테마주는 N을 통과한 것이 아니다.</li>
        </ul>
      </Panel>
    </Shell>
  );
}
