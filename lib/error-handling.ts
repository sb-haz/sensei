import { logger } from './logger';

/**
 * Error handling utilities for consistent error management across the app
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public context?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Wraps async functions with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const contextMessage = context ? `[${context}] ` : '';
      logger.error(`${contextMessage}Operation failed:`, error);
      throw error;
    }
  }) as T;
}

/**
 * Handles Supabase errors consistently
 */
export function handleSupabaseError(error: any, operation?: string): never {
  const operationMessage = operation ? ` during ${operation}` : '';
  logger.error(`Supabase error${operationMessage}:`, error);
  
  // Common Supabase error patterns
  if (error?.code === 'PGRST116') {
    throw new AppError('Resource not found', 'NOT_FOUND', error);
  }
  
  if (error?.message?.includes('JWT')) {
    throw new AppError('Authentication expired', 'AUTH_EXPIRED', error);
  }
  
  if (error?.message?.includes('RLS')) {
    throw new AppError('Access denied', 'ACCESS_DENIED', error);
  }
  
  throw new AppError(
    error?.message || 'Unknown database error',
    'DATABASE_ERROR',
    error
  );
}

/**
 * Safe async wrapper that doesn't throw
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  defaultValue: T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logger.error('Safe async operation failed:', error);
    return defaultValue;
  }
}
