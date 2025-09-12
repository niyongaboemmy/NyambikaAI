"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/custom-ui/dialog";
import { Input } from "@/components/custom-ui/input";
import { Button } from "@/components/custom-ui/button";
import { Search, Image as ImageIcon, Loader2, X } from "lucide-react";
import { searchImages, getPopularImages, PexelsPhoto } from "@/services/pexels";

interface PexelsImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  aspectRatio?: "square" | "portrait" | "landscape";
  searchValue: string;
}

export function PexelsImageModal({
  isOpen,
  onClose,
  onSelect,
  aspectRatio = "square",
  searchValue,
}: PexelsImageModalProps) {
  const [searchQuery, setSearchQuery] = useState(searchValue);
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<PexelsPhoto[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

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

  // Initialize searchQuery with searchValue when component mounts
  useEffect(() => {
    if (searchValue) {
      setSearchQuery(searchValue);
    }
  }, [searchValue]);

  // Load images when modal opens or searchQuery changes
  useEffect(() => {
    if (isOpen) {
      loadImages(searchQuery, 1, true);
    }
  }, [isOpen, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadImages(searchQuery, 1, true);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadImages(searchQuery, nextPage, false);
  };

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const target = e.target as HTMLImageElement;
    target.style.display = "none";
  };

  const getImageClass = () => {
    switch (aspectRatio) {
      case "portrait":
        return "object-cover w-full h-64";
      case "landscape":
        return "object-cover w-full h-48";
      default: // square
        return "object-cover w-full h-48";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="h-screen max-h-screen w-screen max-w-none rounded-none p-0 sm:rounded-none">
        <div className="flex h-full flex-col">
          {/* Header */}
          <DialogHeader className="sticky top-0 z-50 border-b bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/95">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">
                  Search Pexels Images
                </DialogTitle>
                <DialogDescription>
                  Search for images on Pexels to use for your category
                </DialogDescription>
              </div>
              <button
                onClick={onClose}
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </button>
            </div>
          </DialogHeader>

          <div className="pb-2 px-2 md:px-4">
            {/* <DialogHeader>
            <DialogTitle>Search Pexels Images</DialogTitle>
            <DialogDescription>
              Search for images on Pexels to use for your category
            </DialogDescription>
          </DialogHeader> */}

            <div className="mt-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search images..."
                    className="pl-8 h-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-9 dark:text-white dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Search
                </Button>
              </form>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto">
            {isLoading && images.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : images.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No images found</h3>
                <p className="text-sm text-muted-foreground">
                  Try a different search term or check back later.
                </p>
              </div>
            ) : (
              <>
                <div className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {images.map((image) => (
                      <div
                        key={image.id}
                        className={`relative rounded-md overflow-hidden border-2 transition-all cursor-pointer hover:shadow-lg ${
                          selectedImage === image.src.original
                            ? "ring-2 ring-primary ring-offset-2"
                            : ""
                        }`}
                        onClick={() => setSelectedImage(image.src.original)}
                      >
                        <img
                          src={image.src.medium}
                          alt={image.alt || "Category image"}
                          className={getImageClass()}
                          loading="lazy"
                        />
                        {selectedImage === image.src.original && (
                          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                            <div className="bg-primary text-primary-foreground p-2 rounded-full">
                              <div className="h-4 w-4 flex items-center justify-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="h-4 w-4"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 011.04-.207z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {hasMore && !isLoading && (
                    <div className="flex justify-center mt-6 mb-4">
                      <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={isLoading}
                        className="min-w-[120px]"
                      >
                        {isLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Load More
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 z-50 flex items-center justify-between border-t bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/95">
            <div className="text-sm text-muted-foreground">
              {selectedImage ? "Selected" : "No image selected"}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedImage) {
                    onSelect(selectedImage);
                    onClose();
                  }
                }}
                disabled={!selectedImage}
                className="min-w-[120px]"
              >
                Select Image
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
