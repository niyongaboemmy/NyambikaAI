"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

interface UserWalletDialogContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const Ctx = createContext<UserWalletDialogContextValue | undefined>(undefined);

export function UserWalletDialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const value = useMemo(() => ({ isOpen, open, close, toggle }), [isOpen, open, close, toggle]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUserWalletDialog() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUserWalletDialog must be used within UserWalletDialogProvider");
  return ctx;
}
