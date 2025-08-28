import * as React from "react";
import Select, { SingleValue, StylesConfig } from "react-select";
import { cn } from "@/lib/utils";

export interface OptionType {
  value: string;
  label: string;
}

export interface FormReactSelectProps {
  id?: string;
  label?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  options: OptionType[];
  placeholder?: string;
  className?: string;
}

// Detect dark mode based on the presence of the `dark` class on <html>
const useIsDark = () => {
  const [isDark, setIsDark] = React.useState<boolean>(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  );

  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
};

export const FormReactSelect = React.forwardRef<HTMLDivElement, FormReactSelectProps>(
  ({ id, label, error, value, onChange, options, placeholder, className }, ref) => {
    const isDark = useIsDark();

    const selected = React.useMemo(() => options.find(o => o.value === value) ?? null, [options, value]);

    const styles: StylesConfig<OptionType, false> = {
      control: (base, state) => ({
        ...base,
        minHeight: 40,
        background: "transparent",
        borderRadius: 8,
        borderColor: error ? (isDark ? "#f87171" : "#ef4444") : (isDark ? "#374151" : "#e5e7eb"),
        boxShadow: state.isFocused
          ? `0 0 0 2px ${isDark ? "rgba(96,165,250,0.2)" : "rgba(59,130,246,0.2)"}`
          : "none",
        color: isDark ? "#e5e7eb" : "#111827",
        ':hover': {
          borderColor: error ? (isDark ? "#fca5a5" : "#f87171") : (isDark ? "#4b5563" : "#d1d5db"),
        },
      }),
      menu: (base) => ({
        ...base,
        background: isDark ? "#111827" : "#ffffff",
        border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
        boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.08)",
        zIndex: 50,
      }),
      option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
          ? (isDark ? "#1f2937" : "#eff6ff")
          : state.isFocused
            ? (isDark ? "#111827" : "#f3f4f6")
            : "transparent",
        color: isDark ? "#e5e7eb" : "#111827",
        cursor: "pointer",
      }),
      singleValue: (base) => ({
        ...base,
        color: isDark ? "#e5e7eb" : "#111827",
      }),
      placeholder: (base) => ({
        ...base,
        color: isDark ? "#6b7280" : "#9ca3af",
      }),
      input: (base) => ({
        ...base,
        color: isDark ? "#e5e7eb" : "#111827",
      }),
      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
      indicatorSeparator: (base) => ({ ...base, display: 'none' }),
    };

    return (
      <div className={cn("space-y-2", className)} ref={ref}>
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <Select
          inputId={id}
          options={options}
          value={selected}
          onChange={(opt: SingleValue<OptionType>) => onChange(opt?.value ?? "")}
          placeholder={placeholder}
          classNamePrefix="rs"
          styles={styles}
          menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
          isClearable
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }
);

FormReactSelect.displayName = "FormReactSelect";

export default FormReactSelect;
