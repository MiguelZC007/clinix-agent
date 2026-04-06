import { AxiosError } from 'axios';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { z } from 'zod';
import { api } from '../api/axios';
import { client } from '../api/client';
import type { AppError } from '../api/errors';

type ErrorsModule = {
  AppError: typeof AppError;
  normalizeError: (error: Error) => AppError;
};

vi.mock('../api/axios', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
  getAuthToken: vi.fn().mockResolvedValue(null),
}));

vi.mock('../api/errors', async (importOriginal) => {
  const actual = (await importOriginal()) as ErrorsModule;
  return {
    ...actual,
    normalizeError: vi.fn((error: Error) => {
      if (error instanceof actual.AppError) return error;
      return new actual.AppError('Normalized error', 'CLIENT_ERROR');
    }),
  };
});

describe('client.get', () => {
  const testSchema = z.object({
    id: z.string(),
    name: z.string(),
  });

  beforeEach(() => {
    vi.mocked(api.get).mockClear();
  });

  it('retorna datos validados correctamente', async () => {
    const mockData = { id: '1', name: 'Test' };
    (api.get as Mock).mockResolvedValue({ data: mockData });

    const result = await client.get('/test', testSchema);
    expect(result).toEqual(mockData);
    expect(api.get).toHaveBeenCalledWith('/test', expect.objectContaining({ headers: expect.any(Object) }));
  });

  it('valida respuesta con schema', async () => {
    const invalidData = { id: '1' };
    (api.get as Mock).mockResolvedValue({ data: invalidData });

    await expect(client.get('/test', testSchema)).rejects.toThrow();
  });

  it('pasa configuracion correctamente', async () => {
    const mockData = { id: '1', name: 'Test' };
    const config = { params: { page: 1 } };
    (api.get as Mock).mockResolvedValue({ data: mockData });

    await client.get('/test', testSchema, config);
    expect(api.get).toHaveBeenCalledWith('/test', expect.objectContaining({ params: { page: 1 } }));
  });

  it('maneja errores correctamente', async () => {
    const axiosError = new AxiosError('Network error');
    (api.get as Mock).mockRejectedValue(axiosError);

    await expect(client.get('/test', testSchema)).rejects.toThrow();
  });
});

describe('client.post', () => {
  const testSchema = z.object({
    id: z.string(),
    name: z.string(),
  });

  beforeEach(() => {
    vi.mocked(api.post).mockClear();
  });

  it('retorna datos validados correctamente', async () => {
    const requestBody = { name: 'Test' };
    const mockResponse = { id: '1', name: 'Test' };
    (api.post as Mock).mockResolvedValue({ data: mockResponse });

    const result = await client.post('/test', requestBody, testSchema);
    expect(result).toEqual(mockResponse);
    expect(api.post).toHaveBeenCalledWith('/test', requestBody, expect.objectContaining({ headers: expect.any(Object) }));
  });

  it('valida respuesta con schema', async () => {
    const requestBody = { name: 'Test' };
    const invalidResponse = { id: '1' };
    (api.post as Mock).mockResolvedValue({ data: invalidResponse });

    await expect(
      client.post('/test', requestBody, testSchema)
    ).rejects.toThrow();
  });

  it('maneja errores correctamente', async () => {
    const requestBody = { name: 'Test' };
    const axiosError = new AxiosError('Network error');
    (api.post as Mock).mockRejectedValue(axiosError);

    await expect(
      client.post('/test', requestBody, testSchema)
    ).rejects.toThrow();
  });
});

describe('client.put', () => {
  const testSchema = z.object({
    id: z.string(),
    name: z.string(),
  });

  beforeEach(() => {
    vi.mocked(api.put).mockClear();
  });

  it('retorna datos validados correctamente', async () => {
    const requestBody = { name: 'Updated' };
    const mockResponse = { id: '1', name: 'Updated' };
    (api.put as Mock).mockResolvedValue({ data: mockResponse });

    const result = await client.put('/test/1', requestBody, testSchema);
    expect(result).toEqual(mockResponse);
  });

  it('maneja errores correctamente', async () => {
    const requestBody = { name: 'Updated' };
    const axiosError = new AxiosError('Network error');
    (api.put as Mock).mockRejectedValue(axiosError);

    await expect(
      client.put('/test/1', requestBody, testSchema)
    ).rejects.toThrow();
  });
});

describe('client.delete', () => {
  const testSchema = z.object({
    success: z.boolean(),
  });

  beforeEach(() => {
    vi.mocked(api.delete).mockClear();
  });

  it('retorna datos validados correctamente', async () => {
    const mockResponse = { success: true };
    (api.delete as Mock).mockResolvedValue({ data: mockResponse });

    const result = await client.delete('/test/1', testSchema);
    expect(result).toEqual(mockResponse);
  });

  it('maneja errores correctamente', async () => {
    const axiosError = new AxiosError('Network error');
    (api.delete as Mock).mockRejectedValue(axiosError);

    await expect(client.delete('/test/1', testSchema)).rejects.toThrow();
  });
});
