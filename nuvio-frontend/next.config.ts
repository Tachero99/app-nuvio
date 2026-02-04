/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

    return [
      {
        source: "/api/menu/:slug/qr.png",
        destination: `${apiBase}/api/menu/:slug/qr.png`,
      },
      // ✅ Upload proxy
      {
        source: "/api/upload",
        destination: `${apiBase}/api/upload`,
      },
    ];
  },
};

module.exports = nextConfig;
