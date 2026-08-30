import type { NextConfig } from "next";

const blobUrl = process.env.NEXT_PUBLIC_BLOB_BASE_URL?.trim();
const blobHostname = (() => {
  if (!blobUrl) return null;
  try {
    return new URL(blobUrl).hostname;
  } catch {
    return null;
  }
})();

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
