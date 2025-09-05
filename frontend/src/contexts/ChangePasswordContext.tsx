"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ChangePasswordContextType {
  isOpen: boolean;
  openChangePassword: () => void;
  closeChangePassword: () => void;
}

const ChangePasswordContext = createContext<ChangePasswordContextType | undefined>(undefined);

export function ChangePasswordProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openChangePassword = () => setIsOpen(true);
  const closeChangePassword = () => setIsOpen(false);

  return (
    <ChangePasswordContext.Provider
      value={{
        isOpen,
        openChangePassword,
        closeChangePassword,
      }}
    >
      {children}
    </ChangePasswordContext.Provider>
  );
}

export function useChangePassword() {
  const context = useContext(ChangePasswordContext);
  if (context === undefined) {
    throw new Error("useChangePassword must be used within a ChangePasswordProvider");
  }
  return context;
}
