'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Search, 
  Filter, 
  Download, 
  Settings, 
  Star, 
  Heart, 
  ShoppingCart,
  Plus,
  Minus,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Play,
  Pause
} from 'lucide-react';
import { 
  AnimatedContainer, 
  AnimatedButton, 
  AnimatedCard, 
  AnimatedIcon, 
  AnimatedToggle,
  AnimatedProgress,
  AnimatedLoader,
  globalAnimations 
} from './AnimatedElements';

interface GlobalAnimationDemoProps {
  isDarkTheme: boolean;
  onClose: () => void;
}

export default function GlobalAnimationDemo({ isDarkTheme, onClose }: GlobalAnimationDemoProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [toggleState, setToggleState] = useState(false);
  const [progress, setProgress] = useState(0);

  const sections = [
    {
      title: 'Основные анимации',
      description: 'Базовые анимации появления и взаимодействия',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <AnimatedContainer animation="fadeIn" delay={0.1}>
              <AnimatedCard className={`p-4 rounded-lg border ${
                isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h3 className="font-semibold mb-2">Fade In</h3>
                <p className="text-sm text-gray-600">Плавное появление</p>
              </AnimatedCard>
            </AnimatedContainer>
            
            <AnimatedContainer animation="slideInLeft" delay={0.2}>
              <AnimatedCard className={`p-4 rounded-lg border ${
                isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h3 className="font-semibold mb-2">Slide In Left</h3>
                <p className="text-sm text-gray-600">Появление слева</p>
              </AnimatedCard>
            </AnimatedContainer>
            
            <AnimatedContainer animation="slideInRight" delay={0.3}>
              <AnimatedCard className={`p-4 rounded-lg border ${
                isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h3 className="font-semibold mb-2">Slide In Right</h3>
                <p className="text-sm text-gray-600">Появление справа</p>
              </AnimatedCard>
            </AnimatedContainer>
            
            <AnimatedContainer animation="scaleIn" delay={0.4}>
              <AnimatedCard className={`p-4 rounded-lg border ${
                isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h3 className="font-semibold mb-2">Scale In</h3>
                <p className="text-sm text-gray-600">Масштабирование</p>
              </AnimatedCard>
            </AnimatedContainer>
          </div>
        </div>
      )
    },
    {
      title: 'Интерактивные элементы',
      description: 'Кнопки, переключатели и другие интерактивные компоненты',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <h4 className="font-semibold">Кнопки</h4>
              <div className="space-y-2">
                <AnimatedButton variant="primary" size="sm">
                  <Search className="w-4 h-4 mr-2" />
                  Поиск
                </AnimatedButton>
                <AnimatedButton variant="secondary" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Фильтры
                </AnimatedButton>
                <AnimatedButton variant="ghost" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Настройки
                </AnimatedButton>
                <AnimatedButton variant="danger" size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Удалить
                </AnimatedButton>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Переключатели</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Темная тема</span>
                  <AnimatedToggle 
                    isOn={toggleState} 
                    onToggle={() => setToggleState(!toggleState)} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Уведомления</span>
                  <AnimatedToggle 
                    isOn={!toggleState} 
                    onToggle={() => setToggleState(!toggleState)} 
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold">Прогресс и загрузка</h4>
            <div className="space-y-4">
              <AnimatedProgress progress={progress} animated={true} />
              <div className="flex gap-4">
                <AnimatedButton 
                  size="sm" 
                  onClick={() => setProgress(Math.max(0, progress - 10))}
                >
                  <Minus className="w-4 h-4" />
                </AnimatedButton>
                <AnimatedButton 
                  size="sm" 
                  onClick={() => setProgress(Math.min(100, progress + 10))}
                >
                  <Plus className="w-4 h-4" />
                </AnimatedButton>
                <AnimatedButton 
                  size="sm" 
                  onClick={() => setProgress(0)}
                >
                  <RotateCcw className="w-4 h-4" />
                </AnimatedButton>
              </div>
              <div className="flex gap-4">
                <AnimatedLoader size="sm" color="blue" />
                <AnimatedLoader size="md" color="green" />
                <AnimatedLoader size="lg" color="red" />
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Staggered анимации',
      description: 'Поэтапное появление элементов',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((item, index) => (
              <AnimatedContainer key={item} index={index}>
                <AnimatedCard className={`p-4 rounded-lg border ${
                  isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-center mb-2">
                    <AnimatedIcon>
                      <Star className="w-6 h-6 text-yellow-500" />
                    </AnimatedIcon>
                  </div>
                  <h3 className="font-semibold text-center">Элемент {item}</h3>
                  <p className="text-sm text-gray-600 text-center">
                    Staggered анимация
                  </p>
                </AnimatedCard>
              </AnimatedContainer>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'CSS анимации',
      description: 'Кастомные CSS анимации',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border animate-bounce-in ${
              isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className="font-semibold mb-2">Bounce In</h3>
              <p className="text-sm text-gray-600">Анимация с отскоком</p>
            </div>
            
            <div className={`p-4 rounded-lg border animate-spin-in ${
              isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className="font-semibold mb-2">Spin In</h3>
              <p className="text-sm text-gray-600">Анимация с вращением</p>
            </div>
            
            <div className={`p-4 rounded-lg border animate-zoom-in ${
              isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className="font-semibold mb-2">Zoom In</h3>
              <p className="text-sm text-gray-600">Анимация с зумом</p>
            </div>
            
            <div className={`p-4 rounded-lg border animate-slide-in ${
              isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className="font-semibold mb-2">Slide In</h3>
              <p className="text-sm text-gray-600">Анимация со слайдом</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Практические примеры',
      description: 'Реальные примеры использования анимаций',
      component: (
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-semibold">Карточка товара</h4>
            <AnimatedCard className={`p-4 rounded-lg border ${
              isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-8 h-8 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Название товара</h3>
                  <p className="text-sm text-gray-600">Описание товара</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <AnimatedButton size="sm" variant="primary">
                      <Heart className="w-4 h-4" />
                    </AnimatedButton>
                    <AnimatedButton size="sm" variant="secondary">
                      <ShoppingCart className="w-4 h-4" />
                    </AnimatedButton>
                  </div>
                </div>
              </div>
            </AnimatedCard>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold">Навигация</h4>
            <div className="flex space-x-2">
              <AnimatedButton size="sm" variant="ghost">
                <ArrowLeft className="w-4 h-4" />
              </AnimatedButton>
              <AnimatedButton size="sm" variant="primary">
                Главная
              </AnimatedButton>
              <AnimatedButton size="sm" variant="ghost">
                О нас
              </AnimatedButton>
              <AnimatedButton size="sm" variant="ghost">
                Контакты
              </AnimatedButton>
              <AnimatedButton size="sm" variant="ghost">
                <ArrowRight className="w-4 h-4" />
              </AnimatedButton>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold">Уведомления</h4>
            <div className="space-y-2">
              <div className={`p-3 rounded-lg animate-success ${
                isDarkTheme ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'
              }`}>
                <div className="flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  Успешно сохранено!
                </div>
              </div>
              <div className={`p-3 rounded-lg animate-error ${
                isDarkTheme ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800'
              }`}>
                <div className="flex items-center">
                  <X className="w-4 h-4 mr-2" />
                  Произошла ошибка!
                </div>
              </div>
              <div className={`p-3 rounded-lg animate-warning ${
                isDarkTheme ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
              }`}>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-2" />
                  Внимание!
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const playDemo = () => {
    setIsPlaying(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsPlaying(false);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
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
        className={`w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
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
              <h2 className="text-2xl font-bold mb-2">Глобальные анимации проекта</h2>
              <p className={`text-sm ${
                isDarkTheme ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Демонстрация всех анимаций и интерактивных элементов
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
              <X className="w-6 h-6" />
            </motion.button>
          </div>
        </div>

        {/* Navigation */}
        <div className={`p-4 border-b ${
          isDarkTheme ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex gap-2 overflow-x-auto">
            {sections.map((section, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentSection(index)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  currentSection === index
                    ? 'bg-blue-500 text-white'
                    : isDarkTheme
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {section.title}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">
              {sections[currentSection].title}
            </h3>
            <p className={`text-sm ${
              isDarkTheme ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {sections[currentSection].description}
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <AnimatedButton
              onClick={playDemo}
              disabled={isPlaying}
              variant="primary"
            >
              {isPlaying ? (
                <>
                  <AnimatedLoader size="sm" />
                  <span className="ml-2">Воспроизводится...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Воспроизвести демо
                </>
              )}
            </AnimatedButton>
          </div>

          <div className="flex justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                {sections[currentSection].component}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
