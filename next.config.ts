import type { NextConfig } from "next";

const blobUrl = process.env.NEXT_PUBLIC_BLOB_BASE_URL;
const blobHostname = blobUrl ? new URL(blobUrl).hostname : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "egirdzxkimbjwf2e.public.blob.vercel-storage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      ...(blobHostname
        ? [
            {
              protocol: "https" as const,
              hostname: blobHostname,
              pathname: "/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
