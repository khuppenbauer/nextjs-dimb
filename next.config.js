/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  publicRuntimeConfig: {
    metaDataUrl: process.env.METADATA_URL,
    baseUrl: process.env.BASE_URL,
  },
  env: {
    metaDataUrl: process.env.METADATA_URL,
  }
}

module.exports = nextConfig