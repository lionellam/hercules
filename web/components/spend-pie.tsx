"use client";

import { fmt } from "@/lib/client";
import type { SummaryRow } from "@/lib/types";

const MAX_SLICES = 6;

// Expects rows sorted largest first; beyond six slices, the smallest are grouped so each stays readable
export default function SpendPie({ rows }: { rows: SummaryRow[] }) {
  const total = rows.reduce((s, r) => s + r.total, 0);
  const shown = rows.length > MAX_SLICES ? rows.slice(0, MAX_SLICES - 1) : rows;
  const rest = rows.slice(shown.length);
  const slices = shown.map((r, i) => ({ name: r.category, total: r.total, color: `var(--pie-${i + 1})` }));
  if (rest.length) {
    slices.push({ name: `Everything else (${rest.length})`, total: rest.reduce((s, r) => s + r.total, 0), color: "var(--pie-rest)" });
  }
  const percent = (value: number) => {
    const p = (value / total) * 100;
    if (p < 1) return "<1%";
    return p > 99 && p < 100 ? ">99%" : `${Math.round(p)}%`;
  };
  const point = (fraction: number) => {
    const angle = 2 * Math.PI * fraction;
    return `${50 + 50 * Math.sin(angle)} ${50 - 50 * Math.cos(angle)}`;
  };

  return (
    <>
      <p className="recent-h">SHARE OF SPEND</p>
      <div className="pie">
        <svg viewBox="0 0 100 100" role="img" aria-label={slices.map((s) => `${s.name} ${percent(s.total)}`).join(", ")}>
          {slices.map((s, i) => {
            const start = slices.slice(0, i).reduce((sum, p) => sum + p.total, 0) / total;
            const fraction = s.total / total;
            const title = <title>{`${s.name}: $${fmt(s.total)} (${percent(s.total)})`}</title>;
            // An arc can't start and end at the same point, so a lone category is a plain circle
            if (slices.length === 1) {
              return (
                <circle key={s.name} cx="50" cy="50" r="50" fill={s.color}>
                  {title}
                </circle>
              );
            }
            const d = `M50 50 L${point(start)} A50 50 0 ${fraction > 0.5 ? 1 : 0} 1 ${point(start + fraction)} Z`;
            return (
              <path key={s.name} d={d} fill={s.color}>
                {title}
              </path>
            );
          })}
        </svg>
        <ul>
          {slices.map((s) => (
            <li key={s.name}>
              <span className="swatch" style={{ background: s.color }} />
              <span className="name">{s.name}</span>
              <span className="pct">{percent(s.total)}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
