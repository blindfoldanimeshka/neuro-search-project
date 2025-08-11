// IndexedDB хранилище для больших объемов данных
export interface DBConfig {
  name: string;
  version: number;
  stores: {
    name: string;
    keyPath: string;
    indexes?: Array<{
      name: string;
      keyPath: string | string[];
      unique?: boolean;
      multiEntry?: boolean;
    }>;
  }[];
}

export class IndexedDBStorage {
  private dbName: string;
  private dbVersion: number;
  private dbConfig: DBConfig;
  private db: IDBDatabase | null = null;

  constructor(config: DBConfig) {
    this.dbName = config.name;
    this.dbVersion = config.version;
    this.dbConfig = config;
  }

  // Инициализация базы данных
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Создаем object stores
        for (const storeConfig of this.dbConfig.stores) {
          let objectStore: IDBObjectStore;

          if (!db.objectStoreNames.contains(storeConfig.name)) {
            objectStore = db.createObjectStore(storeConfig.name, {
              keyPath: storeConfig.keyPath
            });
          } else {
            objectStore = (event.target as IDBOpenDBRequest).transaction!.objectStore(storeConfig.name);
          }

          // Создаем индексы
          if (storeConfig.indexes) {
            for (const index of storeConfig.indexes) {
              if (!objectStore.indexNames.contains(index.name)) {
                objectStore.createIndex(index.name, index.keyPath, {
                  unique: index.unique || false,
                  multiEntry: index.multiEntry || false
                });
              }
            }
          }
        }
      };
    });
  }

  // Получить объект из хранилища
  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.get(key);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get object: ${request.error}`));
      };
    });
  }

  // Получить все объекты из хранилища
  async getAll<T>(storeName: string, query?: IDBKeyRange, count?: number): Promise<T[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.getAll(query, count);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get all objects: ${request.error}`));
      };
    });
  }

  // Добавить или обновить объект
  async put<T>(storeName: string, value: T): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.put(value);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to put object: ${request.error}`));
      };
    });
  }

  // Добавить множество объектов
  async putBulk<T>(storeName: string, values: T[]): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const objectStore = transaction.objectStore(storeName);

      let completed = 0;
      const total = values.length;

      for (const value of values) {
        const request = objectStore.put(value);

        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };

        request.onerror = () => {
          reject(new Error(`Failed to put bulk objects: ${request.error}`));
        };
      }

      if (values.length === 0) {
        resolve();
      }
    });
  }

  // Удалить объект
  async delete(storeName: string, key: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to delete object: ${request.error}`));
      };
    });
  }

  // Очистить хранилище
  async clear(storeName: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to clear store: ${request.error}`));
      };
    });
  }

  // Подсчет объектов
  async count(storeName: string, query?: IDBKeyRange): Promise<number> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.count(query);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error(`Failed to count objects: ${request.error}`));
      };
    });
  }

  // Поиск по индексу
  async getByIndex<T>(
    storeName: string,
    indexName: string,
    query: IDBValidKey | IDBKeyRange
  ): Promise<T[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const index = objectStore.index(indexName);
      const request = index.getAll(query);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get by index: ${request.error}`));
      };
    });
  }

  // Получить курсор для итерации
  async iterate<T>(
    storeName: string,
    callback: (value: T, cursor: IDBCursorWithValue) => void | boolean,
    query?: IDBKeyRange,
    direction?: IDBCursorDirection
  ): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.openCursor(query, direction);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const shouldContinue = callback(cursor.value, cursor);
          if (shouldContinue !== false) {
            cursor.continue();
          } else {
            resolve();
          }
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        reject(new Error(`Failed to iterate: ${request.error}`));
      };
    });
  }

  // Закрыть соединение с базой данных
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // Удалить базу данных
  async deleteDatabase(): Promise<void> {
    this.close();
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to delete database: ${request.error}`));
      };
    });
  }
}

// Создаем конфигурацию для продуктового индекса
export const productIndexDBConfig: DBConfig = {
  name: 'ProductSearchIndex',
  version: 1,
  stores: [
    {
      name: 'products',
      keyPath: 'id',
      indexes: [
        { name: 'source', keyPath: 'source' },
        { name: 'category', keyPath: 'category' },
        { name: 'price', keyPath: 'price' },
        { name: 'rating', keyPath: 'rating' },
        { name: 'scrapedAt', keyPath: 'scrapedAt' },
        { name: 'searchTokens', keyPath: 'searchTokens', multiEntry: true }
      ]
    },
    {
      name: 'searchHistory',
      keyPath: 'id',
      indexes: [
        { name: 'timestamp', keyPath: 'timestamp' },
        { name: 'query', keyPath: 'query' }
      ]
    },
    {
      name: 'cache',
      keyPath: 'key',
      indexes: [
        { name: 'expiry', keyPath: 'expiry' }
      ]
    }
  ]
};