import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Startup logoUrl is a user-submitted URL from any site (registration form,
    // no upload/storage step) — has to allow arbitrary hosts or next/image 500s
    // on the first logo from an unlisted domain.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
