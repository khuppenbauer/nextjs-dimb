/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  publicRuntimeConfig: {
    baseUrl: process.env.BASE_URL,
    apiBaseUrl: process.env.API_BASE_URL,
  },
}

module.exports = nextConfig