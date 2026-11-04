import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a standalone server bundle for Docker hosts. Vercel builds its own
  // deployment output, so leave standalone mode off there.
  output: process.env.VERCEL ? undefined : "standalone",
  outputFileTracingRoot: process.cwd(),
  reactStrictMode: true,
};

export default nextConfig;
