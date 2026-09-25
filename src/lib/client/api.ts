import type { Dictionary } from "@/lib/i18n/en";

/** Client-side fetch wrapper with typed errors mapped to translated messages. */
export class ClientApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(url: string, options: { method?: string; body?: unknown; signal?: AbortSignal; form?: FormData } = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? (options.body !== undefined || options.form ? "POST" : "GET"),
      headers: options.form ? undefined : { "Content-Type": "application/json" },
      body: options.form ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
      signal: options.signal,
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ClientApiError("network", 0, "Network error");
  }
  if (response.status === 204) return undefined as T;
  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON response (e.g. a proxy error page).
  }
  if (!response.ok) {
    const err = (data as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ClientApiError(err?.code ?? "internal", response.status, err?.message ?? response.statusText);
  }
  return data as T;
}

export function errorMessage(dict: Dictionary, error: unknown): string {
  if (error instanceof ClientApiError) {
    const known = (dict.errors as Record<string, string>)[error.code];
    return known ?? dict.errors.generic;
  }
  return dict.errors.generic;
}
