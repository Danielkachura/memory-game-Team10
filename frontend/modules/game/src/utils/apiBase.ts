// Set VITE_API_BASE to the backend URL in production (e.g. Railway).
// In dev this is empty and Vite's proxy handles /api/* → localhost:8000.
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? "";
