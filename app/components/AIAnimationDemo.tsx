'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Brain, MessageSquare, Sparkles, Zap, Star } from 'lucide-react';
import { AnimatedMessage, AnimatedButton, AnimatedIcon, StaggeredItem } from './AIChatAnimations';

interface AIAnimationDemoProps {
  isDarkTheme: boolean;
  onClose: () => void;
}

export default function AIAnimationDemo({ isDarkTheme, onClose }: AIAnimationDemoProps) {
  const [currentDemo, setCurrentDemo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const demos = [
    {
      title: 'Появление панели',
      description: 'Плавное появление AI чат-панели справа',
      component: (
        <motion.div
          className={`w-64 h-48 rounded-lg border ${
            isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
          initial={{ x: '100%', opacity: 0, scale: 0.95 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: '100%', opacity: 0, scale: 0.95 }}
          transition={{ 
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        >
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold">AI Панель</h3>
            </div>
            <p className="text-sm text-gray-600">Плавная анимация появления</p>
          </div>
        </motion.div>
      )
    },
    {
      title: 'Анимированные кнопки',
      description: 'Интерактивные кнопки с hover эффектами',
      component: (
        <div className="flex gap-4">
          <AnimatedButton variant="primary">
            <AnimatedIcon>
              <MessageSquare className="w-4 h-4" />
            </AnimatedIcon>
            Чат
          </AnimatedButton>
          <AnimatedButton variant="secondary">
            <AnimatedIcon>
              <Sparkles className="w-4 h-4" />
            </AnimatedIcon>
            AI
          </AnimatedButton>
          <AnimatedButton variant="ghost">
            <AnimatedIcon>
              <Zap className="w-4 h-4" />
            </AnimatedIcon>
            Быстро
          </AnimatedButton>
        </div>
      )
    },
    {
      title: 'Появление сообщений',
      description: 'Анимация появления сообщений в чате',
      component: (
        <div className="space-y-4">
          <AnimatedMessage delay={0}>
            <div className={`p-3 rounded-lg ${
              isDarkTheme ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              Привет! Как дела?
            </div>
          </AnimatedMessage>
          <AnimatedMessage delay={0.2}>
            <div className={`p-3 rounded-lg ${
              isDarkTheme ? 'bg-blue-600' : 'bg-blue-500'
            } text-white`}>
              Отлично! Чем могу помочь?
            </div>
          </AnimatedMessage>
          <AnimatedMessage delay={0.4}>
            <div className={`p-3 rounded-lg ${
              isDarkTheme ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              Нужна помощь с поиском товаров
            </div>
          </AnimatedMessage>
        </div>
      )
    },
    {
      title: 'Staggered анимации',
      description: 'Поэтапное появление элементов',
      component: (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((item, index) => (
            <StaggeredItem key={item} index={index}>
              <div className={`p-4 rounded-lg border ${
                isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm text-center">Элемент {item}</p>
              </div>
            </StaggeredItem>
          ))}
        </div>
      )
    },
    {
      title: 'Пульсирующие эффекты',
      description: 'Анимации пульсации и свечения',
      component: (
        <div className="flex gap-6 items-center">
          <motion.div
            className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
            animate={{ 
              boxShadow: [
                '0 0 0 0 rgba(59, 130, 246, 0.4)',
                '0 0 0 20px rgba(59, 130, 246, 0)',
                '0 0 0 0 rgba(59, 130, 246, 0)'
              ]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeOut"
            }}
          >
            <Brain className="w-8 h-8 text-white" />
          </motion.div>
          
          <motion.div
            className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.div>
          
          <motion.div
            className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center"
            animate={{ 
              rotate: 360
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <Zap className="w-5 h-5 text-white" />
          </motion.div>
        </div>
      )
    }
  ];

  const playDemo = () => {
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 3000);
  };

  return (
    <motion.div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isDarkTheme ? 'bg-black/80' : 'bg-white/80'
      } backdrop-blur-sm`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
          isDarkTheme ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        } border`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Header */}
        <div className={`p-6 border-b ${
          isDarkTheme ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">AI Анимации Демо</h2>
              <p className={`text-sm ${
                isDarkTheme ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Демонстрация всех анимаций AI чат-панели
              </p>
            </div>
            <motion.button
              onClick={onClose}
              className={`p-2 rounded-lg ${
                isDarkTheme ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <Zap className="w-6 h-6" />
            </motion.button>
          </div>
        </div>

        {/* Navigation */}
        <div className={`p-4 border-b ${
          isDarkTheme ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex gap-2 overflow-x-auto">
            {demos.map((demo, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentDemo(index)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  currentDemo === index
                    ? 'bg-blue-500 text-white'
                    : isDarkTheme
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {demo.title}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">
              {demos[currentDemo].title}
            </h3>
            <p className={`text-sm ${
              isDarkTheme ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {demos[currentDemo].description}
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <AnimatedButton
              onClick={playDemo}
              disabled={isPlaying}
              variant="primary"
            >
              {isPlaying ? 'Воспроизводится...' : 'Воспроизвести анимацию'}
            </AnimatedButton>
          </div>

          <div className="flex justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentDemo}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                {demos[currentDemo].component}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
