import { useState, useCallback, useRef } from 'react';

interface BrowserAction {
  type: 'navigate' | 'search' | 'click' | 'scroll' | 'extract' | 'wait';
  payload: any;
  timestamp: number;
}

interface BrowserState {
  currentUrl: string;
  isLoading: boolean;
  title: string;
  content: string;
  actions: BrowserAction[];
}

interface UseAIBrowserProps {
  onStateChange?: (state: BrowserState) => void;
  onContentExtracted?: (content: string) => void;
  onError?: (error: string) => void;
}

export function useAIBrowser({ 
  onStateChange, 
  onContentExtracted, 
  onError 
}: UseAIBrowserProps = {}) {
  const [browserState, setBrowserState] = useState<BrowserState>({
    currentUrl: 'https://www.google.com',
    isLoading: false,
    title: 'Браузер ИИ',
    content: '',
    actions: []
  });

  const [isConnected, setIsConnected] = useState(false);
  const actionQueue = useRef<BrowserAction[]>([]);
  const isProcessing = useRef(false);

  // Добавление действия в очередь
  const addAction = useCallback((action: Omit<BrowserAction, 'timestamp'>) => {
    const newAction: BrowserAction = {
      ...action,
      timestamp: Date.now()
    };
    
    actionQueue.current.push(newAction);
    setBrowserState(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));

    // Автоматически обрабатываем очередь
    if (!isProcessing.current) {
      processActionQueue();
    }
  }, []);

  // Обработка очереди действий
  const processActionQueue = useCallback(async () => {
    if (isProcessing.current || actionQueue.current.length === 0) return;

    isProcessing.current = true;

    while (actionQueue.current.length > 0) {
      const action = actionQueue.current.shift();
      if (!action) continue;

      try {
        await executeAction(action);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        onError?.(`Ошибка выполнения действия ${action.type}: ${errorMessage}`);
      }
    }

    isProcessing.current = false;
  }, [onError]);

  // Выполнение конкретного действия
  const executeAction = useCallback(async (action: BrowserAction) => {
    setBrowserState(prev => ({ ...prev, isLoading: true }));

    switch (action.type) {
      case 'navigate':
        await navigateTo(action.payload.url);
        break;
      
      case 'search':
        await performSearch(action.payload.query);
        break;
      
      case 'click':
        await clickElement(action.payload.selector);
        break;
      
      case 'scroll':
        await scrollTo(action.payload.position);
        break;
      
      case 'extract':
        await extractContent(action.payload.selectors);
        break;
      
      case 'wait':
        await wait(action.payload.duration);
        break;
      
      default:
        throw new Error(`Неизвестный тип действия: ${action.type}`);
    }

    setBrowserState(prev => ({ ...prev, isLoading: false }));
    onStateChange?.(browserState);
  }, [browserState, onStateChange]);

  // Навигация к URL
  const navigateTo = useCallback(async (url: string) => {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    
    setBrowserState(prev => ({
      ...prev,
      currentUrl: fullUrl,
      isLoading: true
    }));

    // В реальном приложении здесь был бы вызов API для навигации
    // Пока что просто обновляем состояние
    setTimeout(() => {
      setBrowserState(prev => ({
        ...prev,
        isLoading: false,
        title: `Загружено: ${fullUrl}`
      }));
    }, 1000);
  }, []);

  // Выполнение поиска
  const performSearch = useCallback(async (query: string) => {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    await navigateTo(searchUrl);
  }, [navigateTo]);

  // Клик по элементу
  const clickElement = useCallback(async (selector: string) => {
    // В реальном приложении здесь был бы вызов API для клика
    console.log(`Клик по элементу: ${selector}`);
    
    // Имитация задержки
    await new Promise(resolve => setTimeout(resolve, 500));
  }, []);

  // Прокрутка страницы
  const scrollTo = useCallback(async (position: 'top' | 'bottom' | number) => {
    // В реальном приложении здесь был бы вызов API для прокрутки
    console.log(`Прокрутка к: ${position}`);
    
    // Имитация задержки
    await new Promise(resolve => setTimeout(resolve, 300));
  }, []);

  // Извлечение контента
  const extractContent = useCallback(async (selectors: string[]) => {
    // В реальном приложении здесь был бы вызов API для извлечения контента
    console.log(`Извлечение контента по селекторам: ${selectors.join(', ')}`);
    
    // Имитация извлеченного контента
    const extractedContent = `Извлеченный контент с ${browserState.currentUrl}\nСелекторы: ${selectors.join(', ')}`;
    
    setBrowserState(prev => ({
      ...prev,
      content: extractedContent
    }));
    
    onContentExtracted?.(extractedContent);
  }, [browserState.currentUrl, onContentExtracted]);

  // Ожидание
  const wait = useCallback(async (duration: number) => {
    await new Promise(resolve => setTimeout(resolve, duration));
  }, []);

  // Публичные методы для ИИ
  const aiNavigate = useCallback((url: string) => {
    addAction({ type: 'navigate', payload: { url } });
  }, [addAction]);

  const aiSearch = useCallback((query: string) => {
    addAction({ type: 'search', payload: { query } });
  }, [addAction]);

  const aiClick = useCallback((selector: string) => {
    addAction({ type: 'click', payload: { selector } });
  }, [addAction]);

  const aiScroll = useCallback((position: 'top' | 'bottom' | number) => {
    addAction({ type: 'scroll', payload: { position } });
  }, [addAction]);

  const aiExtract = useCallback((selectors: string[]) => {
    addAction({ type: 'extract', payload: { selectors } });
  }, [addAction]);

  const aiWait = useCallback((duration: number) => {
    addAction({ type: 'wait', payload: { duration } });
  }, [addAction]);

  // Выполнение последовательности действий
  const executeSequence = useCallback(async (actions: Array<{
    type: BrowserAction['type'];
    payload: any;
  }>) => {
    for (const action of actions) {
      addAction(action);
    }
  }, [addAction]);

  // Очистка истории действий
  const clearActions = useCallback(() => {
    actionQueue.current = [];
    setBrowserState(prev => ({ ...prev, actions: [] }));
  }, []);

  // Получение текущего состояния
  const getCurrentState = useCallback(() => {
    return browserState;
  }, [browserState]);

  // Подключение к браузеру
  const connect = useCallback(() => {
    setIsConnected(true);
    console.log('ИИ подключен к браузеру');
  }, []);

  // Отключение от браузера
  const disconnect = useCallback(() => {
    setIsConnected(false);
    console.log('ИИ отключен от браузера');
  }, []);

  return {
    // Состояние
    browserState,
    isConnected,
    isLoading: browserState.isLoading,
    
    // Методы для ИИ
    aiNavigate,
    aiSearch,
    aiClick,
    aiScroll,
    aiExtract,
    aiWait,
    executeSequence,
    
    // Управление
    connect,
    disconnect,
    clearActions,
    getCurrentState,
    
    // Прямые действия (для ручного управления)
    navigateTo,
    performSearch,
    clickElement,
    scrollTo,
    extractContent,
    wait
  };
}
