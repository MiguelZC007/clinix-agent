"use client";

import { toast } from "sonner";
import {
  AppError,
  ERROR_TRANSLATION_KEYS,
  type ErrorCode,
} from "@/lib/api/errors";

type TranslateFunction = (key: string) => string;

type ErrorHandlerOptions = {
  showToast?: boolean;
  logError?: boolean;
  /** Pass `t` from `useTranslations()` to get localized error messages. */
  t?: TranslateFunction;
};

/**
 * Shows an error to the user via a toast notification.
 * Pass `options.t` (from `useTranslations()`) for localised messages.
 */
export function showError(error: unknown, options: ErrorHandlerOptions = {}) {
  const { showToast = true, logError = true, t } = options;

  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    appError = new AppError(error.message, "UNKNOWN_ERROR");
  } else {
    appError = new AppError("Unknown error", "UNKNOWN_ERROR");
  }

  if (logError && process.env.NODE_ENV !== "production") {
    console.error("Error:", appError);
  }

  if (showToast) {
    const message = getErrorMessage(appError, t);
    toast.error(message, {
      description: appError.errors
        ? formatValidationErrors(appError.errors)
        : undefined,
      duration: 5000,
    });
  }

  return appError;
}

/**
 * Returns a safe, user-facing error message for any error.
 * Use this in UI components to prevent raw backend message leakage.
 * Always pass `t` from `useTranslations()` for proper localised output.
 */
export function getSafeErrorMessage(
  error: unknown,
  t?: TranslateFunction,
): string {
  if (error instanceof AppError) {
    return getErrorMessage(error, t);
  }
  if (t) {
    return t(ERROR_TRANSLATION_KEYS.UNKNOWN_ERROR);
  }
  return ERROR_TRANSLATION_KEYS.UNKNOWN_ERROR;
}

/**
 * Returns a user-facing error message using the translation function
 * when available, falling back to the AppError's translationKey.
 * Backend messages are never surfaced directly to the user.
 */
function getErrorMessage(error: AppError, t?: TranslateFunction): string {
  const translationKey =
    error.translationKey ??
    ERROR_TRANSLATION_KEYS[error.code] ??
    ERROR_TRANSLATION_KEYS.UNKNOWN_ERROR;

  if (t) {
    return t(translationKey);
  }

  // Without a translator, return a locale-aware hardcoded fallback
  // (callers should pass `t` for proper UX)
  const fallback = getFallbackMessages();
  return fallback[error.code] ?? fallback.UNKNOWN_ERROR;
}

/** Detect current locale from the URL pathname (works in interceptors without React). */
function detectLocale(): string {
  if (typeof window === "undefined") return "es";
  const match = window.location.pathname.match(/^\/(es|en)/);
  return match ? match[1] : "es";
}

/** Safe hardcoded fallback messages when no translator is available (e.g. in interceptors). */
const FALLBACK_MESSAGES_BY_LOCALE: Record<string, Record<ErrorCode, string>> = {
  en: {
    UNKNOWN_ERROR: "An unexpected error occurred",
    CLIENT_ERROR: "Request error. Please verify the data",
    NETWORK_ERROR: "Connection error. Please check your network",
    SERVER_ERROR: "Server error. Please try again later",
    VALIDATION_ERROR: "The entered data is not valid",
    UNAUTHORIZED: "Session expired. Please log in again",
    FORBIDDEN: "You do not have permission for this action",
    NOT_FOUND: "The requested resource was not found",
  },
  es: {
    UNKNOWN_ERROR: "Ha ocurrido un error inesperado",
    CLIENT_ERROR: "Error en la solicitud. Verifica los datos",
    NETWORK_ERROR: "Error de conexión. Verifica tu conexión a internet",
    SERVER_ERROR: "Error del servidor. Intenta de nuevo más tarde",
    VALIDATION_ERROR: "Los datos ingresados no son válidos",
    UNAUTHORIZED: "Sesión expirada. Inicia sesión nuevamente",
    FORBIDDEN: "No tienes permisos para esta acción",
    NOT_FOUND: "El recurso solicitado no fue encontrado",
  },
};

/** Resolves fallback messages for the current locale. */
function getFallbackMessages(): Record<ErrorCode, string> {
  const locale = detectLocale();
  return FALLBACK_MESSAGES_BY_LOCALE[locale] ?? FALLBACK_MESSAGES_BY_LOCALE.es;
}

/**
 * Formats validation errors for display in a toast description.
 */
function formatValidationErrors(errors: Record<string, string[]>): string {
  return Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
    .join("\n");
}
