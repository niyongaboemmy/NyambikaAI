import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { apiClient, handleApiError } from "@/config/api";

export type CartItem = {
  id: string;
  name: string;
  nameRw?: string;
  description?: string;
  price: number; // in RWF
  image?: string;
  size?: string;
  color?: string;
  quantity: number;
  serverId?: string; // id of server cart item, if synced
};

export type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (id: string, size?: string) => void;
  updateQuantity: (id: string, quantity: number, size?: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  isSyncing: boolean;
  isDeleting: (id: string, size?: string) => boolean;
};

const CartContext = createContext<CartState | undefined>(undefined);

const STORAGE_KEY = "cart";

function readFromStorage(): CartItem[] {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) || localStorage.getItem("cartItems");
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
  } catch {}
  return [];
}

function writeToStorage(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
    window.dispatchEvent(new Event("cart:update"));
  } catch {}
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readFromStorage());
  const { isAuthenticated } = useAuth();
  // Track in-flight server sync operations to avoid flicker during bursts
  const [syncCounter, setSyncCounter] = useState(0);
  const isSyncing = syncCounter > 0;

  // Track per-item deletion state so UI can show a precise spinner on the item being removed
  const [pendingRemovals, setPendingRemovals] = useState<Set<string>>(new Set());
  const keyFor = (id: string, size?: string) => `${id}::${size || ""}`;

  const beginSync = () => setSyncCounter((c) => c + 1);
  const endSync = () => setSyncCounter((c) => Math.max(0, c - 1));

  useEffect(() => {
    writeToStorage(items);
  }, [items]);

  // Helper: auth headers
  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  // Map server cart payload to local CartItem[]
  const mapServerToLocal = (serverItems: any[]): CartItem[] => {
    return serverItems.map((ci: any) => ({
      id: ci.product.id,
      name: ci.product.name,
      nameRw: ci.product.nameRw,
      description: ci.product.description,
      price:
        typeof ci.product.price === "number"
          ? ci.product.price
          : parseFloat(ci.product.price),
      image: ci.product.imageUrl,
      size: ci.size || undefined,
      quantity: ci.quantity || 1,
      serverId: ci.id,
    }));
  };

  // Refresh items from server if authenticated
  const refreshFromServer = async (): Promise<CartItem[] | undefined> => {
    try {
      if (!isAuthenticated) return;
      beginSync();
      const response = await apiClient.get('/api/cart');
      const data = response.data;
      if (data?.items && Array.isArray(data.items)) {
        const mapped = mapServerToLocal(data.items);
        setItems(mapped);
        return mapped;
      } else if (data && Array.isArray(data)) {
        const mapped = mapServerToLocal(data);
        setItems(mapped);
        return mapped;
      } else {
        // Don't clear items if server returns empty - keep local state
        console.log('Server returned empty cart, keeping local state');
      }
    } catch (error: any) {
      // Handle 204 No Content or empty responses
      if (error.response?.status === 204) {
        console.log('Server cart is empty (204), keeping local state');
      } else {
        console.error('Failed to refresh cart from server:', error);
      }
      // Keep local state on any error
    } finally {
      endSync();
    }
  };

  // Hydrate on login/auth ready
  useEffect(() => {
    if (isAuthenticated) {
      // Replace local with server cart for the authenticated user
      refreshFromServer();
    }
    // Note: when logging out, we keep local cart as-is for guest usage
  }, [isAuthenticated]);

  // Basic shipping rule: flat 5000 RWF when there are items
  const shipping = items.length > 0 ? 5000 : 0;

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + it.price * it.quantity, 0),
    [items]
  );

  const count = useMemo(
    () => items.reduce((sum, it) => sum + it.quantity, 0),
    [items]
  );

  const total = subtotal + shipping;

  const addItem: CartState["addItem"] = (item, qty = 1) => {
    let updatedItems: CartItem[];
    setItems((prev) => {
      const idx = prev.findIndex(
        (it) => it.id === item.id && (it.size || "") === (item.size || "")
      );
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + qty };
        updatedItems = copy;
        return copy;
      }
      updatedItems = [...prev, { ...item, quantity: qty }];
      return updatedItems;
    });

    // Mirror to server when authenticated, but don't refresh immediately
    (async () => {
      try {
        if (!isAuthenticated) return;
        beginSync();
        const res = await apiClient.post('/api/cart', {
          productId: item.id,
          quantity: qty,
          size: item.size,
          color: item.color,
        });
        // Capture serverId from response if available to enable future sync operations
        const sid = res?.data?.id ?? res?.data?.item?.id ?? res?.data?.data?.id;
        if (sid) {
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id && (it.size || "") === (item.size || "")
                ? { ...it, serverId: String(sid) }
                : it
            )
          );
        }
        // Don't refresh immediately to avoid clearing the optimistic update
      } catch (error) {
        console.error('Failed to sync cart to server:', error);
        // On error, keep the optimistic update
      } finally {
        endSync();
      }
    })();
  };

  const removeItem: CartState["removeItem"] = (id, size) => {
    const k = keyFor(id, size);

    if (!isAuthenticated) {
      // Guest: keep optimistic removal behavior (no server) but still briefly mark as pending
      setPendingRemovals((prev) => new Set([...prev, k]));
      setItems((prev) =>
        prev.filter((it) => !(it.id === id && (it.size || "") === (size || "")))
      );
      // Clear pending immediately since there's no server roundtrip
      setPendingRemovals((prev) => {
        const copy = new Set(prev);
        copy.delete(k);
        return copy;
      });
      return;
    }

    // Authenticated: show item-level loading and perform server delete first
    setPendingRemovals((prev) => new Set([...prev, k]));

    (async () => {
      try {
        beginSync();
        // Find serverId without mutating items yet
        let serverId: string | undefined = items.find(
          (it) => it.id === id && (it.size || "") === (size || "")
        )?.serverId;

        if (serverId) {
          await apiClient.delete(`/api/cart/${serverId}`);
        } else {
          // Fallback: refresh to discover serverId then delete
          const refreshed = await refreshFromServer();
          const match = refreshed?.find(
            (it) => it.id === id && (it.size || "") === (size || "")
          );
          if (match?.serverId) {
            await apiClient.delete(`/api/cart/${match.serverId}`);
          }
        }

        // Now remove locally and refresh to reconcile
        setItems((prev) =>
          prev.filter((it) => !(it.id === id && (it.size || "") === (size || "")))
        );
        await refreshFromServer();
      } catch (error) {
        console.error('Failed to remove cart item:', error);
      } finally {
        endSync();
        setPendingRemovals((prev) => {
          const copy = new Set(prev);
          copy.delete(k);
          return copy;
        });
      }
    })();
  };

  const updateQuantity: CartState["updateQuantity"] = (id, quantity, size) => {
    let serverId: string | undefined;
    
    setItems((prev) => {
      const target = prev.find(
        (it) => it.id === id && (it.size || "") === (size || "")
      );
      serverId = target?.serverId;
      
      if (quantity <= 0) {
        return prev.filter(
          (it) => !(it.id === id && (it.size || "") === (size || ""))
        );
      }
      return prev.map((it) =>
        it.id === id && (it.size || "") === (size || "")
          ? { ...it, quantity }
          : it
      );
    });

    // Mirror to server via PUT when we know serverId; otherwise refresh
    (async () => {
      try {
        if (!isAuthenticated) return;
        beginSync();
        if (quantity <= 0) {
          // Handle deletion
          if (serverId) {
            await apiClient.delete(`/api/cart/${serverId}`);
          } else {
            // No serverId yet: attempt refresh to discover it
            const refreshed = await refreshFromServer();
            const match = refreshed?.find(
              (it) => it.id === id && (it.size || "") === (size || "")
            );
            if (match?.serverId) {
              await apiClient.delete(`/api/cart/${match.serverId}`);
            }
          }
        } else {
          // Handle quantity update
          if (serverId) {
            await apiClient.put(`/api/cart/${serverId}`, { quantity });
          } else {
            // Fallback: add new item to server and capture serverId
            const res = await apiClient.post('/api/cart', {
              productId: id,
              quantity,
              size,
            });
            const sid = res?.data?.id ?? res?.data?.item?.id ?? res?.data?.data?.id;
            if (sid) {
              setItems((prev) =>
                prev.map((it) =>
                  it.id === id && (it.size || "") === (size || "")
                    ? { ...it, serverId: String(sid) }
                    : it
                )
              );
            }
          }
        }
        // Only refresh for deletions, not quantity updates
        if (quantity <= 0) {
          await refreshFromServer();
        }
      } catch (error) {
        console.error('Failed to update cart quantity:', error);
      } finally {
        endSync();
      }
    })();
  };

  const clear = () => setItems([]);

  // Mirror clear to server
  useEffect(() => {
    // When items become empty and user is authenticated, attempt server clear once
    if (isAuthenticated && items.length === 0) {
      (async () => {
        try {
          beginSync();
          await apiClient.delete('/api/cart');
        } catch {
        } finally {
          endSync();
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, isAuthenticated]);

  const value: CartState = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clear,
    count,
    subtotal,
    shipping,
    total,
    isSyncing,
    isDeleting: (id: string, size?: string) => pendingRemovals.has(keyFor(id, size)),
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      {isSyncing && (
        <div className="fixed top-2 right-3 z-50 flex items-center gap-2 rounded-full border bg-background/90 backdrop-blur px-3 py-1 shadow">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Syncing cart…</span>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
