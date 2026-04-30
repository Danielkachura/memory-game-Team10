// In production on Vercel, VITE_API_BASE is set to the Railway backend URL.
// In dev, it's empty and calls go to the Vite proxy (localhost:8000).
export const API_BASE: string = (import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE ?? "";
