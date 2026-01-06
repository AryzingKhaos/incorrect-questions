/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DASHSCOPE_API_KEY: process.env.DASHSCOPE_API_KEY,
  },
}

module.exports = nextConfig
