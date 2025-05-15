"use client";

import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const authToken = getCookie("token") as string | null;
    setToken(authToken);
    setIsLoading(false);

    if (!authToken) {
      router.push("/login");
    }
  }, [router]);

  // Function to create headers with auth token
  const getAuthHeaders = () => {
    return {
      Authorization: token ? `Bearer ${token}` : "",
    };
  };

  return { token, isLoading, getAuthHeaders };
}
