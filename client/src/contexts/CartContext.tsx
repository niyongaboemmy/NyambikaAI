import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type CartItem = {
  id: string;
  name: string;
  nameRw?: string;
  description?: string;
  price: number; // in RWF
  image?: string;
  size?: string;
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
};

const CartContext = createContext<CartState | undefined>(undefined);

const STORAGE_KEY = "cart";

function readFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("cartItems");
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

  useEffect(() => {
    writeToStorage(items);
  }, [items]);

  // Helper: auth headers
  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
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
      price: typeof ci.product.price === "number" ? ci.product.price : parseFloat(ci.product.price),
      image: ci.product.imageUrl,
      size: ci.size || undefined,
      quantity: ci.quantity || 1,
      serverId: ci.id,
    }));
  };

  // Refresh items from server if authenticated
  const refreshFromServer = async () => {
    try {
      if (!isAuthenticated) return;
      const res = await fetch("/api/cart", { headers: getAuthHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setItems(mapServerToLocal(data));
    } catch {}
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
    setItems((prev) => {
      const idx = prev.findIndex(
        (it) => it.id === item.id && (it.size || "") === (item.size || "")
      );
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + qty };
        return copy;
      }
      return [...prev, { ...item, quantity: qty }];
    });

    // Mirror to server when authenticated, then refresh
    (async () => {
      try {
        if (!isAuthenticated) return;
        await fetch("/api/cart", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            productId: item.id,
            quantity: qty,
            size: item.size,
          }),
        });
        await refreshFromServer();
      } catch {}
    })();
  };

  const removeItem: CartState["removeItem"] = (id, size) => {
    setItems((prev) => prev.filter((it) => !(it.id === id && (it.size || "") === (size || ""))));

    // Mirror to server if possible (requires serverId)
    (async () => {
      try {
        if (!isAuthenticated) return;
        const target = items.find((it) => it.id === id && (it.size || "") === (size || ""));
        const serverId = target?.serverId;
        if (serverId) {
          await fetch(`/api/cart/${serverId}`, { method: "DELETE", headers: getAuthHeaders() });
        }
        await refreshFromServer();
      } catch {}
    })();
  };

  const updateQuantity: CartState["updateQuantity"] = (id, quantity, size) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((it) => !(it.id === id && (it.size || "") === (size || "")));
      return prev.map((it) =>
        it.id === id && (it.size || "") === (size || "") ? { ...it, quantity } : it
      );
    });

    // Mirror to server via PUT when we know serverId; otherwise refresh
    (async () => {
      try {
        if (!isAuthenticated) return;
        const target = items.find((it) => it.id === id && (it.size || "") === (size || ""));
        const serverId = target?.serverId;
        if (serverId) {
          await fetch(`/api/cart/${serverId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({ quantity }),
          });
        } else {
          // Fallback: POST the delta by setting absolute quantity not supported; trigger refresh
        }
        await refreshFromServer();
      } catch {}
    })();
  };

  const clear = () => setItems([]);

  // Mirror clear to server
  useEffect(() => {
    // When items become empty and user is authenticated, attempt server clear once
    if (isAuthenticated && items.length === 0) {
      (async () => {
        try {
          await fetch("/api/cart", { method: "DELETE", headers: getAuthHeaders() });
        } catch {}
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
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
