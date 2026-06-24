import type { NextConfig } from "next";
import { withNuvio } from "@nuvio/next/with-nuvio";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withNuvio(nextConfig);
