'use client';

import { useState, useEffect, Suspense, lazy } from 'react';
import { useTheme } from './hooks/useTheme';
import { motion } from 'framer-motion';

// Ленивая загрузка основного компонента
const ProductSearchApp = lazy(() => import('./components/ProductSearchApp'));
const LMStudioTestButton = lazy(() => import('./components/LMStudioTestButton'));

// Компонент загрузки
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-foreground">Загрузка приложения...</h2>
      </motion.div>
    </div>
  );
}

export default function Home() {
  const { isDarkTheme, isThemeLoaded } = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isThemeLoaded) {
      // Небольшая задержка для плавности
      const timer = setTimeout(() => setIsLoading(false), 100);
      return () => clearTimeout(timer);
    }
  }, [isThemeLoaded]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <motion.div 
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Suspense fallback={<LoadingSpinner />}>
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <LMStudioTestButton />
        </div>
        <ProductSearchApp />
      </Suspense>
    </motion.div>
  );
}
