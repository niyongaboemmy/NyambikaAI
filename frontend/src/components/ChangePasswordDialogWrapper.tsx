"use client";

import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { useChangePassword } from "@/contexts/ChangePasswordContext";

export function ChangePasswordDialogWrapper() {
  const { isOpen, closeChangePassword } = useChangePassword();

  return (
    <ChangePasswordDialog 
      isOpen={isOpen} 
      onClose={closeChangePassword} 
    />
  );
}
