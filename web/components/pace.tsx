"use client";

// The pace note under each budgeted bar, and the burn-up chart that opens on tap (Specification Section 4.1)
import { useState } from "react";
import { fmt } from "@/lib/client";
import { shortDay } from "@/lib/dates";
import { cents, expectedBy, type PaceRow } from "@/lib/pace";

function AlertIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="8" fill="currentColor" />
      <path d="M8 4v5" stroke="var(--bg)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="11.8" r="1.1" fill="var(--bg)" />
    </svg>
  );
}

// "On pace" allows 5% of the budget either side of the amount expected by today
export function PaceNote({ total, budget, day, days }: { total: number; budget: number; day: number; days: number }) {
  const left = budget - total;
  const leftText = day < days ? `$${fmt(left)} left, about $${fmt(left / (days - day))}/day` : `$${fmt(left)} left today`;
  if (cents(total) > cents(budget)) {
    return (
      <p className="pace bad">
        <AlertIcon />
        <b>Over budget by ${fmt(total - budget)}</b>
      </p>
    );
  }
  if (cents(total) === cents(budget)) return <p className="pace"><span><b>Budget used</b> · $0.00 left</span></p>;
  const diff = total - expectedBy(budget, day, days);
  if (Math.abs(diff) <= 0.05 * budget) return <p className="pace"><span><b>On pace</b> · {leftText}</span></p>;
  return (
    <p className="pace">
      <span>
        <b>${fmt(Math.abs(diff))} {diff > 0 ? "over" : "under"} pace</b> · {leftText}
      </span>
    </p>
  );
}

// Running total against the budget spread evenly over the month
export function BurnUp({ row, budget, month, day, days }: { row: PaceRow; budget: number; month: string; day: number; days: number }) {
  const [hover, setHover] = useState<number | null>(null);
  // Runs to the edges of the open category, with small margins and no y-axis, so the plot uses most of the width
  const W = 359, H = 200, m = { l: 6, r: 6, t: 20, b: 24 };
  const pw = W - m.l - m.r, ph = H - m.t - m.b;
  const cum = row.daily.reduce<number[]>((acc, v, i) => [...acc, (i ? acc[i - 1] : 0) + v], []).map((v) => v / 100);
  const spent = cum[day];
  const over = cents(row.total) > cents(budget);
  const top = Math.max(budget, row.total) * 1.12;
  const x = (d: number) => m.l + (d / days) * pw;
  const y = (v: number) => m.t + ph - (v / top) * ph;
  const ink = over ? "var(--bad)" : "var(--bar)";
  let step = `M${x(0)} ${y(0)}`;
  for (let d = 1; d <= day; d++) step += ` L${x(d)} ${y(cum[d - 1])} L${x(d)} ${y(cum[d])}`;
  const whole = (n: number) => fmt(n).replace(/\.00$/, "");
  // Labels move so they stay clear of each other and of the lines (Specification 4.1)
  const amount = `$${fmt(spent)}`;
  const amountFitsRight = x(day) + 9 + amount.length * 6.6 <= W - 2;
  const budgetText = `Budget ${whole(budget)}`;
  const lateMonth = x(day) > x(days) - (budgetText.length * 6 + 10) - 60;
  const budgetLabelLeft = lateMonth && spent >= 0.8 * budget;
  const todayAnchor = x(day) < m.l + 18 ? "start" : x(day) > W - m.r - 18 ? "end" : "middle";
  const label = `${row.category}: $${fmt(spent)} spent by day ${day} of ${days}, $${fmt(expectedBy(budget, day, days))} expected by today against a $${fmt(budget)} monthly budget.`;

  function pick(clientX: number, el: Element) {
    const r = el.getBoundingClientRect();
    const px = ((clientX - r.left) / r.width) * W;
    setHover(Math.max(1, Math.min(day, Math.round(((px - m.l) / pw) * days))));
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const from = hover ?? day;
    setHover(Math.max(1, Math.min(day, from + (e.key === "ArrowRight" ? 1 : -1))));
  }

  const hv = hover == null ? null : { spent: cum[hover], expected: expectedBy(budget, hover, days) };
  const hoverDiff = hv ? hv.spent - hv.expected : 0;
  const spendDays = row.daily.map((v, d) => (v && d <= day ? d : 0)).filter(Boolean);

  return (
    <>
      <div className="chart">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={label}
          tabIndex={0}
          onPointerMove={(e) => pick(e.clientX, e.currentTarget)}
          onPointerDown={(e) => pick(e.clientX, e.currentTarget)}
          onPointerLeave={() => setHover(null)}
          onBlur={() => setHover(null)}
          onKeyDown={onKey}
        >
          <line x1={m.l} x2={x(days)} y1={y(0)} y2={y(0)} stroke="var(--muted)" strokeOpacity=".5" />
          <line x1={m.l} x2={x(days)} y1={y(budget)} y2={y(budget)} stroke="var(--muted)" strokeOpacity=".35" />
          <text x={budgetLabelLeft ? x(0) : x(days)} y={y(budget) - 5} textAnchor={budgetLabelLeft ? "start" : "end"} fontSize="10.5" fill="var(--muted)">
            {budgetText}
          </text>
          <line x1={x(0)} y1={y(0)} x2={x(days)} y2={y(budget)} stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="4 3" />
          <line x1={x(day)} x2={x(day)} y1={m.t - 4} y2={y(0)} stroke="var(--muted)" strokeOpacity=".7" />
          <text x={x(day)} y={m.t - 7} textAnchor={todayAnchor} fontSize="10.5" fill="var(--muted)">Today</text>
          <path d={`${step} L${x(day)} ${y(0)} Z`} fill={ink} fillOpacity=".09" />
          <path d={step} fill="none" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          {[1, 10, 20, days].map((d) => (
            <text key={d} x={d === 1 ? x(1) - 4 : x(d)} y={y(0) + 16} textAnchor={d === 1 ? "start" : d === days ? "end" : "middle"} fontSize="10.5" fill="var(--muted)">
              {d === 1 ? shortDay(month, 1).replace(/^\w+,?\s*/, "") : d}
            </text>
          ))}
          {hover != null && hv && (
            <>
              <line x1={x(hover)} x2={x(hover)} y1={m.t} y2={y(0)} stroke="var(--text)" strokeOpacity=".55" />
              <circle cx={x(hover)} cy={y(hv.expected)} r="4" fill="var(--muted)" stroke="var(--soft)" strokeWidth="2" />
              <circle cx={x(hover)} cy={y(hv.spent)} r="4" fill={ink} stroke="var(--soft)" strokeWidth="2" />
            </>
          )}
          <circle cx={x(day)} cy={y(spent)} r="4.5" fill={ink} stroke="var(--soft)" strokeWidth="2" />
          <text
            x={x(day) + (amountFitsRight ? 9 : -9)}
            y={y(spent) + (y(spent) < m.t + 12 ? 12 : -7)}
            textAnchor={amountFitsRight ? "start" : "end"}
            fontSize="11.5"
            fontWeight="600"
            fill="var(--text)"
          >
            {amount}
          </text>
        </svg>
        {hover != null && hv && (
          // Sits in the empty side of the plot so it doesn't cover the lines it describes
          <div className="tip" style={x(hover) > W / 2 ? { top: 22, left: "6%" } : { bottom: 34, right: "8%" }}>
            <div className="tip-day">{shortDay(month, hover)}</div>
            <div><span className="tip-k">Spent </span><b>${fmt(hv.spent)}</b></div>
            <div><span className="tip-k">Expected </span><b>${fmt(hv.expected)}</b></div>
            <div className="tip-k">
              {Math.abs(hoverDiff) <= 0.05 * budget ? "On pace" : `$${fmt(Math.abs(hoverDiff))} ${hoverDiff > 0 ? "over" : "under"} pace`}
            </div>
          </div>
        )}
      </div>
      <details className="daily">
        <summary>Daily figures</summary>
        {spendDays.length ? (
          <table>
            <thead>
              <tr><th>Day</th><th>Spent</th><th>Running total</th><th>Expected</th></tr>
            </thead>
            <tbody>
              {spendDays.map((d) => (
                <tr key={d}>
                  <td>{shortDay(month, d)}</td>
                  <td>{fmt(row.daily[d] / 100)}</td>
                  <td>{fmt(cum[d])}</td>
                  <td>{fmt(expectedBy(budget, d, days))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Nothing spent yet this month.</p>
        )}
      </details>
    </>
  );
}
