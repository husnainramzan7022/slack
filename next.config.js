/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Enable type checking during builds
    ignoreBuildErrors: false,
  },
  eslint: {
    // Enable ESLint during builds
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig