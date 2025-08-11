'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { ReactNode } from 'react';

interface AnimatedNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export default function AnimatedNotification({
  isVisible,
  onClose,
  title,
  message,
  type = 'info',
  duration = 5000,
  position = 'top-right'
}: AnimatedNotificationProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-500',
      textColor: 'text-green-800',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600'
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-500',
      textColor: 'text-red-800',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-500',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600'
    }
  };

  const config = typeConfig[type];
  const IconComponent = config.icon;

  const notificationVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8, 
      y: position.includes('top') ? -50 : 50,
      x: position.includes('right') ? 50 : position.includes('left') ? -50 : 0
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      x: 0
    },
    exit: { 
      opacity: 0, 
      scale: 0.8, 
      y: position.includes('top') ? -50 : 50,
      x: position.includes('right') ? 50 : position.includes('left') ? -50 : 0
    }
  };

  const progressVariants = {
    initial: { width: '100%' },
    animate: { 
      width: '0%'
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed z-50 ${positionClasses[position]} max-w-sm w-full`}
          variants={notificationVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className={`bg-white border ${config.borderColor} shadow-lg overflow-hidden`}>
            {/* Progress bar */}
            <motion.div
              className={`h-1 ${config.bgColor}`}
              variants={progressVariants}
              initial="initial"
              animate="animate"
            />
            
            <div className="p-4">
              <div className="flex items-start">
                <motion.div
                  className={`flex-shrink-0 ${config.iconColor}`}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    duration: 0.3, 
                    ease: "easeOut",
                    delay: 0.1
                  }}
                >
                  <IconComponent className="w-5 h-5" />
                </motion.div>
                
                <div className="ml-3 flex-1">
                  <motion.h3 
                    className={`text-sm font-medium ${config.textColor}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    {title}
                  </motion.h3>
                  
                  {message && (
                    <motion.p 
                      className={`mt-1 text-sm ${config.textColor} opacity-80`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                    >
                      {message}
                    </motion.p>
                  )}
                </div>
                
                <motion.button
                  onClick={onClose}
                  className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.2 }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 