import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Dev server only: lets a phone on the home network open the app via the Mac's IP or Bonjour name
  allowedDevOrigins: ["192.168.*.*", "*.local"],
};

export default nextConfig;
