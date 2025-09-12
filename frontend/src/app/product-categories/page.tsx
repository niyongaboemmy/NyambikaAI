"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit3,
  Trash2,
  ArrowLeft,
  Image as ImageIcon,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/custom-ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/custom-ui/card";
import { FormInput } from "@/components/custom-ui/form-input";
import { FormTextarea } from "@/components/custom-ui/form-textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/custom-ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { useRouter } from "next/navigation";
import { apiClient, handleApiError, API_ENDPOINTS } from "@/config/api";
import { PexelsImageModal } from "@/components/PexelsImageModal";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  nameRw: string;
  description?: string | null;
  imageUrl?: string | null;
  createdAt: string;
}

export default function AdminCategories() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { open } = useLoginPrompt();

  // Form state - move all hooks before conditional returns
  const [editing, setEditing] = useState<null | Category>(null);
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    nameRw: "",
    description: "",
    imageUrl: "",
  });
  const [isPexelsModalOpen, setIsPexelsModalOpen] = useState(false);

  // List categories
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: [API_ENDPOINTS.CATEGORIES],
    queryFn: async () => {
      try {
        const response = await apiClient.get(API_ENDPOINTS.CATEGORIES);
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
    enabled: isAuthenticated && user?.role === "admin", // Only run query if user is admin
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await apiClient.post(API_ENDPOINTS.CATEGORIES, form);
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
    onSuccess: () => {
      toast({ title: "Category created" });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.CATEGORIES] });
      setOpenForm(false);
      resetForm();
    },
    onError: (e: any) =>
      toast({
        title: "Create failed",
        description: e.message,
        variant: "destructive",
      }),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await apiClient.put(
          API_ENDPOINTS.CATEGORY_BY_ID(editing!.id),
          form
        );
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
    onSuccess: () => {
      toast({ title: "Category updated" });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.CATEGORIES] });
      setOpenForm(false);
      resetForm();
    },
    onError: (e: any) =>
      toast({
        title: "Update failed",
        description: e.message,
        variant: "destructive",
      }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await apiClient.delete(API_ENDPOINTS.CATEGORY_BY_ID(id));
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
    onSuccess: () => {
      toast({ title: "Category deleted" });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.CATEGORIES] });
    },
    onError: (e: any) =>
      toast({
        title: "Delete failed",
        description: e.message,
        variant: "destructive",
      }),
  });

  // Protect admin route: open login modal if not authenticated, redirect home if not admin
  useEffect(() => {
    if (!isAuthenticated) {
      open();
    } else if (user?.role !== "admin") {
      router.push("/");
    }
  }, [isAuthenticated, user, open, router]);

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  const resetForm = () => {
    setForm({ name: "", nameRw: "", description: "", imageUrl: "" });
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setOpenForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name || "",
      nameRw: cat.nameRw || "",
      description: cat.description || "",
      imageUrl: cat.imageUrl || "",
    });
    setOpenForm(true);
  };

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleImageSelect = (imageUrl: string) => {
    setForm((prev) => ({ ...prev, imageUrl }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.nameRw) {
      toast({
        title: "Missing required fields",
        description: "Name and Name (Kinyarwanda) are required",
        variant: "destructive",
      });
      return;
    }
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  };

  return (
    <div className="min-h-screen">
      <main className="pt-10 pb-12 px-2 md:px-0">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-xl md:text-2xl font-bold gradient-text">
                Categories
              </h1>
              <p className="text-muted-foreground text-sm">
                Manage product categories and translations
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/admin-dashboard")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Button onClick={openCreate} className="gradient-bg text-white">
                <Plus className="h-4 w-4 mr-2" /> New Category
              </Button>
            </div>
          </div>

          {/* List */}
          <Card className="floating-card">
            <CardHeader>
              <CardTitle>All Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-10 text-center text-muted-foreground">
                  Loading...
                </div>
              ) : categories.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  No categories yet
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="glassmorphism rounded-xl p-4 flex gap-3"
                    >
                      <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                        {cat.imageUrl ? (
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{cat.name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {cat.nameRw}
                        </div>
                        {cat.description && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {cat.description}
                          </div>
                        )}
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(cat)}
                          >
                            <Edit3 className="h-4 w-4 mr-1" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteMutation.mutate(cat.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Form Dialog */}
          <Dialog
            open={openForm}
            onOpenChange={(open) => {
              if (!open) {
                setOpenForm(false);
                resetForm();
              }
            }}
          >
            <DialogContent
              title={editing ? "Edit Category" : "New Category"}
              className="sm:max-w-[525px]"
            >
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">
                  {editing ? "Edit Category" : "New Category"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-4 pt-3 px-1">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormInput
                    id="name"
                    name="name"
                    label="Name (English)"
                    value={form.name}
                    onChange={onChange}
                    className="glassmorphism border-0 bg-gray-100 dark:bg-gray-800"
                    required
                  />
                  <FormInput
                    id="nameRw"
                    name="nameRw"
                    label="Name (Kinyarwanda)"
                    value={form.nameRw}
                    onChange={onChange}
                    className="glassmorphism border-0 bg-gray-100 dark:bg-gray-800"
                    required
                  />
                </div>
                <FormTextarea
                  id="description"
                  name="description"
                  label="Description"
                  value={form.description}
                  onChange={onChange}
                  rows={3}
                  className="glassmorphism border-0 bg-gray-100 dark:bg-gray-800"
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Image
                  </label>
                  <div className="flex gap-2">
                    <FormInput
                      name="imageUrl"
                      value={form.imageUrl}
                      onChange={onChange}
                      placeholder="Image URL or search Pexels"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsPexelsModalOpen(true)}
                      title="Search Pexels for images"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  {form.imageUrl && (
                    <div className="mt-2 relative rounded-md overflow-hidden border">
                      <img
                        src={form.imageUrl}
                        alt="Preview"
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, imageUrl: "" }))
                        }
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        title="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpenForm(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="gradient-bg text-white"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                  >
                    {editing ? "Save Changes" : "Create Category"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <PexelsImageModal
            isOpen={isPexelsModalOpen}
            onClose={() => setIsPexelsModalOpen(false)}
            onSelect={handleImageSelect}
            aspectRatio="portrait"
            searchValue={form.name || ""}
          />
        </div>
      </main>
    </div>
  );
}
