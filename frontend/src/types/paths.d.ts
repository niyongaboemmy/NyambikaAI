import { UserInterface } from "@/config/api";

declare module "@/lib/api-client" {
  import { AxiosInstance } from "axios";
  const apiClient: AxiosInstance;
  export default apiClient;
}

declare module "@/lib/utils" {
  export function cn(...inputs: any[]): string;
  export function handleApiError(error: unknown): string;
}

declare module "@/contexts/AuthContext" {
  export const useAuth: () => {
    user: UserInterface;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    loginWithProvider: (provider: "google" | "facebook") => void;
    requestPasswordReset: (email: string) => Promise<void>;
  };
}

declare module "@/components/ui/card" {
  import { HTMLAttributes, FC } from "react";

  interface CardProps extends HTMLAttributes<HTMLDivElement> {}
  interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}
  interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}
  interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

  const Card: FC<CardProps>;
  const CardHeader: FC<CardHeaderProps>;
  const CardTitle: FC<CardTitleProps>;
  const CardContent: FC<CardContentProps>;

  export { Card, CardHeader, CardTitle, CardContent };
}

declare module "@/components/ui/badge" {
  import { HTMLAttributes, FC } from "react";

  interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "outline" | "destructive";
  }

  const Badge: FC<BadgeProps>;
  export { Badge };
}
