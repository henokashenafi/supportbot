import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure the /data directory (for widget configs) is accessible at runtime
  // but not bundled into the client build.
  serverExternalPackages: [],

  // Add CORS headers for the widget API routes (belt-and-suspenders;
  // individual route handlers also set these explicitly)
  async headers() {
    return [
      {
        source: "/api/widget-config/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
        ],
      },
      {
        source: "/api/chat",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
      {
        // Allow widget.js to be loaded cross-origin
        source: "/widget.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
};

export default nextConfig;
