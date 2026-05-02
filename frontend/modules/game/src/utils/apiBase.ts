// Set VITE_API_BASE to the backend URL in production (e.g. Railway).
// In dev this is empty and Vite's proxy handles /api/* → localhost:8000.
export const API_BASE: string = (import.meta as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE ?? "";
