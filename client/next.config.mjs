// Ad, category and avatar photos live in the R2 bucket; next/image may only load from that host.
const imageBase = process.env.NEXT_PUBLIC_IMAGE_BASE_URL ? new URL(process.env.NEXT_PUBLIC_IMAGE_BASE_URL) : null;

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: imageBase
      ? [{ protocol: imageBase.protocol.replace(":", ""), hostname: imageBase.hostname, port: imageBase.port, pathname: "/**" }]
      : [],
  },
};

export default nextConfig;
