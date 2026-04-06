import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { describe, it, expect } from 'vitest';
import { AppError, normalizeError, ERROR_TRANSLATION_KEYS } from '../api/errors';

describe('AppError', () => {
  it('crea error con mensaje', () => {
    const error = new AppError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('AppError');
    expect(error.code).toBe('UNKNOWN_ERROR');
    expect(error.translationKey).toBe(ERROR_TRANSLATION_KEYS.UNKNOWN_ERROR);
  });

  it('crea error con codigo personalizado', () => {
    const error = new AppError('Not found', 'NOT_FOUND', 404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.status).toBe(404);
    expect(error.translationKey).toBe(ERROR_TRANSLATION_KEYS.NOT_FOUND);
  });

  it('crea error con errores de validacion', () => {
    const validationErrors = {
      email: ['Invalid email'],
      password: ['Too short'],
    };
    const error = new AppError('Validation failed', 'VALIDATION_ERROR', 422, validationErrors);
    expect(error.errors).toEqual(validationErrors);
  });
});

describe('normalizeError', () => {
  it('retorna AppError si ya es AppError', () => {
    const appError = new AppError('Test', 'CLIENT_ERROR');
    expect(normalizeError(appError)).toBe(appError);
  });

  it('normaliza AxiosError con ProblemDetails', () => {
    const problemDetails = {
      type: 'https://example.com/problems/validation-error',
      title: 'Validation Error',
      status: 422,
      detail: 'Invalid input',
      code: 'VALIDATION_ERROR',
      errors: {
        email: ['Invalid email format'],
      },
    };

    const axiosError = new AxiosError('Request failed');
    axiosError.response = {
      data: problemDetails,
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };

    const normalized = normalizeError(axiosError);
    expect(normalized).toBeInstanceOf(AppError);
    expect(normalized.message).toBe('Invalid input');
    expect(normalized.code).toBe('VALIDATION_ERROR');
    expect(normalized.status).toBe(422);
    expect(normalized.errors).toEqual(problemDetails.errors);
  });

  it('normaliza AxiosError sin ProblemDetails', () => {
    const axiosError = new AxiosError('Network Error');
    axiosError.response = {
      data: { message: 'Connection timeout' },
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };

    const normalized = normalizeError(axiosError);
    expect(normalized).toBeInstanceOf(AppError);
    expect(normalized.message).toBe('Network Error');
    expect(normalized.code).toBe('SERVER_ERROR');
    expect(normalized.status).toBe(500);
  });

  it('normaliza AxiosError sin respuesta', () => {
    const axiosError = new AxiosError('Network Error');
    const normalized = normalizeError(axiosError);
    expect(normalized).toBeInstanceOf(AppError);
    expect(normalized.code).toBe('NETWORK_ERROR');
  });

  it('normaliza Error generico', () => {
    const error = new Error('Generic error');
    const normalized = normalizeError(error);
    expect(normalized).toBeInstanceOf(AppError);
    expect(normalized.message).toBe('Generic error');
    expect(normalized.code).toBe('CLIENT_ERROR');
  });

  it('normaliza error desconocido', () => {
    const normalized = normalizeError('string error');
    expect(normalized).toBeInstanceOf(AppError);
    expect(normalized.message).toBe('Unknown error');
    expect(normalized.code).toBe('UNKNOWN_ERROR');
  });

  it('mapea status codes correctamente', () => {
    const testCases = [
      { status: 401, expectedCode: 'UNAUTHORIZED' },
      { status: 403, expectedCode: 'FORBIDDEN' },
      { status: 404, expectedCode: 'NOT_FOUND' },
      { status: 422, expectedCode: 'VALIDATION_ERROR' },
      { status: 500, expectedCode: 'SERVER_ERROR' },
      { status: 400, expectedCode: 'CLIENT_ERROR' },
    ];

    testCases.forEach(({ status, expectedCode }) => {
      const axiosError = new AxiosError('Error');
      axiosError.response = {
        data: {},
        status,
        statusText: 'Error',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };
      const normalized = normalizeError(axiosError);
      expect(normalized.code).toBe(expectedCode);
    });
  });
});
