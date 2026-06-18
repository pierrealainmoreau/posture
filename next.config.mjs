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
      { source: "/retrospective",               destination: "/toolbox/health-radar",        permanent: true },
      { source: "/retrospective/speed",         destination: "/toolbox/speed-retro",         permanent: true },
      { source: "/retrospective/speed/:path*",  destination: "/toolbox/speed-retro/:path*",  permanent: true },
      { source: "/retrospective/roti",          destination: "/toolbox/roti",                permanent: true },
      { source: "/retrospective/roti/:path*",   destination: "/toolbox/roti/:path*",         permanent: true },
      { source: "/retrospective/:path*",        destination: "/toolbox/health-radar/:path*", permanent: true },
      { source: "/mini-jeux",                    destination: "/toolbox",             permanent: true },
      { source: "/mini-jeux/:path*",            destination: "/toolbox/:path*",      permanent: true },
      { source: "/boussole",                    destination: "/toolbox/boussole",    permanent: true },
      { source: "/boussole/:path*",             destination: "/toolbox/boussole/:path*", permanent: true },
      { source: "/retrospective/speed",         destination: "/toolbox/speed-retro", permanent: true },
      { source: "/retrospective/speed/:path*",  destination: "/toolbox/speed-retro/:path*", permanent: true },
      { source: "/retrospective/roti",          destination: "/toolbox/roti",        permanent: true },
      { source: "/retrospective/roti/:path*",   destination: "/toolbox/roti/:path*", permanent: true },
      { source: "/reunion-maker/kudo-cards",    destination: "/toolbox/kudo-cards",  permanent: true },
      { source: "/reunion-maker/kudo-cards/:path*", destination: "/toolbox/kudo-cards/:path*", permanent: true },
      { source: "/reunion-maker/abcde",         destination: "/toolbox/abcde",       permanent: true },
      { source: "/reunion-maker/abcde/:path*",  destination: "/toolbox/abcde/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
