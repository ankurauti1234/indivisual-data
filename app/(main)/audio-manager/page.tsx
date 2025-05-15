"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "cookies-next";
import { format } from "date-fns";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  Pencil,
  Trash2,
  Search,
  Save,
  X,
  Filter,
  MoreVertical,
  Calendar,
  Radio,
  Globe,
  FileAudio,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  RefreshCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AudioClip {
  _id: string;
  fileName: string;
  s3Url: string;
  type: "ads" | "songs";
  channel: string;
  region: string;
  date: string;
  uploadedBy: { name?: string; email: string };
  uploadedByUsername: string;
  uploadedAt: string;
}

export default function AudioManager() {
  const [clips, setClips] = useState<AudioClip[]>([]);
  const [date, setDate] = useState("");
  const [type, setType] = useState<"ads" | "songs" | "all" | "">("");
  const [channel, setChannel] = useState("");
  const [region, setRegion] = useState("");
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<AudioClip | null>(null);
  const [deleteConfirmClip, setDeleteConfirmClip] = useState<AudioClip | null>(
    null
  );
  const [showFilters, setShowFilters] = useState(false);
  const limit = 10;
  const router = useRouter();

  // Check authentication on mount
  useEffect(() => {
    const cookieToken = getCookie("token");
    if (cookieToken) {
      setToken(typeof cookieToken === "string" ? cookieToken : null);
      fetchClips();
    } else {
      router.push("/auth/login");
    }
  }, []);

  // Fetch clips when page changes
  useEffect(() => {
    if (token) {
      fetchClips();
    }
  }, [page]);

  const fetchClips = async (resetPage = false) => {
    try {
      setLoading(true);
      setSearchLoading(true);
      const currentPage = resetPage ? 1 : page;
      if (resetPage) setPage(1);

      const params = new URLSearchParams();
      if (date) params.append("date", date);
      if (type && type !== "all") params.append("type", type);
      if (channel) params.append("channel", channel);
      if (region) params.append("region", region);
      if (name) params.append("name", name);
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());

      const response = await fetch(`/api/audio-clips?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setClips(data.data);
        setTotal(data.total);
        setError(null);
      } else {
        setError(data.message || "Error fetching clips");
      }
    } catch (err) {
      setError("An unknown error occurred");
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const handleSearch = () => {
    fetchClips(true); // Reset page on search
  };

  const handleEdit = async (id: string) => {
    if (!newName) {
      setError("New name is required");
      return;
    }

    try {
      const response = await fetch(`/api/audio-clips/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fileName: newName }),
      });

      const data = await response.json();
      if (response.ok) {
        setClips(
          clips.map((clip) =>
            clip._id === id ? { ...clip, fileName: newName } : clip
          )
        );
        setEditId(null);
        setNewName("");
      } else {
        setError(data.message || "Error updating clip");
      }
    } catch (err) {
      setError("An unknown error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/audio-clips/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setClips(clips.filter((clip) => clip._id !== id));
        setDeleteConfirmClip(null);
      } else {
        setError(data.message || "Error deleting clip");
      }
    } catch (err) {
      setError("An unknown error occurred");
    }
  };

  const formatDateDisplay = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (e) {
      return dateString;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setDate("");
    setType("");
    setChannel("");
    setRegion("");
    setName("");
    fetchClips(true);
  };

  const hasActiveFilters = () => {
    return date || type || channel || region || name;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Audio Clips Manager
          </h1>
          <p className="text-muted-foreground">
            Browse, search, and manage your audio clips library
          </p>
          <Separator className="my-4" />
        </div>

        {!token ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-36 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
            {error && (
              <Alert variant="destructive" className="mb-2">
                {/* <AlertTitle className="flex items-center">
                  <X className="h-4 w-4 mr-2" /> Error
                </AlertTitle>
                <AlertDescription>{error}</AlertDescription> */}
              </Alert>
            )}

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center">
                      <FileAudio className="mr-2 h-5 w-5" />
                      Audio Library
                    </CardTitle>
                    <CardDescription>
                      {total > 0 ? (
                        <span>
                          {total} clip{total !== 1 ? "s" : ""} found
                        </span>
                      ) : loading ? (
                        <span>Loading results...</span>
                      ) : (
                        <span>No clips found</span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className={
                              showFilters || hasActiveFilters()
                                ? "border-primary"
                                : ""
                            }
                          >
                            <ListFilter className="h-4 w-4 mr-2" />
                            Filters
                            {hasActiveFilters() && (
                              <Badge
                                variant="default"
                                className="ml-2 h-5 px-1.5"
                              >
                                {
                                  Object.values({
                                    date,
                                    type,
                                    channel,
                                    region,
                                    name,
                                  }).filter(Boolean).length
                                }
                              </Badge>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Toggle search filters</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchClips()}
                            disabled={loading}
                          >
                            {loading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Refresh
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Refresh audio clips</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardHeader>

              {showFilters && (
                <CardContent className="border-t pt-4 pb-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label
                        htmlFor="date"
                        className="text-foreground flex items-center text-sm font-medium"
                      >
                        <Calendar className="h-4 w-4 mr-1.5 opacity-70" />
                        Date
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="bg-background text-foreground mt-1.5"
                        onKeyPress={handleKeyPress}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="type"
                        className="text-foreground flex items-center text-sm font-medium"
                      >
                        <Radio className="h-4 w-4 mr-1.5 opacity-70" />
                        Type
                      </Label>
                      <Select
                        value={type}
                        onValueChange={(value: "ads" | "songs" | "all" | "") =>
                          setType(value)
                        }
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="ads">Ads</SelectItem>
                          <SelectItem value="songs">Songs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label
                        htmlFor="channel"
                        className="text-foreground flex items-center text-sm font-medium"
                      >
                        <Radio className="h-4 w-4 mr-1.5 opacity-70" />
                        Channel
                      </Label>
                      <Input
                        id="channel"
                        value={channel}
                        onChange={(e) => setChannel(e.target.value)}
                        className="bg-background text-foreground mt-1.5"
                        onKeyPress={handleKeyPress}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="region"
                        className="text-foreground flex items-center text-sm font-medium"
                      >
                        <Globe className="h-4 w-4 mr-1.5 opacity-70" />
                        Region
                      </Label>
                      <Input
                        id="region"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="bg-background text-foreground mt-1.5"
                        onKeyPress={handleKeyPress}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="name"
                        className="text-foreground flex items-center text-sm font-medium"
                      >
                        <FileAudio className="h-4 w-4 mr-1.5 opacity-70" />
                        File Name
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-background text-foreground mt-1.5"
                        onKeyPress={handleKeyPress}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={handleSearch}
                      className="flex items-center"
                      disabled={searchLoading}
                    >
                      {searchLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="mr-2 h-4 w-4" />
                      )}
                      Search
                    </Button>
                    <Button onClick={clearSearch} variant="outline">
                      Clear Filters
                    </Button>
                  </div>
                </CardContent>
              )}

              <CardContent className="pt-0">
                {loading && clips.length === 0 ? (
                  <div className="space-y-2 mt-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : clips.length > 0 ? (
                  <div className="rounded-md border overflow-hidden mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>File Name</TableHead>
                          <TableHead className="hidden md:table-cell">
                            Type
                          </TableHead>
                          <TableHead className="hidden md:table-cell">
                            Channel
                          </TableHead>
                          <TableHead className="hidden md:table-cell">
                            Region
                          </TableHead>
                          <TableHead className="hidden md:table-cell">
                            Date
                          </TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clips.map((clip) => (
                          <TableRow
                            key={clip._id}
                            className="hover:bg-muted/50"
                          >
                            <TableCell className="font-medium">
                              {editId === clip._id ? (
                                <Input
                                  value={newName}
                                  onChange={(e) => setNewName(e.target.value)}
                                  autoFocus
                                  className="max-w-xs"
                                />
                              ) : (
                                <div className="flex items-center">
                                  {clip.type === "ads" ? (
                                    <Badge
                                      variant="outline"
                                      className="mr-2 py-0.5 px-1.5 bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200"
                                    >
                                      Ad
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="mr-2 py-0.5 px-1.5 bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200"
                                    >
                                      Song
                                    </Badge>
                                  )}
                                  <span className="truncate max-w-xs">
                                    {clip.fileName}
                                  </span>
                                </div>
                              )}
                              <div className="md:hidden mt-1">
                                <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                  <span className="flex items-center">
                                    <Radio className="h-3 w-3 mr-1 opacity-70" />
                                    {clip.channel}
                                  </span>
                                  <span className="flex items-center">
                                    <Globe className="h-3 w-3 mr-1 opacity-70" />
                                    {clip.region}
                                  </span>
                                  <span className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1 opacity-70" />
                                    {formatDateDisplay(clip.date)}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="capitalize hidden md:table-cell">
                              {clip.type}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {clip.channel}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {clip.region}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {formatDateDisplay(clip.date)}
                            </TableCell>
                            <TableCell>
                              {editId === clip._id ? (
                                <div className="flex space-x-2">
                                  <Button
                                    onClick={() => handleEdit(clip._id)}
                                    size="sm"
                                    variant="default"
                                  >
                                    <Save className="h-4 w-4 mr-1" />
                                    Save
                                  </Button>
                                  <Button
                                    onClick={() => setEditId(null)}
                                    size="sm"
                                    variant="secondary"
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex space-x-2">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => setPlayingAudio(clip)}
                                          className="text-primary hover:text-primary hover:bg-primary/10"
                                        >
                                          <Play className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Play audio</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  <DropdownMenu>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                              <MoreVertical className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>More actions</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setEditId(clip._id);
                                          setNewName(clip.fileName);
                                        }}
                                        className="flex items-center cursor-pointer"
                                      >
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Rename
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          setDeleteConfirmClip(clip)
                                        }
                                        className="flex items-center text-destructive focus:text-destructive cursor-pointer"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : hasActiveFilters() ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">
                      No matching clips found
                    </h3>
                    <p className="text-muted-foreground max-w-sm mt-1">
                      Try adjusting your search filters or clear them to see all
                      available clips.
                    </p>
                    <Button
                      onClick={clearSearch}
                      variant="outline"
                      className="mt-4"
                    >
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileAudio className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">
                      No audio clips found
                    </h3>
                    <p className="text-muted-foreground max-w-sm mt-1">
                      Your audio library is empty. Upload some audio clips to
                      get started.
                    </p>
                  </div>
                )}

                {clips.length > 0 && total > limit && (
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {(page - 1) * limit + 1}-
                      {Math.min(page * limit, total)} of {total} clips
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-sm">
                        Page {page} of {Math.ceil(total / limit)}
                      </div>
                      <Button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= Math.ceil(total / limit)}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Audio Player Dialog */}
      <Dialog
        open={!!playingAudio}
        onOpenChange={(open) => !open && setPlayingAudio(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileAudio className="h-5 w-5 mr-2" />
              Playing Audio
            </DialogTitle>
            <DialogDescription>
              {playingAudio?.fileName}
              <Badge variant="outline" className="ml-2 bg-muted">
                {playingAudio?.type === "ads" ? "Advertisement" : "Song"}
              </Badge>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 py-4">
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Channel:</span>{" "}
                {playingAudio?.channel}
              </div>
              <div>
                <span className="font-medium">Region:</span>{" "}
                {playingAudio?.region}
              </div>
              <div>
                <span className="font-medium">Date:</span>{" "}
                {playingAudio && formatDateDisplay(playingAudio.date)}
              </div>
            </div>

            {playingAudio && (
              <div className="bg-muted p-4 rounded-md">
                <audio controls className="w-full">
                  <source src={playingAudio.s3Url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-start">
            <Button variant="secondary" onClick={() => setPlayingAudio(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirmClip}
        onOpenChange={(open) => !open && setDeleteConfirmClip(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <Trash2 className="h-5 w-5 text-destructive mr-2" />
              Delete Audio Clip
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the audio clip
              <Badge
                variant="outline"
                className="mx-1 bg-destructive/5 text-destructive border-destructive/20"
              >
                {deleteConfirmClip?.fileName}
              </Badge>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteConfirmClip && handleDelete(deleteConfirmClip._id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
