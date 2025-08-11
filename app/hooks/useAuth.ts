import { useState, useEffect, useCallback } from 'react';
import { logger } from '../../lib/logger';

interface User {
  id: string;
  email: string;
  name: string;
}

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Моковые пользователи для демонстрации
const MOCK_USERS = [
  { id: '1', email: 'admin@example.com', password: 'admin123', name: 'Администратор' },
  { id: '2', email: 'user@example.com', password: 'user123', name: 'Пользователь' },
];

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Проверка аутентификации при загрузке
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        logger.info('Пользователь авторизован', { userId: JSON.parse(savedUser).id });
      } catch (error) {
        logger.error('Ошибка загрузки пользователя', { error });
        logout();
      }
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Имитация API запроса
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockUser = MOCK_USERS.find(u => u.email === email && u.password === password);

      if (!mockUser) {
        throw new Error('Неверный email или пароль');
      }

      const userData: User = {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name
      };

      // Генерируем простой токен
      const token = btoa(`${userData.id}:${Date.now()}`);
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      logger.info('Успешный вход', { userId: userData.id, email: userData.email });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка входа';
      setError(errorMessage);
      logger.error('Ошибка входа', { email, error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
    logger.info('Пользователь вышел из системы');
  }, []);

  return {
    user,
    isLoading,
    error,
    login,
    logout,
    isAuthenticated: !!user
  };
} 