"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/custom-ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/custom-ui/card";
import { Badge } from "@/components/custom-ui/badge";
import Image from "next/image";
import { ArrowLeft, Trash2, Download, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/custom-ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/custom-ui/dialog";

interface TryOnSession {
  id: string;
  userId: string;
  productId: string;
  productName?: string;
  personImageUrl?: string;
  garmentImageUrl?: string;
  resultImageUrl?: string;
  status: "processing" | "completed" | "failed";
  errorMessage?: string;
  createdAt: string;
  updatedAt?: string;
  customerImageUrl?: string;
  tryOnImageUrl?: string;
  fitRecommendation?: string;
  isFavorite?: boolean;
  notes?: string;
  rating?: number;
}

export default function TryOnHistoryPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [sessions, setSessions] = useState<TryOnSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<TryOnSession | null>(
    null
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchSessions();
  }, [isAuthenticated, router]);

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/try-on/sessions", {
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("token") ||
            localStorage.getItem("authToken") ||
            localStorage.getItem("auth_token")
          }`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch try-on sessions");
      }

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast({
        title: "Error",
        description: "Failed to load try-on history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/try-on/sessions/${sessionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("token") ||
            localStorage.getItem("authToken") ||
            localStorage.getItem("auth_token")
          }`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete session");
      }

      setSessions(sessions.filter((s) => s.id !== sessionId));
      toast({
        title: "Success",
        description: "Try-on session deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({
        title: "Error",
        description: "Failed to delete try-on session",
        variant: "destructive",
      });
    }
  };

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "processing":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>
        );
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Try-On History</h1>
          <p className="text-gray-600 mt-1">
            View and manage your virtual try-on sessions
          </p>
        </div>
      </div>

      {/* Sessions Grid */}
      {sessions.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Eye className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No try-on sessions yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start creating virtual try-ons to see your history here.
          </p>
          <Button onClick={() => router.push("/")}>Explore Products</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold truncate">
                      {session.productName}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(session.createdAt)}
                    </p>
                  </div>
                  {getStatusBadge(session.status)}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Result Image */}
                  {session.resultImageUrl && (
                    <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden">
                      <Image
                        src={session.resultImageUrl}
                        alt="Try-on result"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  )}

                  {/* Product and Person Images */}
                  <div className="grid grid-cols-2 gap-2">
                    {session.garmentImageUrl && (
                      <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden">
                        <Image
                          src={session.garmentImageUrl}
                          alt="Product"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      </div>
                    )}
                    {session.customerImageUrl && (
                      <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden">
                        <Image
                          src={session.customerImageUrl}
                          alt="Your photo"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {session.resultImageUrl && (
                      <>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => setSelectedSession(session)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>
                                {session.productName} - Try-On Result
                              </DialogTitle>
                              <DialogDescription>
                                Created on {formatDate(session.createdAt)}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="relative aspect-[4/3] bg-gray-50 rounded-lg overflow-hidden">
                              <Image
                                src={session.tryOnImageUrl || session.resultImageUrl || ""}
                                alt="Try-on result"
                                fill
                                className="object-contain"
                              />
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            downloadImage(
                              session.tryOnImageUrl || session.resultImageUrl || "",
                              `${session.productName || "try-on"}-${session.id}.jpg`
                            )
                          }
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete Try-On Session
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this try-on session?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteSession(session.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
