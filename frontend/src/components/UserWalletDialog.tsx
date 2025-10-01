"use client";

import React, { useState, useEffect } from "react";
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

// Custom CSS for mobile full-screen override
const mobileFullScreenStyle = `
  .mobile-wallet-fullscreen {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    max-width: none !important;
    max-height: none !important;
    margin: 0 !important;
    padding: 0 !important;
    transform: none !important;
    border-radius: 0 !important;
    border: none !important;
  }
  
  .mobile-wallet-fullscreen > div {
    max-height: none !important;
    height: 100% !important;
  }
`;

export default function UserWalletDialog() {
  const { isOpen, close } = useUserWalletDialog();
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      {/* Inject custom CSS for mobile full-screen */}
      {isMobile && (
        <style dangerouslySetInnerHTML={{ __html: mobileFullScreenStyle }} />
      )}
      
      <Dialog open={isOpen} onOpenChange={(open) => (!open ? close() : null)}>
        <DialogContent
          className={`${
            isMobile
              ? "mobile-wallet-fullscreen bg-white dark:bg-gray-900 z-[100] overflow-hidden"
              : "max-w-4xl p-0 gap-0 border-0 bg-transparent shadow-none rounded-3xl overflow-hidden"
          } transition-all duration-300`}
          hideClose
          title="Wallet"
        >
        <VisuallyHidden.Root>
          <DialogTitle>User Wallet</DialogTitle>
        </VisuallyHidden.Root>
        
        {/* Mobile Header Bar */}
        {isMobile && (
          <div className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
                <div>
                  <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    My Wallet
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Digital currency hub
                  </p>
                </div>
              </div>
              <button
                onClick={close}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 active:scale-95"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            
            {/* Pull indicator */}
            <div className="flex justify-center mt-2">
              <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
          </div>
        )}
        
        {/* Desktop close button */}
        {!isMobile && (
          <DialogClose
            onClick={close}
            className="fixed top-4 right-4 z-50 rounded-full p-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-900 transition-all duration-200 hover:scale-110 shadow-lg"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="sr-only">Close</span>
          </DialogClose>
        )}

        {/* Wallet content container */}
        <div className={`${
          isMobile
            ? "flex-1 overflow-y-auto overscroll-contain h-full w-full"
            : ""
        }`} style={isMobile ? { height: '100%', width: '100%' } : undefined}>
          <UserWallet isMobile={isMobile} />
        </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
