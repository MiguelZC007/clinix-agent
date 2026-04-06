import { z } from 'zod';

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.union([
    z.object({
      success: z.boolean(),
      data: dataSchema,
      message: z.string().optional(),
      timestamp: z.string().datetime(),
    }),
    dataSchema.transform((data) => ({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    })),
  ]);

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
};

const PaginatedDataSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.union([
    z.object({
      items: z.array(itemSchema),
      total: z.number(),
      page: z.number(),
      pageSize: z.number(),
      totalPages: z.number(),
    }),
    z.array(itemSchema).transform((items) => ({
      items,
      total: items.length,
      page: 1,
      pageSize: items.length,
      totalPages: 1,
    })),
  ]);

export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.union([
    z.object({
      success: z.boolean(),
      data: PaginatedDataSchema(itemSchema),
      message: z.string().optional(),
      timestamp: z.string().datetime(),
    }),
    PaginatedDataSchema(itemSchema).transform((data) => ({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    })),
  ]);

export type PaginatedData<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;

export const MessageResponseSchema = z.object({
  success: z.boolean(),
  data: z.union([z.null(), z.record(z.string(), z.unknown())]),
  message: z.string().optional(),
  timestamp: z.union([z.string(), z.string().datetime()]).optional(),
});
