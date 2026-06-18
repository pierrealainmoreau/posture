/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async redirects() {
    return [
      { source: "/boussole",                    destination: "/mini-jeux/boussole",    permanent: true },
      { source: "/boussole/:path*",             destination: "/mini-jeux/boussole/:path*", permanent: true },
      { source: "/retrospective/speed",         destination: "/mini-jeux/speed-retro", permanent: true },
      { source: "/retrospective/speed/:path*",  destination: "/mini-jeux/speed-retro/:path*", permanent: true },
      { source: "/retrospective/roti",          destination: "/mini-jeux/roti",        permanent: true },
      { source: "/retrospective/roti/:path*",   destination: "/mini-jeux/roti/:path*", permanent: true },
      { source: "/reunion-maker/kudo-cards",    destination: "/mini-jeux/kudo-cards",  permanent: true },
      { source: "/reunion-maker/kudo-cards/:path*", destination: "/mini-jeux/kudo-cards/:path*", permanent: true },
      { source: "/reunion-maker/abcde",         destination: "/mini-jeux/abcde",       permanent: true },
      { source: "/reunion-maker/abcde/:path*",  destination: "/mini-jeux/abcde/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
