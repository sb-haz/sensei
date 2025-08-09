/**
 * Logger utility to handle console output appropriately for different environments
 * In production, critical errors are still logged but debug logs are suppressed
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, ...args: any[]) {
    // Always log errors and warnings
    if (level === 'error' || level === 'warn') {
      console[level](message, ...args);
      return;
    }

    // Only log debug and info in development
    if (this.isDevelopment) {
      console[level](message, ...args);
    }
  }

  debug(message: string, ...args: any[]) {
    this.log('debug', `[DEBUG] ${message}`, ...args);
  }

  info(message: string, ...args: any[]) {
    this.log('info', `[INFO] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log('warn', `[WARN] ${message}`, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log('error', `[ERROR] ${message}`, ...args);
  }

  // For Azure Avatar specific logging with context
  avatar(message: string, context?: any) {
    this.debug(`🤖 Azure Avatar: ${message}`, context);
  }

  // For interview flow logging
  interview(message: string, context?: any) {
    this.debug(`🎤 Interview: ${message}`, context);
  }

  // For API call logging
  api(message: string, context?: any) {
    this.debug(`🌐 API: ${message}`, context);
  }
}

export const logger = new Logger();
