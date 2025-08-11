'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface AIStatusIndicatorProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
  isDarkTheme: boolean;
  className?: string;
}

export default function AIStatusIndicator({ 
  status, 
  message, 
  isDarkTheme, 
  className = '' 
}: AIStatusIndicatorProps) {
  const statusConfig = {
    idle: {
      icon: Brain,
      color: isDarkTheme ? 'text-blue-400' : 'text-blue-600',
      bgColor: isDarkTheme ? 'bg-blue-500/10' : 'bg-blue-50',
      borderColor: isDarkTheme ? 'border-blue-500/20' : 'border-blue-200',
      message: 'AI готов к работе'
    },
    loading: {
      icon: Loader2,
      color: isDarkTheme ? 'text-yellow-400' : 'text-yellow-600',
      bgColor: isDarkTheme ? 'bg-yellow-500/10' : 'bg-yellow-50',
      borderColor: isDarkTheme ? 'border-yellow-500/20' : 'border-yellow-200',
      message: 'AI обрабатывает запрос...'
    },
    success: {
      icon: CheckCircle,
      color: isDarkTheme ? 'text-green-400' : 'text-green-600',
      bgColor: isDarkTheme ? 'bg-green-500/10' : 'bg-green-50',
      borderColor: isDarkTheme ? 'border-green-500/20' : 'border-green-200',
      message: 'Запрос выполнен успешно'
    },
    error: {
      icon: AlertCircle,
      color: isDarkTheme ? 'text-red-400' : 'text-red-600',
      bgColor: isDarkTheme ? 'bg-red-500/10' : 'bg-red-50',
      borderColor: isDarkTheme ? 'border-red-500/20' : 'border-red-200',
      message: 'Произошла ошибка'
    }
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${config.bgColor} ${config.borderColor} ${className}`}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ 
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
      >
        <motion.div
          className={`${config.color}`}
          initial={{ rotate: -180, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 180, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {status === 'loading' ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ 
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <IconComponent size={20} />
            </motion.div>
          ) : (
            <IconComponent size={20} />
          )}
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex-1"
        >
          <p className={`text-sm font-medium ${config.color}`}>
            {message || config.message}
          </p>
        </motion.div>
        
        {/* Пульсирующий индикатор для загрузки */}
        {status === 'loading' && (
          <motion.div
            className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [1, 0.5, 1]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
} 