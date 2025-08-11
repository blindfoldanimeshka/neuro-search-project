import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Базовая конфигурация
  reactStrictMode: true,
  
  // Оптимизация изображений
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['localhost'],
  },
  
  // Оптимизация компиляции TypeScript
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  
  // Оптимизация ESLint
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  
  // Экспериментальные оптимизации
  experimental: {
    // Ускоряет компиляцию
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },
  
  // Оптимизация вебпака
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Отключаем некоторые проверки в режиме разработки
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.next', '**/logs'],
      };
    }
    
    // Оптимизация для тяжелых библиотек
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        'puppeteer': 'puppeteer',
      });
    }
    
    return config;
  },
};

export default nextConfig;
