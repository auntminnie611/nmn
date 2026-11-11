import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow .js imports to resolve to .ts files (used by cursor/identity.ts)
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
      ".cjs": [".cts", ".cjs"],
    };
    return config;
  },
};

export default nextConfig;
