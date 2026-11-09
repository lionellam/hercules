import { execSync } from "node:child_process";
import type { NextConfig } from "next";
import pkg from "./package.json";

// Shown at the bottom of Settings: the version, the exact commit, and when this version was built
function commit() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_APP_COMMIT: commit(),
    NEXT_PUBLIC_APP_BUILT_AT: new Date().toISOString(),
  },
  partialPrefetching: true,
  // Dev server only: lets a phone on the home network open the app via the Mac's IP or Bonjour name
  allowedDevOrigins: ["192.168.*.*", "*.local"],
};

export default nextConfig;
