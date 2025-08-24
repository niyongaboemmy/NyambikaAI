import { useState, useEffect } from "react";
import {
  User,
  Settings,
  Heart,
  ShoppingBag,
  Star,
  Edit3,
  Camera,
  Loader2,
} from "lucide-react";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { open } = useLoginPrompt();
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: "",
    fullNameRw: "",
    email: "",
    phone: "",
    location: "",
  });

  // Prompt login if not authenticated (avoid side effects during render)
  useEffect(() => {
    if (!isAuthenticated) {
      open();
    }
  }, [isAuthenticated, open]);

  if (!isAuthenticated) {
    return null;
  }

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setUserInfo({
        name: user.name || "",
        fullNameRw: "",
        email: user.email || "",
        phone: user.phone || "",
        location: "",
      });
    }
  }, [user]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: typeof userInfo) => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: profileData.name,
          fullNameRw: profileData.fullNameRw,
          phone: profileData.phone,
          location: profileData.location,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }

      return response.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Profile updated successfully!",
        description: "Your profile information has been saved.",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const favoriteItems = [
    {
      id: "1",
      name: "Summer Dress",
      price: "45,000 RWF",
      image:
        "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=400",
    },
    {
      id: "2",
      name: "Leather Handbag",
      price: "65,000 RWF",
      image:
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=400",
    },
  ];

  const recentOrders = [
    {
      id: "ORD-001",
      date: "2024-08-15",
      status: "Delivered",
      total: "120,000 RWF",
      items: 2,
    },
    {
      id: "ORD-002",
      date: "2024-08-10",
      status: "Processing",
      total: "85,000 RWF",
      items: 1,
    },
  ];

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(userInfo);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
      <main className="pt-24 pb-12 px-4 md:px-6">
        <div className=" ">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-4">
              Profil Wanjye / My Profile
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Manage your account and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Info */}
            <div className="lg:col-span-2 space-y-8">
              <Card className="floating-card p-8">
                <CardHeader className="p-0 mb-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl gradient-text">
                      Personal Information
                    </CardTitle>
                    <Button
                      onClick={() =>
                        isEditing ? handleSaveProfile() : setIsEditing(true)
                      }
                      className={
                        isEditing ? "gradient-bg text-white" : "glassmorphism"
                      }
                    >
                      <Edit3 className="mr-2 h-4 w-4" />
                      {isEditing ? "Save" : "Edit"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex items-center space-x-6 mb-8">
                    <div className="relative">
                      <div className="w-24 h-24 gradient-bg rounded-full flex items-center justify-center text-white text-3xl font-bold">
                        {userInfo.name.charAt(0)}
                      </div>
                      {isEditing && (
                        <Button
                          size="icon"
                          className="absolute -bottom-2 -right-2 rounded-full gradient-bg text-white"
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                        {userInfo.name}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        {userInfo.fullNameRw}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={userInfo.name}
                        onChange={(e) =>
                          setUserInfo({ ...userInfo, name: e.target.value })
                        }
                        disabled={!isEditing}
                        className="glassmorphism border-0 bg-transparent mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="name_rw">Izina mu Kinyarwanda</Label>
                      <Input
                        id="name_rw"
                        value={userInfo.fullNameRw}
                        onChange={(e) =>
                          setUserInfo({
                            ...userInfo,
                            fullNameRw: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                        className="glassmorphism border-0 bg-transparent mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userInfo.email}
                        onChange={(e) =>
                          setUserInfo({ ...userInfo, email: e.target.value })
                        }
                        disabled={!isEditing}
                        className="glassmorphism border-0 bg-transparent mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={userInfo.phone}
                        onChange={(e) =>
                          setUserInfo({ ...userInfo, phone: e.target.value })
                        }
                        disabled={!isEditing}
                        className="glassmorphism border-0 bg-transparent mt-2"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={userInfo.location}
                        onChange={(e) =>
                          setUserInfo({ ...userInfo, location: e.target.value })
                        }
                        disabled={!isEditing}
                        className="glassmorphism border-0 bg-transparent mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              <Card className="floating-card p-8">
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="text-2xl gradient-text">
                    Ibigura Byaje / Recent Orders
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="glassmorphism rounded-xl p-4 hover:scale-105 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">
                              {order.id}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {order.date} • {order.items} items
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[rgb(var(--electric-blue-rgb))]">
                              {order.total}
                            </p>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                order.status === "Delivered"
                                  ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="floating-card p-4 text-center">
                  <Heart className="h-8 w-8 text-[rgb(var(--coral-rgb))] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    {favoriteItems.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Favorites
                  </p>
                </Card>
                <Card className="floating-card p-4 text-center">
                  <ShoppingBag className="h-8 w-8 text-[rgb(var(--electric-blue-rgb))] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    {recentOrders.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Orders
                  </p>
                </Card>
              </div>

              {/* Favorite Items */}
              <Card className="floating-card p-6">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-xl gradient-text">
                    Favorite Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-4">
                    {favoriteItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-3"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-xl"
                        />
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">
                            {item.name}
                          </p>
                          <p className="text-sm text-[rgb(var(--electric-blue-rgb))]">
                            {item.price}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="floating-card p-6">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-xl gradient-text">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-3">
                    <Button className="w-full glassmorphism justify-start">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                    <Button className="w-full glassmorphism justify-start">
                      <Star className="mr-2 h-4 w-4" />
                      Reviews
                    </Button>
                    <Button className="w-full glassmorphism justify-start">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Order History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
