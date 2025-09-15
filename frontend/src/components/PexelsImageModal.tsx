"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/custom-ui/dialog";
import { Input } from "@/components/custom-ui/input";
import { Button } from "@/components/custom-ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/custom-ui/tabs";
import {
  Search,
  Image as ImageIcon,
  Loader2,
  X,
  Upload,
  FileImage,
  Sparkles,
  Brain,
} from "lucide-react";
import { searchImages, getPopularImages, PexelsPhoto } from "@/services/pexels";
import { uploadFile } from "@/services/file-upload";
import {
  compressImageFile,
  downloadAndCompressImage,
} from "@/utils/imageCompression";

interface PexelsImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  aspectRatio?: "square" | "portrait" | "landscape";
  searchValue: string;
  fixedSize?: "original" | "large2x" | "large" | "medium" | "small";
}

export function PexelsImageModal({
  isOpen,
  onClose,
  onSelect,
  aspectRatio = "square",
  searchValue,
  fixedSize,
}: PexelsImageModalProps) {
  const [images, setImages] = useState<PexelsPhoto[]>([]);
  const [query, setQuery] = useState(searchValue || "");
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<"search" | "upload">("search");
  const [selectedSize, setSelectedSize] = useState<
    "original" | "large2x" | "large" | "medium" | "small"
  >(fixedSize ?? "medium");

  const handleTabChange = (value: string) => {
    if (value === "search" || value === "upload") {
      setActiveTab(value);
    }
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial images when component mounts or searchValue changes
  useEffect(() => {
    if (isOpen && searchValue) {
      setQuery(searchValue);
      loadImages(searchValue, 1, true);
    }
  }, [isOpen, searchValue]);

  // Sync selected size if fixedSize changes
  useEffect(() => {
    if (fixedSize) setSelectedSize(fixedSize);
  }, [fixedSize]);

  const loadImages = async (
    query: string = "",
    pageNum: number = 1,
    reset: boolean = false
  ) => {
    try {
      setIsLoading(true);
      let response;

      if (query.trim()) {
        response = await searchImages(query, pageNum);
      } else {
        response = await getPopularImages(pageNum);
      }

      if (reset) {
        setImages(response.photos);
      } else {
        setImages((prev) => [...prev, ...response.photos]);
      }

      setHasMore(response.photos.length > 0);
    } catch (error) {
      console.error("Error loading images:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadImages(query, 1, true);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadImages(query, nextPage, false);
  };

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const target = e.target as HTMLImageElement;
    target.style.display = "none";
  };

  const getImageClass = (): string => {
    switch (aspectRatio) {
      case "portrait":
        return "object-cover w-full h-64";
      case "landscape":
        return "object-cover w-full h-48";
      case "square":
      default:
        return "object-cover w-full h-48";
    }
  };

  const getSrcBySize = (
    photo: PexelsPhoto,
    size: "original" | "large2x" | "large" | "medium" | "small"
  ): string => {
    // Pexels src object supports these keys; fallback to medium if missing
    const map = photo.src as any;
    return (
      map?.[size] || map?.medium || map?.large || map?.small || map?.original
    );
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      console.error("Invalid file type. Please upload an image file.");
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      console.error("File is too large. Maximum size is 10MB.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // 1) Compress client-side to <= 700 KB before uploading
      const compressed = (await compressImageFile(file, {
        maxSizeKB: 100,
        mimeType: "image/jpeg",
        maxWidth: 2000,
        maxHeight: 2000,
        returnType: "file",
        outputFilename: `${file.name.replace(/\.[^.]+$/, "")}-compressed.jpg`,
      })) as File;

      // 2) Upload with progress reporting
      const result = await uploadFile(compressed, {
        renameFile: true,
        preview: true,
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const percent = Math.min(
            99,
            Math.round((evt.loaded / evt.total) * 100)
          );
          setUploadProgress(percent);
        },
      });

      setUploadProgress(100);
      onSelect(result?.url || "");
      onClose();
    } catch (error) {
      console.error("Upload failed:", error);
      // Reset progress on error
      setUploadProgress(0);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        hideClose
        className="z-[9999] bg-gradient-to-br from-white/95 via-slate-50/95 to-blue-50/95 dark:from-slate-900/95 dark:via-slate-800/95 dark:to-purple-900/95 backdrop-blur-xl border-0 p-0 m-0 max-w-none w-screen h-screen min-h-screen overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 rounded-none"
      >
        <div className="relative w-full h-full flex flex-col">
          {/* Enhanced AI-Inspired Background Effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Animated Holographic Orbs */}
            <div
              className="absolute top-20 left-20 w-80 h-80 bg-gradient-to-r from-blue-400/15 via-cyan-400/10 to-purple-400/15 rounded-full blur-3xl"
              style={{
                animationName: "pulse",
                animationDuration: "4s",
                animationIterationCount: "infinite",
              }}
            />
            <div
              className="absolute bottom-32 right-32 w-64 h-64 bg-gradient-to-r from-purple-400/15 via-pink-400/10 to-rose-400/15 rounded-full blur-2xl"
              style={{
                animationName: "pulse",
                animationDuration: "6s",
                animationDelay: "2s",
                animationIterationCount: "infinite",
              }}
            />
            <div
              className="absolute top-1/2 left-1/3 w-40 h-40 bg-gradient-to-r from-cyan-400/15 via-teal-400/10 to-blue-400/15 rounded-full blur-xl"
              style={{
                animationName: "pulse",
                animationDuration: "8s",
                animationDelay: "4s",
                animationIterationCount: "infinite",
              }}
            />
            <div
              className="absolute top-1/4 right-1/4 w-56 h-56 bg-gradient-to-r from-indigo-400/10 via-purple-400/15 to-pink-400/10 rounded-full blur-2xl"
              style={{
                animationName: "pulse",
                animationDuration: "7s",
                animationDelay: "1s",
                animationIterationCount: "infinite",
              }}
            />

            {/* Enhanced Neural Network Grid */}
            <div className="absolute inset-0 opacity-40 dark:opacity-25">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-500/8 to-purple-500/8" />
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                       radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
                       radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.15) 0%, transparent 50%),
                       radial-gradient(circle at 50% 10%, rgba(34, 197, 94, 0.1) 0%, transparent 40%),
                       linear-gradient(45deg, transparent 48%, rgba(59, 130, 246, 0.08) 49%, rgba(59, 130, 246, 0.08) 51%, transparent 52%),
                       linear-gradient(-45deg, transparent 48%, rgba(147, 51, 234, 0.08) 49%, rgba(147, 51, 234, 0.08) 51%, transparent 52%)
                     `,
                  backgroundSize:
                    "120px 120px, 180px 180px, 200px 200px, 60px 60px, 60px 60px",
                }}
              />
            </div>

            {/* Floating Particles */}
            <div
              className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/60 rounded-full"
              style={{
                animationName: "bounce",
                animationDuration: "3s",
                animationDelay: "0s",
                animationIterationCount: "infinite",
              }}
            />
            <div
              className="absolute top-3/4 left-3/4 w-1.5 h-1.5 bg-purple-400/60 rounded-full"
              style={{
                animationName: "bounce",
                animationDuration: "4s",
                animationDelay: "1s",
                animationIterationCount: "infinite",
              }}
            />
            <div
              className="absolute top-1/2 right-1/4 w-1 h-1 bg-cyan-400/60 rounded-full"
              style={{
                animationName: "bounce",
                animationDuration: "5s",
                animationDelay: "2s",
                animationIterationCount: "infinite",
              }}
            />
          </div>

          {/* Modern Responsive Header */}
          <div className="flex-shrink-0 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
            {/* Mobile Header */}
            <div className="block sm:hidden px-3 xs:px-4 py-2 xs:py-3">
              <div className="flex items-center justify-between mb-8 md:mb-3">
                {/* Mobile Logo */}
                <div className="flex items-center gap-1.5 xs:gap-2">
                  <div className="relative">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-1 xs:p-1.5 rounded-md xs:rounded-lg shadow-sm">
                      <Brain className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-white" />
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 xs:w-2 xs:h-2 bg-green-400 rounded-full animate-pulse" />
                  </div>
                  <h1 className="text-sm xs:text-base font-semibold text-slate-900 dark:text-white">
                    <span className="hidden xs:inline">Image Studio</span>
                    <span className="xs:hidden text-lg">Image Studio</span>
                  </h1>
                </div>

                {/* Mobile Close */}
                <button
                  onClick={onClose}
                  className="p-1.5 xs:p-2 rounded-md xs:rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-slate-600 dark:text-slate-400" />
                </button>
              </div>

              {/* Mobile Button Tabs */}
              <div className="flex gap-1 xs:gap-1.5 p-1 xs:p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md xs:rounded-lg w-fit mx-auto">
                <button
                  onClick={() => handleTabChange("search")}
                  className={`flex items-center justify-center gap-1 xs:gap-1.5 py-1.5 xs:py-2 px-2 xs:px-3 sm:px-4 font-medium text-xs transition-all duration-300 rounded-sm xs:rounded-md min-h-[32px] xs:min-h-[36px] sm:min-h-[40px] ${
                    activeTab === "search"
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25"
                      : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-600 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
                >
                  <Search
                    className={`h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 transition-all duration-300 ${
                      activeTab === "search"
                        ? "text-white"
                        : "text-blue-500 dark:text-blue-400"
                    }`}
                  />
                  <span className="text-xs sm:text-sm">Search</span>
                </button>

                <button
                  onClick={() => handleTabChange("upload")}
                  className={`flex items-center justify-center gap-1 xs:gap-1.5 py-1.5 xs:py-2 px-2 xs:px-3 sm:px-4 font-medium text-xs transition-all duration-300 rounded-sm xs:rounded-md min-h-[32px] xs:min-h-[36px] sm:min-h-[40px] ${
                    activeTab === "upload"
                      ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md shadow-purple-500/25"
                      : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-600 hover:text-purple-600 dark:hover:text-purple-400"
                  }`}
                >
                  <Upload
                    className={`h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 transition-all duration-300 ${
                      activeTab === "upload"
                        ? "text-white"
                        : "text-purple-500 dark:text-purple-400"
                    }`}
                  />
                  <span className="text-xs sm:text-sm">Upload</span>
                </button>
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden sm:block px-4 md:px-6 py-3 md:py-4">
              <div className="flex items-center justify-between gap-3 md:gap-6">
                {/* Desktop Logo */}
                <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                  <div className="relative">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-sm">
                      <Brain className="h-4 w-4 md:h-5 md:w-5 text-white" />
                    </div>
                    <div className="absolute -top-0.5 md:-top-1 -right-0.5 md:-right-1 w-2 md:w-2.5 h-2 md:h-2.5 bg-green-400 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white">
                      <span className="hidden lg:inline">AI Image Studio</span>
                      <span className="lg:hidden">AI Studio</span>
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">
                      Powered by AI
                    </p>
                  </div>
                </div>

                {/* Desktop Center Content */}
                <div className="flex-1 max-w-2xl lg:max-w-4xl">
                  <div className="w-full">
                    <div className="flex items-center justify-center md:justify-start gap-3 md:gap-4">
                      {/* Desktop Button Tabs */}
                      <div className="flex gap-1.5 md:gap-2 p-1 md:p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md md:rounded-lg w-fit">
                        <button
                          onClick={() => handleTabChange("search")}
                          className={`flex items-center gap-1.5 md:gap-2 py-2 md:py-2.5 px-3 md:px-4 lg:px-5 font-medium text-xs md:text-sm transition-all duration-300 rounded-sm md:rounded-md min-h-[36px] md:min-h-[42px] group ${
                            activeTab === "search"
                              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                              : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-600 hover:text-blue-600 dark:hover:text-blue-400"
                          }`}
                        >
                          <Search
                            className={`h-3.5 w-3.5 md:h-4 md:w-4 transition-all duration-300 ${
                              activeTab === "search"
                                ? "text-white"
                                : "text-blue-500 dark:text-blue-400 group-hover:scale-105"
                            }`}
                          />
                          <span className="font-medium">Search</span>
                        </button>

                        <button
                          onClick={() => handleTabChange("upload")}
                          className={`flex items-center gap-1.5 md:gap-2 py-2 md:py-2.5 px-3 md:px-4 lg:px-5 font-medium text-xs md:text-sm transition-all duration-300 rounded-sm md:rounded-md min-h-[36px] md:min-h-[42px] group ${
                            activeTab === "upload"
                              ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30"
                              : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-600 hover:text-purple-600 dark:hover:text-purple-400"
                          }`}
                        >
                          <Upload
                            className={`h-3.5 w-3.5 md:h-4 md:w-4 transition-all duration-300 ${
                              activeTab === "upload"
                                ? "text-white"
                                : "text-purple-500 dark:text-purple-400 group-hover:scale-105"
                            }`}
                          />
                          <span className="font-medium">Upload</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop Close */}
                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-1.5 md:p-2 rounded-md md:rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="h-3.5 w-3.5 md:h-4 md:w-4 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Floating Search Bar with Loading Indicator */}
          {activeTab === "search" && (
            <div className="relative z-20">
              <div className="absolute left-0 right-0 top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                <div className="px-3 xs:px-4 sm:px-6 py-2.5 xs:py-3">
                  <div className="max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto flex gap-2 xs:gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 xs:left-3 top-1/2 h-3.5 w-3.5 xs:h-4 xs:w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Describe the image you want..."
                        className="pl-8 xs:pl-10 pr-3 xs:pr-4 py-2.5 xs:py-3 text-xs xs:text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg xs:rounded-xl shadow-sm"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            loadImages(query, 1, true);
                          }
                        }}
                      />
                      {/* Loading indicator overlay */}
                      {isLoading && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg xs:rounded-xl flex items-center justify-center">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                            <span className="text-xs xs:text-sm text-slate-600 dark:text-slate-400 font-medium">
                              Searching...
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => loadImages(query, 1, true)}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-blue-400 disabled:to-blue-500 text-white px-3 xs:px-4 sm:px-6 py-2.5 xs:py-3 rounded-lg xs:rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all duration-300 min-w-[60px] xs:min-w-[80px] sm:min-w-[100px]"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 animate-spin" />
                          <span className="ml-1.5 xs:ml-2 text-xs xs:text-sm hidden sm:inline">
                            Searching
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Sparkles className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                          <span className="ml-1.5 xs:ml-2 text-xs xs:text-sm hidden sm:inline">
                            Search
                          </span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Enhanced Loading Progress Bar */}
                {isLoading && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Floating Image Preview */}
          {selectedImage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
                {/* Image */}
                <div className="relative">
                  <div className="relative min-h-[400px] xs:min-h-[500px] sm:min-h-[600px] md:min-h-[700px] flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                    {/* Loading placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <Loader2 className="h-8 w-8 xs:h-10 xs:w-10 animate-spin text-blue-500" />
                          <div className="absolute inset-0 h-8 w-8 xs:h-10 xs:w-10 border-2 border-blue-200 dark:border-blue-800 rounded-full animate-pulse"></div>
                        </div>
                        <div className="text-center">
                          <p className="text-sm xs:text-base font-medium text-slate-600 dark:text-slate-400">
                            Loading high-quality image...
                          </p>
                          <div className="mt-2 w-32 xs:w-40 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actual image */}
                    <img
                      src={selectedImage}
                      alt="Selected image preview"
                      className="w-full h-auto max-h-[70vh] object-contain opacity-0 transition-opacity duration-500"
                      onLoad={(e) => {
                        e.currentTarget.style.opacity = "1";
                        const placeholder =
                          e.currentTarget.parentElement?.querySelector(
                            ".absolute.inset-0"
                          );
                        if (placeholder) {
                          (placeholder as HTMLElement).style.opacity = "0";
                        }
                      }}
                      onError={(e) => {
                        const placeholder =
                          e.currentTarget.parentElement?.querySelector(
                            ".absolute.inset-0"
                          );
                        if (placeholder) {
                          placeholder.innerHTML = `
                            <div class="flex flex-col items-center gap-3">
                              <div class="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <svg class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                              </div>
                              <p class="text-sm text-red-600 dark:text-red-400 font-medium">Failed to load image</p>
                            </div>
                          `;
                        }
                      }}
                    />
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between p-4 xs:p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      AI-curated image
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => setSelectedImage(null)}
                      variant="outline"
                      className="px-4 xs:px-6 py-2 text-sm xs:text-base border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={uploading}
                      onClick={async () => {
                        if (!selectedImage) return;
                        try {
                          setUploading(true);
                          setUploadProgress(0);

                          // 1) Download and compress the Pexels image to <= 700 KB
                          const compressed = (await downloadAndCompressImage(
                            selectedImage,
                            {
                              maxSizeKB: 700,
                              mimeType: "image/jpeg",
                              maxWidth: 2000,
                              maxHeight: 2000,
                              returnType: "file",
                              outputFilename: "pexels-image-compressed.jpg",
                            }
                          )) as File;

                          // 2) Upload it to our server to save locally
                          const result = await uploadFile(compressed, {
                            renameFile: true,
                            preview: true,
                            onUploadProgress: (evt) => {
                              if (!evt.total) return;
                              const percent = Math.min(
                                99,
                                Math.round((evt.loaded / evt.total) * 100)
                              );
                              setUploadProgress(percent);
                            },
                          });

                          setUploadProgress(100);
                          onSelect(result?.url || "");
                          setSelectedImage(null);
                          onClose();
                        } catch (err) {
                          console.error("Failed to process Pexels image:", err);
                        } finally {
                          setUploading(false);
                        }
                      }}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 xs:px-6 py-2 text-sm xs:text-base font-medium shadow-lg shadow-blue-500/25"
                    >
                      {uploading ? (
                        <div className="flex items-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        <>
                          <svg
                            className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Confirm Selection
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Full Height Content Area */}
          <div className="flex-1 overflow-hidden">
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="h-full"
            >
              {/* Search Tab Content - Full Height */}
              <TabsContent
                value="search"
                className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col"
              >
                {/* Full Height Image Grid */}
                <div className="h-screen overflow-y-auto p-3 xs:p-4 sm:p-6 pb-24 xs:pb-28 sm:pb-32 pt-[4.6rem] xs:pt-18 sm:pt-20">
                  <div className="max-w-7xl mx-auto">
                    {isLoading && images.length === 0 ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                          <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
                            AI is searching for perfect images...
                          </p>
                        </div>
                      </div>
                    ) : images.length === 0 ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                          <div className="relative mb-6">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-slate-200/50 to-slate-300/50 dark:from-slate-700/50 dark:to-slate-600/50 blur-xl" />
                            <ImageIcon className="h-16 w-16 text-slate-400 dark:text-slate-500 relative z-10 mx-auto" />
                          </div>
                          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                            No images found
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Try a different search term or explore trending
                            images.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Size selector (hidden when fixedSize is provided) */}
                        {!fixedSize && (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">
                              Image size:
                            </span>
                            {(
                              [
                                "original",
                                "large2x",
                                "large",
                                "medium",
                                "small",
                              ] as const
                            ).map((sz) => (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => setSelectedSize(sz)}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                                  selectedSize === sz
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                                }`}
                                title={`Use ${sz} size URLs`}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Modern Masonry Grid */}
                        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 2xl:grid-cols-6 gap-2 xs:gap-3">
                          {images.map((image, index) => {
                            const chosenUrl = getSrcBySize(image, selectedSize);
                            const handleImageClick = () =>
                              setSelectedImage(chosenUrl);
                            return (
                              <div
                                key={image.id}
                                className={`group relative rounded-xl overflow-hidden border transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-xl ${
                                  selectedImage === chosenUrl
                                    ? "ring-2 ring-blue-500 border-blue-500 shadow-lg shadow-blue-500/25"
                                    : "border-white/30 dark:border-slate-700/30 hover:border-blue-400/50"
                                }`}
                                onClick={handleImageClick}
                                style={{
                                  animationDelay: `${index * 30}ms`,
                                  animationName: "fadeInUp",
                                  animationDuration: "0.4s",
                                  animationTimingFunction: "ease-out",
                                  animationFillMode: "forwards",
                                }}
                              >
                                <img
                                  src={image.src.medium}
                                  alt={image.alt || "AI-curated image"}
                                  className={`${getImageClass()} group-hover:scale-105 transition-transform duration-500`}
                                  loading="lazy"
                                  onError={handleImageError}
                                />
                                {selectedImage === chosenUrl && (
                                  <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center backdrop-blur-sm">
                                    <div className="bg-blue-500 p-2 rounded-full shadow-lg">
                                      <svg
                                        className="h-4 w-4 text-white"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-2 py-1 rounded-md text-xs text-white font-medium">
                                    AI
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Load More with Enhanced Loading */}
                        {hasMore && (
                          <div className="flex flex-col items-center mt-6 xs:mt-8">
                            {!isLoading ? (
                              <Button
                                onClick={handleLoadMore}
                                disabled={isLoading}
                                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 xs:px-6 py-2 xs:py-2.5 rounded-lg font-medium transition-all duration-300 hover:scale-105 text-sm xs:text-base"
                              >
                                <Sparkles className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4" />
                                Load More
                              </Button>
                            ) : (
                              <div className="flex flex-col items-center gap-3 xs:gap-4">
                                <div className="flex items-center gap-2 xs:gap-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-4 xs:px-6 py-2.5 xs:py-3 rounded-xl shadow-lg">
                                  <Loader2 className="h-4 w-4 xs:h-5 xs:w-5 animate-spin text-blue-500" />
                                  <span className="text-sm xs:text-base font-medium text-slate-700 dark:text-slate-300">
                                    Loading more images...
                                  </span>
                                </div>
                                <div className="w-32 xs:w-48 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Upload Tab Content */}
              <TabsContent
                value="upload"
                className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col"
              >
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="w-full max-w-2xl">
                    <div className="relative rounded-2xl border-2 border-dashed border-purple-300/50 dark:border-purple-500/30 bg-gradient-to-br from-purple-50/30 to-pink-50/20 dark:from-purple-950/20 dark:to-pink-950/10 p-12 text-center transition-all duration-300 hover:border-purple-400/70">
                      <div className="relative mb-6">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-xl mx-auto w-fit shadow-lg">
                          <FileImage className="h-8 w-8 text-white" />
                        </div>
                      </div>

                      <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                        AI-Enhanced Upload
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-6">
                        Upload and let AI optimize your image
                      </p>

                      <label
                        htmlFor="file-upload"
                        className="inline-flex items-center gap-2 cursor-pointer rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-medium text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 shadow-lg"
                      >
                        <Upload className="h-4 w-4" />
                        Choose File
                        <input
                          id="file-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleFileUpload}
                          ref={fileInputRef}
                          disabled={uploading}
                        />
                      </label>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                        PNG, JPG, GIF, WebP up to 10MB
                      </p>

                      {uploading && (
                        <div className="mt-6">
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                            Processing... {Math.round(uploadProgress)}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
