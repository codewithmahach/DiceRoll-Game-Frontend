// Centralized API configuration for DiceClash Frontend
// Supports environment-driven API URLs (for Vercel deployment) with localhost fallback

export const API_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/+$/, "")
  : "http://localhost:5001";
