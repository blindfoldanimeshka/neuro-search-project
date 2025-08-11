'use client';

import React from 'react';
import { Search, ShoppingCart, User, Menu, Moon, Sun, Bot } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useTheme } from '../hooks/useTheme';

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onToggleAIChat?: () => void;
  isAIChatOpen?: boolean;
}

export default function Header({ 
  onSearch, 
  searchQuery = '', 
  setSearchQuery, 
  onToggleAIChat, 
  isAIChatOpen = false 
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isDarkTheme, toggleTheme } = useTheme();

  const handleSearch = () => {
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Логотип */}
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ТоварПоиск
            </h1>
          </div>
        </div>

        {/* Поисковая строка */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Поиск товаров..."
              className="pl-10 pr-20"
              value={searchQuery}
              onChange={(e) => setSearchQuery?.(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button 
              onClick={handleSearch}
              disabled={!searchQuery.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 px-3 text-sm"
              size="sm"
            >
              Найти
            </Button>
          </div>
        </div>

        {/* Навигация */}
        <div className="hidden md:flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <ShoppingCart className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
          <Button 
            variant={isAIChatOpen ? "default" : "ghost"}
            size="icon" 
            onClick={onToggleAIChat}
            className={isAIChatOpen ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            <Bot className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
          >
            {isDarkTheme ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>

        {/* Мобильное меню */}
        <div className="md:hidden flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
          >
            {isDarkTheme ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Мобильная поисковая строка */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container py-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Поиск товаров..."
                className="pl-10 pr-20"
                value={searchQuery}
                onChange={(e) => setSearchQuery?.(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button 
                onClick={handleSearch}
                disabled={!searchQuery.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 px-3 text-sm"
                size="sm"
              >
                Найти
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <Button variant="ghost" className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5" />
                <span>Корзина</span>
              </Button>
              <Button variant="ghost" className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Профиль</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
} 