"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "cookies-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, parse } from "date-fns";
import {
  CalendarIcon,
  Upload,
  FileAudio2,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function AudioUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [type, setType] = useState<"ads" | "songs" | "">("");
  const [channel, setChannel] = useState("");
  const [region, setRegion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [uploadStats, setUploadStats] = useState({
    inserted: 0,
    skipped: 0,
    errors: [],
  });
  const router = useRouter();
  const uploadRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const cookieToken = getCookie("token");
    if (cookieToken) {
      setToken(typeof cookieToken === "string" ? cookieToken : null);
    } else {
      router.push("/auth/login");
    }
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
    }
  };

  const formatDateForAPI = (date: Date | undefined): string => {
    if (!date) return "";
    return format(date, "yyyy-MM-dd");
  };

  const resetForm = () => {
    setFiles([]);
    setDate(undefined);
    setType("");
    setChannel("");
    setRegion("");
    if (uploadRef.current) {
      uploadRef.current.reset();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!files.length || !date || !type || !channel || !region) {
      setError("All fields are required");
      setShowErrorDialog(true);
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("date", formatDateForAPI(date));
    formData.append("type", type);
    formData.append("channel", channel);
    formData.append("region", region);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/audio-clips/upload", true);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      // Track the actual upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = (event.loaded / event.total) * 100;
          setProgress(Math.round(percent));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            setSuccess(`Upload completed successfully!`);
            setUploadStats({
              inserted: data.inserted,
              skipped: data.skipped,
              errors: data.errors || [],
            });
            setShowSuccessDialog(true);
            resetForm();
          } catch (jsonError) {
            setError("Invalid server response");
            setShowErrorDialog(true);
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            setError(data.error || "Error uploading files");
            setShowErrorDialog(true);
          } catch (jsonError) {
            setError("Server returned an invalid response");
            setShowErrorDialog(true);
          }
        }
        setUploading(false);
        setProgress(0);
      };

      xhr.onerror = () => {
        setError("Network error occurred during upload");
        setShowErrorDialog(true);
        setUploading(false);
        setProgress(0);
      };

      xhr.send(formData);
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      setShowErrorDialog(true);
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-foreground">
        Upload Audio Clips
      </h1>

      {!token ? (
        <Alert variant="default" className="bg-muted mb-6">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <AlertDescription className="text-muted-foreground">
            Please wait, verifying authentication...
          </AlertDescription>
        </Alert>
      ) : (
        <Card className="shadow-md">
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center">
              <FileAudio2 className="mr-2 h-6 w-6" />
              Upload Audio Files
            </CardTitle>
            <CardDescription>
              Upload audio clips for radio monitoring and analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form ref={uploadRef} onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="files" className="text-foreground font-medium">
                  Audio Files
                </Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                  <Input
                    id="files"
                    type="file"
                    multiple
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="files"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <span className="text-sm font-medium mb-1">
                      {files.length > 0
                        ? `${files.length} file${
                            files.length !== 1 ? "s" : ""
                          } selected`
                        : "Click to select audio files"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      MP3, WAV, or other audio formats
                    </span>
                  </label>
                </div>
                {files.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Selected files:</p>
                    <ul className="text-sm text-muted-foreground max-h-28 overflow-y-auto">
                      {files.map((file, index) => (
                        <li key={index} className="truncate">
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)}{" "}
                          MB)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-foreground font-medium">
                    Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        disabled={uploading}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? (
                          format(date, "PPP")
                        ) : (
                          <span>Select a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="text-foreground font-medium">
                    Content Type
                  </Label>
                  <Select
                    value={type}
                    onValueChange={(value: "ads" | "songs" | "") =>
                      setType(value)
                    }
                    disabled={uploading}
                  >
                    <SelectTrigger id="type" className="w-full">
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ads">Advertisements</SelectItem>
                      <SelectItem value="songs">Songs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="channel"
                    className="text-foreground font-medium"
                  >
                    Channel
                  </Label>
                  <Input
                    id="channel"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    placeholder="Enter radio channel name"
                    className="bg-background text-foreground"
                    disabled={uploading}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="region"
                    className="text-foreground font-medium"
                  >
                    Region
                  </Label>
                  <Input
                    id="region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Enter region name"
                    className="bg-background text-foreground"
                    disabled={uploading}
                  />
                </div>
              </div>

              {uploading && (
                <div className="space-y-2 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Uploading files...
                    </span>
                    <span className="text-sm font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2 w-full" />
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="mr-2"
                  disabled={uploading}
                >
                  Clear
                </Button>
                <Button
                  type="submit"
                  disabled={uploading}
                  className="min-w-[120px]"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Error Dialog */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-destructive mr-2" />
              Upload Error
            </AlertDialogTitle>
            <AlertDialogDescription>{error}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
              Upload Successful
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{success}</p>
              <div className="text-sm mt-2 pt-2 border-t">
                <p>
                  <strong>{uploadStats.inserted}</strong> files uploaded
                  successfully
                </p>
                <p>
                  <strong>{uploadStats.skipped}</strong> files skipped
                  (duplicates)
                </p>

                {uploadStats.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Errors:</p>
                    <ul className="list-disc pl-5 text-xs">
                      {uploadStats.errors.map((err, index) => (
                        <li key={index}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
