/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permite imagens externas se necessário no futuro
  images: {
    domains: [],
  },
};

module.exports = nextConfig;
