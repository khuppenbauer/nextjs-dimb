/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  publicRuntimeConfig: {
    metaDataUrl: process.env.METADATA_URL,
  },
}

module.exports = nextConfig