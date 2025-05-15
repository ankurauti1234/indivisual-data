// lib/auth.ts
import { getCookie } from "cookies-next";
import { NextRequest } from "next/server";

export interface User {
  id: string;
  name: string;
  email: string;
}

export function getAuthUser(): User | null {
  const userCookie = getCookie("user");
  if (!userCookie) return null;

  try {
    return JSON.parse(userCookie as string) as User;
  } catch (error) {
    return null;
  }
}

export function getAuthToken(): string | null {
  return getCookie("token") as string | null;
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// For server components and API routes
export function getServerAuthToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.split(" ")[1];
}
