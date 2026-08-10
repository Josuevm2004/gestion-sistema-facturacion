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
const nextConfig = { reactStrictMode: true };

export default nextConfig;
