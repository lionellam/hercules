import "server-only";
import type { ParseResult } from "./parser";

// Architecture decision 37: how long each step took, never the expense text or who parsed it
export function stopwatch() {
  const start = performance.now();
  let last = start;
  const steps: [string, number][] = [];
  let total: number | undefined;
  const totalMs = () => (total ??= Math.round(performance.now() - start));
  return {
    lap(name: string) {
      const now = performance.now();
      steps.push([name, Math.round(now - last)]);
      last = now;
    },
    header() {
      return [...steps, ["total", totalMs()] as [string, number]]
        .map(([n, ms]) => `${n};dur=${ms}`)
        .join(", ");
    },
    // How many merchants were sent, never their names
    log(outcome: string, result?: ParseResult, merchantsSent?: number) {
      const parts = [...steps.map(([n, ms]) => `${n}=${ms}ms`), `total=${totalMs()}ms`];
      if (merchantsSent !== undefined) parts.push(`merchants_sent=${merchantsSent}`);
      if (result) {
        parts.push(`using=${result.model}`);
        if (result.usage) parts.push(`tokens_in=${result.usage.input}`, `tokens_out=${result.usage.output}`);
      }
      console.log(`parse timing ${outcome} ${parts.join(" ")}`);
    },
  };
}
