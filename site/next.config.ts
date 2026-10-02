import type { NextConfig } from "next";

// EdgeOne Makers serves static files. The site has no server features, so a
// static export is the whole build. `images.unoptimized` is required because
// the default image optimiser needs a server.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
