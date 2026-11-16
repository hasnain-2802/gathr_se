export const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

// ONE place to change once the login page stores the Supabase session.
// For now it reads a token saved under "access_token".
export function getToken(): string | null {
  try {
    return localStorage.getItem('access_token');
  } catch {
    return null;
  }
}
