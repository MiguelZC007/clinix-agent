import { Injectable, Logger } from '@nestjs/common';

export enum RetryErrorCategory {
  TRANSIENT = 'TRANSIENT',
  RATE_LIMIT = 'RATE_LIMIT',
  AUTH = 'AUTH',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN',
}

export interface RetryConfig {
  maxRetries: number;
  timeoutMs: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export interface RetryResult<T> {
  ok: boolean;
  data?: T;
  error?: Error;
  category?: RetryErrorCategory;
  retries: number;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 2,
  timeoutMs: 10000,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
};

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);

  classifyError(error: unknown): RetryErrorCategory {
    if (!(error instanceof Error)) return RetryErrorCategory.UNKNOWN;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const status = (error as any).status;
    if (status === 401 || status === 403) return RetryErrorCategory.AUTH;
    if (status === 429) return RetryErrorCategory.RATE_LIMIT;
    if (status === 400 || status === 422) return RetryErrorCategory.CLIENT;
    if (status === 500 || status === 502 || status === 503)
      return RetryErrorCategory.TRANSIENT;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const code = (error as any).code;
    if (
      code === 'ETIMEDOUT' ||
      code === 'ECONNRESET' ||
      code === 'ECONNREFUSED'
    ) {
      return RetryErrorCategory.TRANSIENT;
    }

    if (
      error.message?.includes('timeout') ||
      error.message?.includes('ETIMEDOUT')
    ) {
      return RetryErrorCategory.TRANSIENT;
    }

    return RetryErrorCategory.UNKNOWN;
  }

  isRetryable(category: RetryErrorCategory): boolean {
    return (
      category === RetryErrorCategory.TRANSIENT ||
      category === RetryErrorCategory.RATE_LIMIT
    );
  }

  computeDelay(
    attempt: number,
    category: RetryErrorCategory,
    config: RetryConfig,
  ): number {
    const base =
      category === RetryErrorCategory.RATE_LIMIT
        ? config.baseDelayMs
        : config.baseDelayMs;
    const delay = Math.min(base * Math.pow(2, attempt), config.maxDelayMs);
    return delay;
  }

  async executeWithRetry<T>(
    operation: (signal?: AbortSignal) => Promise<T>,
    configOverride?: Partial<RetryConfig>,
  ): Promise<RetryResult<T>> {
    const config: RetryConfig = { ...DEFAULT_CONFIG, ...configOverride };
    let lastError: Error | null = null;
    let retries = 0;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const result = await this.executeWithTimeout(
          operation,
          config.timeoutMs,
        );
        return { ok: true, data: result, retries };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const category = this.classifyError(lastError);

        this.logger.warn(
          `Attempt ${attempt + 1} failed: [${category}] ${lastError.message}`,
        );

        if (!this.isRetryable(category)) {
          return { ok: false, error: lastError, category, retries };
        }

        if (attempt < config.maxRetries) {
          retries++;
          const delay = this.computeDelay(attempt, category, config);
          this.logger.log(
            `Retrying in ${delay}ms (attempt ${attempt + 2}/${config.maxRetries + 1})`,
          );
          await this.sleep(delay);
        }
      }
    }

    return {
      ok: false,
      error: lastError!,
      category: lastError
        ? this.classifyError(lastError)
        : RetryErrorCategory.UNKNOWN,
      retries,
    };
  }

  private async executeWithTimeout<T>(
    operation: (signal?: AbortSignal) => Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await Promise.race([
        operation(controller.signal),
        this.timeoutPromise(timeoutMs, controller),
      ]);
      return result as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private timeoutPromise<T>(
    _timeoutMs: number,
    controller: AbortController,
  ): Promise<T> {
    return new Promise((_, reject) => {
      const timer = setTimeout(() => {
        controller.abort();
        const err = new Error('Request timed out');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (err as any).code = 'ETIMEDOUT';
        reject(err);
      }, _timeoutMs);

      controller.signal.addEventListener('abort', () => clearTimeout(timer));
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
