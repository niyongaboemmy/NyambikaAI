import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  error?: string;
  label?: string;
}

const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className, icon: Icon, iconPosition = "left", error, label, id, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && iconPosition === "left" && (
            <div className="absolute left-3 top-3 text-gray-400 pointer-events-none">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <textarea
            className={cn(
              "flex min-h-[80px] w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical transition-colors duration-200",
              Icon && iconPosition === "left" && "pl-10",
              Icon && iconPosition === "right" && "pr-10",
              error && "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500/20 dark:focus:ring-red-400/20",
              className
            )}
            ref={ref}
            id={id}
            {...props}
          />
          {Icon && iconPosition === "right" && (
            <div className="absolute right-3 top-3 text-gray-400 pointer-events-none">
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);
FormTextarea.displayName = "FormTextarea";

export { FormTextarea };
