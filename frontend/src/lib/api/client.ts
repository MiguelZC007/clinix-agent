import { type z } from "zod";
import { api, getAuthToken } from "./axios";
import { normalizeError } from "./errors";

type RequestConfig = {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
};

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function get<T>(
  url: string,
  schema?: z.ZodType<T>,
  config?: RequestConfig,
): Promise<T> {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await api.get(url, {
      ...config,
      headers: {
        ...authHeaders,
        ...config?.headers,
      },
    });
    if (schema) {
      return schema.parse(response.data);
    }
    return response.data as T;
  } catch (error) {
    throw normalizeError(error);
  }
}

async function post<T, B>(
  url: string,
  body: B,
  schema?: z.ZodType<T>,
  config?: RequestConfig,
): Promise<T> {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await api.post(url, body, {
      ...config,
      headers: {
        ...authHeaders,
        ...config?.headers,
      },
    });
    if (schema) {
      return schema.parse(response.data);
    }
    return response.data as T;
  } catch (error) {
    throw normalizeError(error);
  }
}

async function put<T, B>(
  url: string,
  body: B,
  schema?: z.ZodType<T>,
  config?: RequestConfig,
): Promise<T> {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await api.put(url, body, {
      ...config,
      headers: {
        ...authHeaders,
        ...config?.headers,
      },
    });
    if (schema) {
      return schema.parse(response.data);
    }
    return response.data as T;
  } catch (error) {
    throw normalizeError(error);
  }
}

async function patch<T, B>(
  url: string,
  body: B,
  schema?: z.ZodType<T>,
  config?: RequestConfig,
): Promise<T> {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await api.patch(url, body, {
      ...config,
      headers: {
        ...authHeaders,
        ...config?.headers,
      },
    });
    if (schema) {
      return schema.parse(response.data);
    }
    return response.data as T;
  } catch (error) {
    throw normalizeError(error);
  }
}

async function del<T>(
  url: string,
  schema?: z.ZodType<T>,
  config?: RequestConfig,
): Promise<T> {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await api.delete(url, {
      ...config,
      headers: {
        ...authHeaders,
        ...config?.headers,
      },
    });
    if (schema) {
      return schema.parse(response.data);
    }
    return response.data as T;
  } catch (error) {
    throw normalizeError(error);
  }
}

export const client = {
  get,
  post,
  put,
  patch,
  delete: del,
};
