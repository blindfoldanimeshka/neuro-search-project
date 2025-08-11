import { useState, useEffect, useCallback } from 'react';
import { AIMessage } from '../components/types';

interface ChatSession {
  id: string;
  name: string;
  messages: AIMessage[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UseChatStorageReturn {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  createSession: (name?: string) => ChatSession;
  saveSession: (session: ChatSession) => void;
  loadSession: (sessionId: string) => ChatSession | null;
  deleteSession: (sessionId: string) => void;
  addMessage: (sessionId: string, message: AIMessage) => void;
  updateSessionName: (sessionId: string, name: string) => void;
  clearAllSessions: () => void;
  isLoading: boolean;
}

const STORAGE_KEY = 'ai-chat-sessions';

export function useChatStorage(): UseChatStorageReturn {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Загружаем сессии из localStorage
  const loadSessionsFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Преобразуем строки дат обратно в объекты Date
        const sessionsWithDates = parsed.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setSessions(sessionsWithDates);
        
        // Устанавливаем последнюю активную сессию
        if (sessionsWithDates.length > 0) {
          const lastSession = sessionsWithDates[sessionsWithDates.length - 1];
          setCurrentSession(lastSession);
        }
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Сохраняем сессии в localStorage
  const saveSessionsToStorage = useCallback((updatedSessions: ChatSession[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
    } catch (error) {
      console.error('Error saving chat sessions:', error);
    }
  }, []);

  // Загружаем сессии при инициализации
  useEffect(() => {
    loadSessionsFromStorage();
  }, [loadSessionsFromStorage]);

  // Создание новой сессии
  const createSession = useCallback((name?: string): ChatSession => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sessionName = name || `Чат ${new Date().toLocaleString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
    
    const newSession: ChatSession = {
      id: sessionId,
      name: sessionName,
      messages: [],
      model: 'deepseek/deepseek-chat-v3-0324:free',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    setCurrentSession(newSession);
    saveSessionsToStorage(updatedSessions);

    return newSession;
  }, [sessions, saveSessionsToStorage]);

  // Сохранение сессии
  const saveSession = useCallback((session: ChatSession) => {
    const updatedSessions = sessions.map(s => 
      s.id === session.id ? { ...session, updatedAt: new Date() } : s
    );
    setSessions(updatedSessions);
    setCurrentSession(session);
    saveSessionsToStorage(updatedSessions);
  }, [sessions, saveSessionsToStorage]);

  // Загрузка сессии
  const loadSession = useCallback((sessionId: string): ChatSession | null => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
    }
    return session || null;
  }, [sessions]);

  // Удаление сессии
  const deleteSession = useCallback((sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    
    // Если удаляем текущую сессию, переключаемся на последнюю
    if (currentSession?.id === sessionId) {
      const lastSession = updatedSessions[updatedSessions.length - 1] || null;
      setCurrentSession(lastSession);
    }
    
    saveSessionsToStorage(updatedSessions);
  }, [sessions, currentSession, saveSessionsToStorage]);

  // Добавление сообщения в сессию
  const addMessage = useCallback((sessionId: string, message: AIMessage) => {
    const updatedSessions = sessions.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          messages: [...session.messages, message],
          updatedAt: new Date()
        };
      }
      return session;
    });
    
    setSessions(updatedSessions);
    const updatedSession = updatedSessions.find(s => s.id === sessionId);
    if (updatedSession) {
      setCurrentSession(updatedSession);
    }
    saveSessionsToStorage(updatedSessions);
  }, [sessions, saveSessionsToStorage]);

  // Обновление имени сессии
  const updateSessionName = useCallback((sessionId: string, name: string) => {
    const updatedSessions = sessions.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          name,
          updatedAt: new Date()
        };
      }
      return session;
    });
    
    setSessions(updatedSessions);
    const updatedSession = updatedSessions.find(s => s.id === sessionId);
    if (updatedSession) {
      setCurrentSession(updatedSession);
    }
    saveSessionsToStorage(updatedSessions);
  }, [sessions, saveSessionsToStorage]);

  // Очистка всех сессий
  const clearAllSessions = useCallback(() => {
    setSessions([]);
    setCurrentSession(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    sessions,
    currentSession,
    createSession,
    saveSession,
    loadSession,
    deleteSession,
    addMessage,
    updateSessionName,
    clearAllSessions,
    isLoading
  };
}
