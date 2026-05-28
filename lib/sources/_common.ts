import Bottleneck from 'bottleneck';

export class SourceApiError extends Error {
  constructor(
    public sourceName: string,
    public httpStatus: number | null,
    public retriable: boolean,
    message: string
  ) {
    super(message);
    this.name = 'SourceApiError';
  }
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 500
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        throw error;
      }
      if (error instanceof SourceApiError && !error.retriable) {
        throw error;
      }
      const delay = baseDelayMs * Math.pow(2, attempt);
      console.warn(`[Retry] Attempt ${attempt} failed. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export function createRateLimiter(maxConcurrent: number, minTime: number) {
  return new Bottleneck({
    maxConcurrent,
    minTime,
  });
}
