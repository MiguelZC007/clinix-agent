/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { RetryService, RetryErrorCategory } from '../retry.service';

describe('RetryService', () => {
  let retryService: RetryService;

  beforeEach(() => {
    retryService = new RetryService();
  });

  describe('executeWithRetry', () => {
    it('retorna resultado exitoso sin reintentar', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await retryService.executeWithRetry(fn);

      expect(result.ok).toBe(true);
      expect(result.data).toBe('success');
      expect(result.retries).toBe(0);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('reintenta en error TRANSIENT y luego tiene éxito', async () => {
      const error500 = new Error('Server Error');
      (error500 as any).status = 500;
      const fn = jest
        .fn()
        .mockRejectedValueOnce(error500)
        .mockResolvedValueOnce('success');

      const result = await retryService.executeWithRetry(fn, { maxRetries: 2 });

      expect(result.ok).toBe(true);
      expect(result.data).toBe('success');
      expect(result.retries).toBe(1);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('reintenta en RATE_LIMIT y luego tiene éxito', async () => {
      const error429 = new Error('Rate Limited');
      (error429 as any).status = 429;
      const fn = jest
        .fn()
        .mockRejectedValueOnce(error429)
        .mockResolvedValueOnce('success');

      const result = await retryService.executeWithRetry(fn, { maxRetries: 2 });

      expect(result.ok).toBe(true);
      expect(result.retries).toBe(1);
    });

    it('no reintenta en error AUTH (401)', async () => {
      const error401 = new Error('Unauthorized');
      (error401 as any).status = 401;
      const fn = jest.fn().mockRejectedValue(error401);

      const result = await retryService.executeWithRetry(fn);

      expect(result.ok).toBe(false);
      expect(result.retries).toBe(0);
      expect(result.category).toBe(RetryErrorCategory.AUTH);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('no reintenta en error CLIENT (400)', async () => {
      const error400 = new Error('Bad Request');
      (error400 as any).status = 400;
      const fn = jest.fn().mockRejectedValue(error400);

      const result = await retryService.executeWithRetry(fn);

      expect(result.ok).toBe(false);
      expect(result.retries).toBe(0);
      expect(result.category).toBe(RetryErrorCategory.CLIENT);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('agota reintentos y retorna último error', async () => {
      const error500 = new Error('Server Error');
      (error500 as any).status = 500;
      const fn = jest.fn().mockRejectedValue(error500);

      const result = await retryService.executeWithRetry(fn, { maxRetries: 2 });

      expect(result.ok).toBe(false);
      expect(result.retries).toBe(2);
      expect(result.category).toBe(RetryErrorCategory.TRANSIENT);
      expect(result.error).toBe(error500);
    });

    it('clasifica timeout como TRANSIENT', async () => {
      const timeoutError = new Error('timeout');
      (timeoutError as any).code = 'ETIMEDOUT';
      const fn = jest.fn().mockRejectedValue(timeoutError);

      const result = await retryService.executeWithRetry(fn);

      expect(result.ok).toBe(false);
      expect(result.category).toBe(RetryErrorCategory.TRANSIENT);
    });

    it('lanza error de auth inmediatamente sin reintentar', async () => {
      const error403 = new Error('Forbidden');
      (error403 as any).status = 403;
      const error500 = new Error('Server Error');
      (error500 as any).status = 500;
      const fn = jest
        .fn()
        .mockRejectedValueOnce(error403)
        .mockRejectedValueOnce(error500);

      const result = await retryService.executeWithRetry(fn);

      expect(result.ok).toBe(false);
      expect(result.category).toBe(RetryErrorCategory.AUTH);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('reintenta en 502 (transiente)', async () => {
      const error502 = new Error('Bad Gateway');
      (error502 as any).status = 502;
      const fn = jest
        .fn()
        .mockRejectedValueOnce(error502)
        .mockResolvedValueOnce('recovered');

      const result = await retryService.executeWithRetry(fn, { maxRetries: 2 });

      expect(result.ok).toBe(true);
      expect(result.retries).toBe(1);
    });

    it('reintenta en 503 (transiente)', async () => {
      const error503 = new Error('Service Unavailable');
      (error503 as any).status = 503;
      const fn = jest
        .fn()
        .mockRejectedValueOnce(error503)
        .mockResolvedValueOnce('recovered');

      const result = await retryService.executeWithRetry(fn, { maxRetries: 2 });

      expect(result.ok).toBe(true);
      expect(result.retries).toBe(1);
    });
  });

  describe('classifyError', () => {
    it('clasifica 200 como UNKNOWN', () => {
      const error = new Error('ok');
      (error as any).status = 200;
      expect(retryService.classifyError(error)).toBe(
        RetryErrorCategory.UNKNOWN,
      );
    });

    it('clasifica 401 como AUTH', () => {
      const error = new Error('Unauthorized');
      (error as any).status = 401;
      expect(retryService.classifyError(error)).toBe(RetryErrorCategory.AUTH);
    });

    it('clasifica 403 como AUTH', () => {
      const error = new Error('Forbidden');
      (error as any).status = 403;
      expect(retryService.classifyError(error)).toBe(RetryErrorCategory.AUTH);
    });

    it('clasifica 400 como CLIENT', () => {
      const error = new Error('Bad Request');
      (error as any).status = 400;
      expect(retryService.classifyError(error)).toBe(RetryErrorCategory.CLIENT);
    });

    it('clasifica 429 como RATE_LIMIT', () => {
      const error = new Error('Rate Limited');
      (error as any).status = 429;
      expect(retryService.classifyError(error)).toBe(
        RetryErrorCategory.RATE_LIMIT,
      );
    });

    it('clasifica 500 como TRANSIENT', () => {
      const error = new Error('Server Error');
      (error as any).status = 500;
      expect(retryService.classifyError(error)).toBe(
        RetryErrorCategory.TRANSIENT,
      );
    });

    it('clasifica 502 como TRANSIENT', () => {
      const error = new Error('Bad Gateway');
      (error as any).status = 502;
      expect(retryService.classifyError(error)).toBe(
        RetryErrorCategory.TRANSIENT,
      );
    });

    it('clasifica 503 como TRANSIENT', () => {
      const error = new Error('Service Unavailable');
      (error as any).status = 503;
      expect(retryService.classifyError(error)).toBe(
        RetryErrorCategory.TRANSIENT,
      );
    });

    it('clasifica ETIMEDOUT como TRANSIENT', () => {
      const error = new Error('timeout');
      (error as any).code = 'ETIMEDOUT';
      expect(retryService.classifyError(error)).toBe(
        RetryErrorCategory.TRANSIENT,
      );
    });

    it('clasifica ECONNRESET como TRANSIENT', () => {
      const error = new Error('connection reset');
      (error as any).code = 'ECONNRESET';
      expect(retryService.classifyError(error)).toBe(
        RetryErrorCategory.TRANSIENT,
      );
    });
  });
});
