"use client";

// Placeholders shown while a screen's data loads for the first time (Specification step 8): grey shapes the size
// of what's coming, with a soft shimmer (still with Reduce Motion), and a note if it takes a while
import { useEffect, useState } from "react";

const SLOW_MS = 3000;

// One placeholder shape; sizes in pixels, or any CSS length
export function SkeletonBar({ width, height, className = "" }: { width: number | string; height: number; className?: string }) {
  return <span className={`sk ${className}`} style={{ width, height }} aria-hidden="true" />;
}

// Placeholder rows shaped like expense rows: a name, a category under it, and an amount
const ROW_WIDTHS: [number, number, number][] = [[120, 84, 44], [150, 70, 40], [100, 92, 48], [136, 64, 42]];
export function SkeletonRows({ count, from = 0 }: { count: number; from?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const [name, category, amount] = ROW_WIDTHS[(from + i) % ROW_WIDTHS.length];
        return (
          <div className="sk-row" key={i} aria-hidden="true">
            <span className="sk-l">
              <SkeletonBar width={name} height={13} />
              <SkeletonBar width={category} height={10} />
            </span>
            <SkeletonBar width={amount} height={13} />
          </div>
        );
      })}
    </>
  );
}

// Placeholder category bars for Summary: a name and an amount above a bar
const CAT_WIDTHS: [number, number, string][] = [[90, 80, "80%"], [70, 90, "55%"], [110, 60, "35%"], [80, 70, "20%"]];
export function SkeletonCategories() {
  return (
    <>
      {CAT_WIDTHS.map(([name, amount, bar], i) => (
        <div className="cat" key={i} aria-hidden="true">
          <div className="cat-top sk-cat-top">
            <SkeletonBar width={name} height={12} />
            <SkeletonBar width={amount} height={12} />
          </div>
          <div className="track"><SkeletonBar width={bar} height={6} className="sk-fill" /></div>
        </div>
      ))}
    </>
  );
}

// "Taking a little longer than usual…", once loading has gone on for 3 seconds. Rendered only while loading,
// so it goes as soon as the data arrives
export function SlowNote() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_MS);
    return () => clearTimeout(timer);
  }, []);
  return (
    <p className="slow-note" role="status">
      {slow ? "Taking a little longer than usual. Hercules is starting up after a quiet spell." : <span className="visually-hidden">Loading</span>}
    </p>
  );
}
