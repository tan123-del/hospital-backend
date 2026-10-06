// Automatically picks your live backend in production, or localhost in development
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://hospital-backend-iota.vercel.app"; 
  // ^^^ If your backend Vercel domain is different, paste its exact URL above without a trailing slash
