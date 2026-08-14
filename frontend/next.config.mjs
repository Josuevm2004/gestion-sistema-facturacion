import fs from 'fs';
import path from 'path';

// Automatic copy of logo.jpeg into public directory
try {
  const rootLogo = path.resolve('../logo.jpeg');
  const publicDir = path.resolve('./public');
  const destLogo = path.resolve('./public/logo.jpeg');

  if (fs.existsSync(rootLogo)) {
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.copyFileSync(rootLogo, destLogo);
  }
} catch (err) {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const target = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    const cleanTarget = target.endsWith('/') ? target.slice(0, -1) : target;
    return [
      {
        source: '/api/:path*',
        destination: `${cleanTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
