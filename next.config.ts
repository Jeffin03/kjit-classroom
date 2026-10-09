import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Avatars come straight from the GitHub API (`avatar_url`).
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "github.com" },
    ],
  },
};

export default nextConfig;
