import axios from "axios";

// Instancia única de Axios
// Prioriza NEXT_PUBLIC_API_URL (disponible en cliente y servidor)
// Si no está definida, verifica NEXT_API_URL (solo servidor)
// Valor por defecto: http://localhost:4000/v1
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Contador de peticiones activas para manejar múltiples peticiones simultáneas
let activeRequests = 0;
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- dynamic import type for jotai store
type JotaiStore = ReturnType<(typeof import("jotai"))["getDefaultStore"]>;
let storeInstance: JotaiStore | null = null;

// Función para obtener o crear la instancia del store de Jotai
async function getStore() {
  if (typeof window === "undefined") return null;

  if (!storeInstance) {
    const { getDefaultStore } = await import("jotai");
    storeInstance = getDefaultStore();
  }

  return storeInstance;
}

function isMessagesSectionRequest(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes("/conversations") || url === "/messages";
}

function shouldSkipGlobalLoading(url: string | undefined): boolean {
  return (
    url?.includes("/auth/login") === true || isMessagesSectionRequest(url)
  );
}

async function updateApiLoading(isLoading: boolean) {
  if (typeof window === "undefined") return;

  const store = await getStore();
  if (!store) return;

  const { apiLoadingAtom } = await import("@/lib/store/loading.atoms");

  if (isLoading) {
    activeRequests++;
    store.set(apiLoadingAtom, true);
  } else {
    activeRequests = Math.max(0, activeRequests - 1);
    if (activeRequests === 0) {
      store.set(apiLoadingAtom, false);
    }
  }
}

// Función helper para obtener token (usada en client.ts)
export async function getAuthToken(): Promise<string | null> {
  if (process.env.NODE_ENV === "test") return null;
  // En el cliente, usar getSession de next-auth/react
  if (typeof window !== "undefined") {
    const { getSession } = await import("next-auth/react");
    const session = await getSession();
    return session?.accessToken || null;
  }
  // En el servidor, el token se pasa explícitamente o se obtiene de las cookies
  // Por ahora retornamos null, el token se manejará en client.ts
  return null;
}

// Interceptor de request para activar loading
api.interceptors.request.use(
  async (config) => {
    if (
      typeof window !== "undefined" &&
      !shouldSkipGlobalLoading(config.url)
    ) {
      await updateApiLoading(true);
    }
    return config;
  },
  async (error) => {
    if (
      typeof window !== "undefined" &&
      !shouldSkipGlobalLoading(error.config?.url)
    ) {
      await updateApiLoading(false);
    }
    return Promise.reject(error);
  },
);

// Interceptor de respuesta para manejar errores y desactivar loading
api.interceptors.response.use(
  async (response) => {
    if (
      typeof window !== "undefined" &&
      !shouldSkipGlobalLoading(response.config.url)
    ) {
      await updateApiLoading(false);
    }
    return response;
  },
  async (error) => {
    const isAuthRequest = error.config?.url?.includes("/auth/login");

    // Solo manejar errores en el cliente
    if (typeof window !== "undefined") {
      const { showError } = await import("@/lib/utils/error-handler");
      const { normalizeError } = await import("./errors");

      const appError = normalizeError(error);

      // Mostrar errores de conexión incluso durante el login
      // Para que el usuario sepa que el servidor no está disponible
      if (appError.code === "NETWORK_ERROR") {
        showError(appError, { logError: true });
      } else if (!isAuthRequest) {
        // Mostrar otros errores solo si no es una petición de login
        showError(appError, { logError: true });
      }

      if (error.response?.status === 401 && !isAuthRequest) {
        const currentPath = window.location.pathname;
        if (!currentPath.endsWith("/login")) {
          const localeMatch = currentPath.match(/^\/(es|en)/);
          const locale = localeMatch ? localeMatch[1] : "es";
          const loginPath = `/${locale}/login`;
          const { signOut } = await import("next-auth/react");
          await signOut({ callbackUrl: loginPath, redirect: true });
        }
      }
    }

    if (
      typeof window !== "undefined" &&
      !shouldSkipGlobalLoading(error.config?.url)
    ) {
      await updateApiLoading(false);
    }

    return Promise.reject(error);
  },
);
