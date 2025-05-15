// src/app/register/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RegisterForm } from "@/components/register-form";
import { getCookie } from "cookies-next";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getCookie("token");
      console.log(
        `RegisterPage: Token found: ${
          typeof token === "string" ? token.slice(0, 10) + "..." : "none"
        }`
      );

      if (!token) {
        console.log("RegisterPage: No token, showing register form");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          console.log("RegisterPage: Token valid, redirecting to /dashboard");
          setIsAuthenticated(true);
          router.replace("/dashboard");
        } else {
          console.log("RegisterPage: Token invalid, clearing cookie");
          document.cookie = "token=; Max-Age=0; path=/";
          document.cookie = "user=; Max-Age=0; path=/";
          setIsLoading(false);
        }
      } catch (error) {
        console.error("RegisterPage: Error verifying token:", error);
        document.cookie = "token=; Max-Age=0; path=/";
        document.cookie = "user=; Max-Age=0; path=/";
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

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
        <RegisterForm />
      </div>
    </div>
  );
}
