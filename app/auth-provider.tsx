// src/app/auth-provider.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCookie, setCookie, deleteCookie } from "cookies-next";
import { User } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize auth state from cookies
  useEffect(() => {
    const storedToken = getCookie("token") as string | null;
    let storedUser: User | null = null;

    try {
      const userStr = getCookie("user") as string | undefined;
      if (userStr) {
        storedUser = JSON.parse(userStr);
      }
    } catch (e) {
      console.error("Failed to parse user from cookie", e);
    }

    setToken(storedToken);
    setUser(storedUser);
    setIsLoading(false);

    // Handle protected routes
    const isProtectedRoute = ["/dashboard", "/profile", "/settings"].some(
      (route) => pathname?.startsWith(route)
    );

    if (isProtectedRoute && !storedToken) {
      router.replace(`/login?from=${pathname}`);
    }
  }, [pathname, router]);

  const login = (newToken: string, newUser: User) => {
    // Set in state
    setToken(newToken);
    setUser(newUser);

    // Set in cookies with 7 day expiry
    setCookie("token", newToken, { maxAge: 60 * 60 * 24 * 7 });
    setCookie("user", JSON.stringify(newUser), { maxAge: 60 * 60 * 24 * 7 });
  };

  const logout = () => {
    // Clear state
    setToken(null);
    setUser(null);

    // Clear cookies
    deleteCookie("token");
    deleteCookie("user");

    // Redirect to login
    router.replace("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
