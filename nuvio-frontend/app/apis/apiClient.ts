// app/apis/apiClient.ts
export const API_BASE_URL = "http://localhost:3001";

export async function apiGet(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    // importante para que Next no cachee eternamente
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }

  return res.json();
}
