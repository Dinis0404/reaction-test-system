/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Vercel部署配置 - 优化配置
  swcMinify: true,
  // 图片优化
  images: {
    unoptimized: true, // Vercel会自动优化
  },
  // 启用ESLint
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
  // 启用TypeScript检查
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  // API路由配置 - 使用正确的配置项
  experimental: {
    esmExternals: false,
  },
  // 输出配置 - 确保静态文件正确生成
  output: 'standalone',
  // 压缩配置
  compress: true,
  // 生产环境优化
  poweredByHeader: false,
  // 禁用trailingSlash以避免308重定向
  trailingSlash: false,
  // 静态资源处理
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
}

module.exports = nextConfig




