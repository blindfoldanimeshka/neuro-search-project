'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

// Универсальные анимации для всего проекта
export const globalAnimations = {
  // Анимация появления элемента
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  
  // Анимация появления слева
  slideInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  
  // Анимация появления справа
  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  
  // Анимация масштабирования
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  
  // Анимация вращения
  rotateIn: {
    initial: { opacity: 0, rotate: -180 },
    animate: { opacity: 1, rotate: 0 },
    exit: { opacity: 0, rotate: 180 },
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  
  // Hover анимации
  hover: {
    scale: 1.02,
    transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  
  // Tap анимации
  tap: {
    scale: 0.98,
    transition: { duration: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  
  // Пульсация
  pulse: {
    animate: { 
      scale: [1, 1.05, 1],
      opacity: [1, 0.8, 1]
    },
    transition: { 
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },
  
  // Staggered анимации
  staggered: (index: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { 
      duration: 0.3, 
      delay: index * 0.1,
      ease: [0.25, 0.46, 0.45, 0.94] 
    }
  })
};

// Универсальный анимированный контейнер
interface AnimatedContainerProps {
  children: ReactNode;
  animation?: keyof typeof globalAnimations;
  className?: string;
  delay?: number;
  index?: number;
}

export function AnimatedContainer({ 
  children, 
  animation = 'fadeIn', 
  className = '',
  delay = 0,
  index
}: AnimatedContainerProps) {
  const animProps = index !== undefined 
    ? globalAnimations.staggered(index)
    : globalAnimations[animation];
  
  return (
    <motion.div
      className={className}
      {...animProps}
      transition={{
        ...animProps.transition,
        delay: delay + (animProps.transition.delay || 0)
      }}
    >
      {children}
    </motion.div>
  );
}

// Универсальная анимированная кнопка
interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  animation?: keyof typeof globalAnimations;
}

export function AnimatedButton({ 
  children, 
  onClick, 
  disabled = false, 
  className = '',
  variant = 'primary',
  size = 'md',
  animation = 'scaleIn'
}: AnimatedButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-600 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg'
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      whileHover={globalAnimations.hover}
      whileTap={globalAnimations.tap}
      {...globalAnimations[animation]}
    >
      {children}
    </motion.button>
  );
}

// Универсальная анимированная карточка
interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  animation?: keyof typeof globalAnimations;
  hover?: boolean;
}

export function AnimatedCard({ 
  children, 
  className = '',
  animation = 'fadeIn',
  hover = true
}: AnimatedCardProps) {
  return (
    <motion.div
      className={className}
      whileHover={hover ? { y: -5, transition: { duration: 0.2 } } : undefined}
      {...globalAnimations[animation]}
    >
      {children}
    </motion.div>
  );
}

// Универсальная анимированная иконка
interface AnimatedIconProps {
  children: ReactNode;
  className?: string;
  animation?: keyof typeof globalAnimations;
  pulse?: boolean;
}

export function AnimatedIcon({ 
  children, 
  className = '',
  animation = 'rotateIn',
  pulse = false
}: AnimatedIconProps) {
  return (
    <motion.div
      className={className}
      {...(pulse ? globalAnimations.pulse : globalAnimations[animation])}
    >
      {children}
    </motion.div>
  );
}

// Универсальный анимированный список
interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  animation?: keyof typeof globalAnimations;
}

export function AnimatedList({ 
  children, 
  className = '',
  animation = 'fadeIn'
}: AnimatedListProps) {
  return (
    <motion.div
      className={className}
      {...globalAnimations[animation]}
    >
      {children}
    </motion.div>
  );
}

// Универсальный анимированный загрузчик
interface AnimatedLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: string;
}

export function AnimatedLoader({ 
  size = 'md', 
  className = '',
  color = 'blue'
}: AnimatedLoaderProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };
  
  const colorClasses = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    red: 'border-red-500',
    yellow: 'border-yellow-500'
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} border-2 ${colorClasses[color]} border-t-transparent rounded-full ${className}`}
      animate={{ rotate: 360 }}
      transition={{ 
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
}

// Универсальный анимированный переключатель
interface AnimatedToggleProps {
  isOn: boolean;
  onToggle: () => void;
  className?: string;
  disabled?: boolean;
}

export function AnimatedToggle({ 
  isOn, 
  onToggle, 
  className = '',
  disabled = false
}: AnimatedToggleProps) {
  return (
    <motion.button
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        isOn ? 'bg-blue-600' : 'bg-gray-200'
      } ${className}`}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg"
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        animate={{ x: isOn ? 20 : 4 }}
      />
    </motion.button>
  );
}

// Универсальный анимированный прогресс-бар
interface AnimatedProgressProps {
  progress: number;
  className?: string;
  color?: string;
  animated?: boolean;
}

export function AnimatedProgress({ 
  progress, 
  className = '',
  color = 'blue',
  animated = true
}: AnimatedProgressProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500'
  };

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <motion.div
        className={`h-2 rounded-full ${colorClasses[color]}`}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ 
          duration: animated ? 1 : 0.3, 
          ease: [0.25, 0.46, 0.45, 0.94] 
        }}
      />
    </div>
  );
}
