import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Native / Node-only packages stay out of the server bundle.
  serverExternalPackages: ["better-sqlite3", "unpdf", "mammoth"],
  // Files read at run time by paths the bundler cannot see; without them a serverless host leaves them out of the deployment.
  outputFileTracingIncludes: {
    "/*": ["./content/books/**/*"],
    "/pyodide/*": ["./node_modules/pyodide/*.{mjs,wasm,zip,json}"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // The Pyodide files only change with the package version.
      { source: "/pyodide/:file", headers: [{ key: "Cache-Control", value: "public, max-age=604800, immutable" }] },
    ];
  },
};

export default nextConfig;
