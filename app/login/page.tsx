// src/app/login/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCookie } from "cookies-next";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/dashboard";
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getCookie("token");
      console.log(
        `LoginPage: Token found: ${typeof token === "string" ? token.slice(0, 10) + "..." : "none"}`
      );

      if (!token) {
        console.log("LoginPage: No token, showing login form");
        setIsLoading(false);
        return;
      }

      try {
        // Verify token by calling a protected API
        const response = await fetch("/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          console.log("LoginPage: Token valid, redirecting to", from);
          setIsAuthenticated(true);
          router.replace(from);
        } else {
          console.log("LoginPage: Token invalid, clearing cookie");
          document.cookie = "token=; Max-Age=0; path=/";
          document.cookie = "user=; Max-Age=0; path=/";
          setIsLoading(false);
        }
      } catch (error) {
        console.error("LoginPage: Error verifying token:", error);
        document.cookie = "token=; Max-Age=0; path=/";
        document.cookie = "user=; Max-Age=0; path=/";
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, from]);

  if (isLoading) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
