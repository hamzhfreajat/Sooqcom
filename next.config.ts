import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Docker image sets NEXT_OUTPUT=standalone for a self-contained server;
  // locally the normal build is used so `next start` works.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  // This folder is its own project, even though a parent folder also has a lockfile
  outputFileTracingRoot: path.join(__dirname),
  poweredByHeader: false,
  async redirects() {
    return [
      // Addresses of the previous site
      { source: "/index.html", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
