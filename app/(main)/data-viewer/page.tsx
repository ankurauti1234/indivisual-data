"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "cookies-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns";

interface RadioDataEntry {
  _id: string;
  program: string;
  channel: string;
  id: string;
  date: string;
  start: string;
  end: string;
  type: string;
  audio: string;
  region: string;
  [key: string]: any;
}

export default function DataViewer() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<RadioDataEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;
  const router = useRouter();

  useEffect(() => {
    const cookieToken = getCookie("token");
    if (cookieToken) {
      setToken(typeof cookieToken === "string" ? cookieToken : null);
    } else {
      router.push("/auth/login");
    }
  }, [router]);

  const fetchData = async (
    selectedDate: string,
    page: number,
    start?: string,
    end?: string
  ) => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(start && { startTime: start }),
        ...(end && { endTime: end }),
      });

      const response = await fetch(`/api/radio-data/${selectedDate}?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch data");
      }

      setData(result.data || []);
      setTotalPages(Math.ceil(result.total / itemsPerPage));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && date) {
      fetchData(format(date, "yyyy-MM-dd"), currentPage, startTime, endTime);
    }
  }, [token, date, currentPage, startTime, endTime]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    if (date) {
      fetchData(format(date, "yyyy-MM-dd"), 1, startTime, endTime);
    }
  };

  const handleUpload = () => {
    router.push("/data-uploader");
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(":");
    let hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour}:${minutes} ${ampm}`;
  };

  const calculateDurationInSeconds = (start: string, end: string): number => {
    const startDate = parse(start, "HH:mm", new Date());
    const endDate = parse(end, "HH:mm", new Date());
    return (endDate.getTime() - startDate.getTime()) / 1000;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-foreground">
        Radio Data Viewer
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
            <CardTitle>Search Radio Data</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="date-picker" className="text-foreground mb-2">
                    Select Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="start-time" className="text-foreground mb-2">
                    Start Time (HH:MM)
                  </Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="bg-background text-foreground"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="end-time" className="text-foreground mb-2">
                    End Time (HH:MM)
                  </Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="bg-background text-foreground"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={isLoading || !date}
                  variant={isLoading || !date ? "ghost" : "default"}
                >
                  {isLoading ? "Loading..." : "Search"}
                </Button>
                <Button
                  type="button"
                  onClick={handleUpload}
                  variant="secondary"
                >
                  Upload Data
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

      <Card>
        <CardHeader>
          <CardTitle>
            Radio Data for {date ? format(date, "PPP") : "Selected Date"}
            {data.length > 0 && (
              <span className="ml-2 text-muted-foreground text-base">
                ({data.length} entries)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {isLoading ? (
                <p>Loading data...</p>
              ) : (
                <p>No radio data found for this date</p>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Program</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Time</TableHead>
                      {/* <TableHead>Duration (seconds)</TableHead> */}
                      <TableHead>Type</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Audio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.program}</TableCell>
                        <TableCell>{entry.channel}</TableCell>
                        <TableCell>
                          {formatTime(entry.start)} - {formatTime(entry.end)}
                        </TableCell>
                        {/* <TableCell>
                          {calculateDurationInSeconds(entry.start, entry.end)}
                        </TableCell> */}
                        <TableCell>{entry.type}</TableCell>
                        <TableCell>{entry.region}</TableCell>
                        <TableCell>
                          {entry.audio && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="link"
                                  className="text-primary p-0 h-auto"
                                  onClick={() => setSelectedAudio(entry.audio)}
                                >
                                  Listen
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    Play Audio: {entry.program}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="mt-4">
                                  <audio
                                    controls
                                    src={selectedAudio || entry.audio}
                                    className="w-full"
                                  >
                                    Your browser does not support the audio
                                    element.
                                  </audio>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-between items-center mt-4">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="outline"
                >
                  Previous
                </Button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
