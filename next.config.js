/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // ssh2 (used by ssh2-sftp-client) loads a native .node addon, which cannot be
  // bundled; load these from node_modules at runtime instead.
  serverExternalPackages: ["ssh2", "ssh2-sftp-client"],
  images: {
    // Remote hosts rendered through next/image (MapCard, InfrastructureMapCard, ...)
    remotePatterns: [
      { protocol: "https", hostname: "wowfy.in" }, // uploads + profile pictures (BASE_IMG_URL)
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google sign-in avatars
    ],
  },
};

module.exports = nextConfig;
