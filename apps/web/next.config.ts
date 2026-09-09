import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@x402/core", "@x402/svm", "@coinbase/cdp-sdk"],
};

export default nextConfig;
