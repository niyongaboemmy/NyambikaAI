"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/custom-ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { useUserWalletDialog } from "@/contexts/UserWalletDialogContext";
import { X } from "lucide-react";
import UserWallet from "@/components/UserWallet";

export default function UserWalletDialog() {
  const { isOpen, close } = useUserWalletDialog();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? close() : null)}>
      <DialogContent
        className="max-w-4xl p-0 gap-0 border-0 bg-transparent shadow-none rounded-3xl overflow-hidden"
        hideClose
        title="Wallet"
      >
        <VisuallyHidden.Root>
          <DialogTitle>User Wallet</DialogTitle>
        </VisuallyHidden.Root>
        
        {/* Fixed close button */}
        <DialogClose
          onClick={close}
          className="fixed top-4 right-4 z-50 rounded-full p-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-900 transition-all duration-200 hover:scale-110 shadow-lg"
        >
          <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <span className="sr-only">Close</span>
        </DialogClose>

        {/* Wallet content with no additional padding */}
        <UserWallet />
      </DialogContent>
    </Dialog>
  );
}
