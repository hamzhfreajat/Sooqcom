import path from "path";
import type { NextConfig } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://sooq-com.com").replace(/\/$/, "");
const SITE_HOST = new URL(SITE_URL).host;

const nextConfig: NextConfig = {
  // The Docker image sets NEXT_OUTPUT=standalone for a self-contained server;
  // locally the normal build is used so `next start` works.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  // This folder is its own project, even though a parent folder also has a lockfile
  outputFileTracingRoot: path.join(__dirname),
  poweredByHeader: false,
  // The title, canonical address, robots and language tags are sent inside <head> to every visitor.
  // By default they are streamed into the page body for browsers and for Googlebot, and a canonical
  // or robots tag outside <head> is one search engines do not honour.
  htmlLimitedBots: /.*/,
  async redirects() {
    return [
      // One host only: "www." answers with the same pages otherwise, as a second copy of the whole site
      { source: "/:path*", has: [{ type: "host", value: `www.${SITE_HOST}` }], destination: `${SITE_URL}/:path*`, permanent: true },
      // Addresses of the previous site
      { source: "/index.html", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Browsers that have seen the site once never try it over plain http again
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
      // The site's own data endpoints are not pages
      { source: "/api/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
    ];
  },
};

export default nextConfig;
