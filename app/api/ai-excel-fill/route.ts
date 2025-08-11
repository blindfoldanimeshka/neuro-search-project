import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// LM Studio API configuration
const LM_STUDIO_BASE_URL = process.env.LM_STUDIO_BASE_URL || 'http://127.0.0.1:1234';
const DEFAULT_MODEL = process.env.LOCAL_AI_MODEL || 'qwen/qwen3-4b';

interface ExcelFillRequest {
  fileContent: string; // Base64 encoded Excel file
  fileName?: string;
  instructions?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface ExcelFillResponse {
  success: boolean;
  fileContent?: string; // Base64 encoded filled Excel file
  fileName?: string;
  message?: string;
  error?: string;
  changes?: Array<{
    sheet: string;
    cell: string;
    oldValue: string;
    newValue: string;
    reasoning: string;
  }>;
}

// Функция для проверки доступности LM Studio
async function checkLMStudioAvailability(): Promise<boolean> {
  try {
    const response = await fetch(`${LM_STUDIO_BASE_URL}/v1/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Функция для извлечения структуры Excel файла
function extractExcelStructure(workbook: XLSX.WorkBook): string {
  const structure: string[] = [];
  
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    structure.push(`\nЛист: "${sheetName}"`);
    structure.push(`Количество строк: ${data.length}`);
    
    if (data.length > 0) {
      // Показываем заголовки (первая строка)
      const headers = data[0] as string[];
      structure.push(`Заголовки: ${headers.join(', ')}`);
      
      // Показываем несколько примеров данных
      const examples = data.slice(1, Math.min(4, data.length));
      examples.forEach((row, index) => {
        const rowData = row as string[];
        structure.push(`  Строка ${index + 1}: ${rowData.join(' | ')}`);
      });
    }
  });
  
  return structure.join('\n');
}

// Функция для отправки запроса к Qwen3-4B
async function askQwenModel(prompt: string, model: string = DEFAULT_MODEL): Promise<string> {
  try {
    const response = await fetch(`${LM_STUDIO_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: `Ты - AI помощник для работы с Excel файлами. Твоя задача - анализировать структуру Excel файлов и заполнять их данными согласно инструкциям пользователя.

ВОЖНЫЕ ПРАВИЛА:
1. Анализируй структуру Excel файла внимательно
2. Заполняй только те ячейки, которые соответствуют инструкциям
3. Используй реалистичные и релевантные данные
4. Сохраняй форматирование и структуру файла
5. Если инструкции неясны - задавай уточняющие вопросы
6. Всегда объясняй свои действия

ФОРМАТ ОТВЕТА:
Для каждой заполненной ячейки указывай:
- Лист: [название листа]
- Ячейка: [адрес ячейки]
- Значение: [новое значение]
- Обоснование: [почему именно это значение]

Пример:
Лист: "Товары"
Ячейка: A2
Значение: "Смартфон Samsung Galaxy S24"
Обоснование: "Заполняю название товара согласно инструкции о заполнении электроники"`

          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`LM Studio API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Ошибка получения ответа от модели';
  } catch (error) {
    console.error('Error asking Qwen model:', error);
    throw error;
  }
}

// Функция для парсинга ответа модели и применения изменений
function parseModelResponse(response: string): Array<{
  sheet: string;
  cell: string;
  oldValue: string;
  newValue: string;
  reasoning: string;
}> {
  const changes: Array<{
    sheet: string;
    cell: string;
    oldValue: string;
    newValue: string;
    reasoning: string;
  }> = [];

  // Парсим ответ модели в формате:
  // Лист: "Товары"
  // Ячейка: A2
  // Значение: "Смартфон Samsung Galaxy S24"
  // Обоснование: "Заполняю название товара"
  
  const lines = response.split('\n');
  let currentSheet = '';
  let currentCell = '';
  let currentValue = '';
  let currentReasoning = '';

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('Лист:')) {
      currentSheet = trimmedLine.replace('Лист:', '').replace(/"/g, '').trim();
    } else if (trimmedLine.startsWith('Ячейка:')) {
      currentCell = trimmedLine.replace('Ячейка:', '').trim();
    } else if (trimmedLine.startsWith('Значение:')) {
      currentValue = trimmedLine.replace('Значение:', '').trim();
    } else if (trimmedLine.startsWith('Обоснование:')) {
      currentReasoning = trimmedLine.replace('Обоснование:', '').trim();
      
      // Если у нас есть все необходимые данные, добавляем изменение
      if (currentSheet && currentCell && currentValue && currentReasoning) {
        changes.push({
          sheet: currentSheet,
          cell: currentCell,
          oldValue: '',
          newValue: currentValue,
          reasoning: currentReasoning
        });
        
        // Сбрасываем значения
        currentCell = '';
        currentValue = '';
        currentReasoning = '';
      }
    }
  }

  return changes;
}

// Функция для применения изменений к Excel файлу
function applyChangesToWorkbook(workbook: XLSX.WorkBook, changes: Array<{
  sheet: string;
  cell: string;
  oldValue: string;
  newValue: string;
  reasoning: string;
}>): XLSX.WorkBook {
  const newWorkbook = XLSX.utils.book_new();
  
  // Копируем все листы
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const newWorksheet = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number | boolean | null)[][];
    
    // Применяем изменения для этого листа
    const sheetChanges = changes.filter(change => change.sheet === sheetName);
    sheetChanges.forEach(change => {
      const cellAddress = XLSX.utils.decode_cell(change.cell);
      const rowIndex = cellAddress.r;
      const colIndex = cellAddress.c;
      
      // Расширяем массив если нужно
      while (newWorksheet.length <= rowIndex) {
        newWorksheet.push([]);
      }
      while (newWorksheet[rowIndex].length <= colIndex) {
        newWorksheet[rowIndex].push('');
      }
      
      // Сохраняем старое значение
      change.oldValue = String(newWorksheet[rowIndex][colIndex] || '');
      
      // Устанавливаем новое значение
      newWorksheet[rowIndex][colIndex] = change.newValue;
    });
    
    // Создаем новый лист
    const newSheet = XLSX.utils.aoa_to_sheet(newWorksheet);
    XLSX.utils.book_append_sheet(newWorkbook, newSheet, sheetName);
  });

  return newWorkbook;
}

export async function POST(request: NextRequest) {
  try {
    const { fileContent, fileName = 'filled_file.xlsx', instructions = '', model = DEFAULT_MODEL }: ExcelFillRequest = await request.json();

    if (!fileContent) {
      return NextResponse.json(
        { error: 'File content is required' },
        { status: 400 }
      );
    }

    // Проверяем доступность LM Studio
    const isAvailable = await checkLMStudioAvailability();
    if (!isAvailable) {
      return NextResponse.json(
        { 
          error: 'Локальный ИИ недоступен. Проверьте, что LM Studio запущен и доступен по адресу: ' + LM_STUDIO_BASE_URL,
          details: 'LM Studio is not available. Please ensure it is running and accessible.',
          status: 'lm_studio_unavailable'
        },
        { status: 503 }
      );
    }

    // Декодируем Base64 файл
    const buffer = Buffer.from(fileContent, 'base64');
    
    // Читаем Excel файл
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Извлекаем структуру файла
    const structure = extractExcelStructure(workbook);
    
    // Формируем промпт для модели
    const prompt = `Анализирую Excel файл и заполняю его согласно инструкциям.

СТРУКТУРА ФАЙЛА:
${structure}

ИНСТРУКЦИИ ПО ЗАПОЛНЕНИЮ:
${instructions || 'Заполни файл реалистичными данными, сохраняя структуру и формат.'}

Пожалуйста, проанализируй структуру файла и заполни его согласно инструкциям. 
Используй только указанный формат ответа для каждой заполненной ячейки.`;

    // Отправляем запрос к модели
    const modelResponse = await askQwenModel(prompt, model);
    
    // Парсим ответ модели
    const changes = parseModelResponse(modelResponse);
    
    // Применяем изменения к файлу
    const filledWorkbook = applyChangesToWorkbook(workbook, changes);
    
    // Экспортируем заполненный файл
    const filledBuffer = XLSX.write(filledWorkbook, { bookType: 'xlsx', type: 'array' });
    const filledBase64 = Buffer.from(filledBuffer).toString('base64');
    
    const result: ExcelFillResponse = {
      success: true,
      fileContent: filledBase64,
      fileName: `filled_${fileName}`,
      message: `Файл успешно заполнен. Внесено изменений: ${changes.length}`,
      changes: changes
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('AI Excel Fill Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Ошибка при заполнении Excel файла',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const isAvailable = await checkLMStudioAvailability();
    
    return NextResponse.json({
      available: isAvailable,
      model: DEFAULT_MODEL,
      supportedFormats: ['xlsx', 'xls'],
      maxFileSize: '10MB'
    });
  } catch (error) {
    return NextResponse.json({
      available: false,
      error: 'Ошибка при проверке доступности LM Studio'
    });
  }
}
