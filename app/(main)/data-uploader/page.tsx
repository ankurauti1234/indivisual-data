"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "cookies-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface UploadResponse {
  message: string;
  processed?: number;
  inserted?: number;
  skipped?: number;
  errors?: string[];
}

export default function DataUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [response, setResponse] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const cookieToken = getCookie("token");
    if (cookieToken) {
      setToken(typeof cookieToken === "string" ? cookieToken : null);
    } else {
      router.push("/auth/login");
    }
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResponse(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a JSON file");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/radio-data/upload", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error uploading file");
      }

      setResponse(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewData = useCallback(() => {
    router.push("/data-viewer");
  }, [router]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-foreground">
        Radio Data Uploader
      </h1>

      {!token ? (
        <Alert variant="default" className="bg-muted mb-6">
          <AlertDescription className="text-muted-foreground">
            Please wait, verifying authentication...
          </AlertDescription>
        </Alert>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload JSON File</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <Label htmlFor="file-upload" className="text-foreground mb-2">
                  Select JSON File
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="bg-background text-foreground"
                  disabled={isUploading}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Upload a JSON file containing radio data entries.
                </p>
              </div>

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={isUploading || !file}
                  variant={isUploading || !file ? "ghost" : "default"}
                >
                  {isUploading ? "Uploading..." : "Upload Data"}
                </Button>
                <Button
                  type="button"
                  onClick={handleViewData}
                  variant="secondary"
                >
                  View Data
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {response && (
        <Alert variant="default" className="bg-success/15 text-success">
          <AlertTitle>Upload Results</AlertTitle>
          <AlertDescription>
            <p className="font-medium">{response.message}</p>

            {response.processed !== undefined && (
              <ul className="mt-2 text-sm">
                <li>Processed: {response.processed} entries</li>
                <li>Inserted: {response.inserted} entries</li>
                <li>Skipped: {response.skipped} entries (duplicates)</li>
              </ul>
            )}

            {response.errors && response.errors.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-1">Validation Errors:</h3>
                <ul className="list-disc list-inside text-sm">
                  {response.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
