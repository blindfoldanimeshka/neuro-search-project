import { z } from 'zod'

// Схемы валидации
export const SearchQuerySchema = z.object({
  query: z.string().min(1).max(500).trim(),
  filters: z.object({
    yearFrom: z.number().min(2000).max(2030),
    yearTo: z.number().min(2000).max(2030),
    priceFrom: z.number().min(0).max(100000000),
    priceTo: z.number().min(0).max(100000000),
    category: z.string().min(1).max(100),
    subcategory: z.string().min(1).max(100)
  }).refine(data => data.yearFrom <= data.yearTo, {
    message: "Год начала должен быть меньше или равен году окончания"
  }).refine(data => data.priceFrom <= data.priceTo, {
    message: "Минимальная цена должна быть меньше или равна максимальной"
  })
})

export const ProductSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  price: z.number().min(0).max(100000000),
  year: z.number().min(2000).max(2030),
  category: z.string().min(1).max(100),
  subcategory: z.string().min(1).max(100),
  description: z.string().min(1).max(1000)
})

export const CategorySchema = z.object({
  name: z.string().min(1).max(100).regex(/^[а-яёa-z0-9\s-]+$/i, {
    message: "Название категории может содержать только буквы, цифры, пробелы и дефисы"
  })
})

// Функции валидации
export function validateSearchQuery(data: unknown) {
  try {
    return SearchQuerySchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Ошибка валидации: ${error.issues.map(e => e.message).join(', ')}`)
    }
    throw new Error('Неизвестная ошибка валидации')
  }
}

export function validateProduct(data: unknown) {
  try {
    return ProductSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Ошибка валидации товара: ${error.issues.map(e => e.message).join(', ')}`)
    }
    throw new Error('Неизвестная ошибка валидации товара')
  }
}

export function validateCategory(data: unknown) {
  try {
    return CategorySchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Ошибка валидации категории: ${error.issues.map(e => e.message).join(', ')}`)
    }
    throw new Error('Неизвестная ошибка валидации категории')
  }
}

// Санитизация данных
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Удаляем потенциально опасные символы
    .slice(0, 1000) // Ограничиваем длину
}

export function sanitizeNumber(input: number): number {
  if (!Number.isFinite(input)) {
    throw new Error('Некорректное числовое значение')
  }
  return Math.max(0, Math.min(input, 100000000))
}

// Проверка на XSS
export function containsXSS(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi
  ]
  
  return xssPatterns.some(pattern => pattern.test(input))
}

// Проверка на SQL injection (для будущего использования)
export function containsSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter)\b)/gi,
    /(\b(or|and)\b\s+\d+\s*=\s*\d+)/gi,
    /(\b(union|select|insert|update|delete|drop|create|alter)\b.*\b(union|select|insert|update|delete|drop|create|alter)\b)/gi
  ]
  
  return sqlPatterns.some(pattern => pattern.test(input))
} 