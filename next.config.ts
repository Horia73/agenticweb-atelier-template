import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Provider-ul Studioului poate rula două dev-servere pe același folder;
  // fiecare primește un distDir propriu prin env.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};
export default nextConfig;
