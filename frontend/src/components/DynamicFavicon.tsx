"use client";

import { useTheme } from "@/components/theme-provider";
import { useEffect } from "react";

export function DynamicFavicon() {
  const { actualTheme } = useTheme();

  useEffect(() => {
    // Create canvas to add border to favicon
    const createBorderedFavicon = (iconPath: string) => {
      return new Promise<string>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          // Set canvas size (64x64 for larger, higher quality favicon)
          canvas.width = 64;
          canvas.height = 64;

          if (ctx) {
            // Clear canvas
            ctx.clearRect(0, 0, 64, 64);

            // Create circular clipping path for the entire favicon
            ctx.beginPath();
            ctx.arc(32, 32, 32, 0, 2 * Math.PI);
            ctx.clip();

            // Draw the original icon (scaled to fit within the circular area)
            ctx.drawImage(img, 0, 0, 64, 64);
          }

          // Convert canvas to data URL
          resolve(canvas.toDataURL("image/png"));
        };
        img.src = iconPath;
      });
    };

    // Remove existing favicon
    const existingFavicon = document.querySelector('link[rel="icon"]');
    if (existingFavicon) {
      existingFavicon.remove();
    }

    // Create bordered favicon
    const iconPath =
      actualTheme === "dark"
        ? "/nyambika_dark_icon.png"
        : "/nyambika_dark_icon.png";

    createBorderedFavicon(iconPath).then((borderedIconUrl) => {
      const favicon = document.createElement("link");
      favicon.rel = "icon";
      favicon.type = "image/png";
      favicon.href = borderedIconUrl;
      document.head.appendChild(favicon);
    });

    // Also update apple-touch-icon for mobile
    const existingAppleIcon = document.querySelector(
      'link[rel="apple-touch-icon"]'
    );
    if (existingAppleIcon) {
      existingAppleIcon.remove();
    }

    createBorderedFavicon(iconPath).then((borderedIconUrl) => {
      const appleIcon = document.createElement("link");
      appleIcon.rel = "apple-touch-icon";
      appleIcon.href = borderedIconUrl;
      document.head.appendChild(appleIcon);
    });

    // Cleanup function
    return () => {
      const currentFavicon = document.querySelector('link[rel="icon"]');
      const currentAppleIcon = document.querySelector(
        'link[rel="apple-touch-icon"]'
      );
      if (currentFavicon) currentFavicon.remove();
      if (currentAppleIcon) currentAppleIcon.remove();
    };
  }, [actualTheme]);

  return null; // This component doesn't render anything
}
