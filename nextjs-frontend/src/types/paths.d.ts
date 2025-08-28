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
    user: any;
    isAuthenticated: boolean;
    isLoading: boolean;
  };
}

declare module "@/components/ui/button" {
  import { ButtonHTMLAttributes, FC } from "react";

  interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?:
      | "default"
      | "outline"
      | "ghost"
      | "link"
      | "destructive"
      | "secondary";
    size?: "default" | "sm" | "lg" | "icon";
    asChild?: boolean;
  }

  const Button: FC<ButtonProps>;
  export { Button };
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

declare module "@/components/ui/tabs" {
  import { HTMLAttributes, FC, ReactNode } from "react";

  interface TabsProps extends HTMLAttributes<HTMLDivElement> {
    defaultValue: string;
    onValueChange?: (value: string) => void;
  }

  interface TabsListProps extends HTMLAttributes<HTMLDivElement> {}

  interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
    value: string;
  }

  interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
    value: string;
  }

  const Tabs: FC<TabsProps> & {
    List: FC<TabsListProps>;
    Trigger: FC<TabsTriggerProps>;
    Content: FC<TabsContentProps>;
  };

  export { Tabs };
}
