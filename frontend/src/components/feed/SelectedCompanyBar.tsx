type Company = {
  id: string;
  name: string;
  location?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
};

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type Props = {
  company: Company;
  onClear: () => void;
};

export default function SelectedCompanyBar({ company, onClear }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const handleCompanyClick = () => {
    router.push(`/store/${company.id}`);
  };
  return (
    <div className="sticky top-[4.6rem] z-30 mb-4 backdrop-blur-md">
      <div
        className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 hover:border-gray-400 dark:hover:border-gray-500 hover:scale-[1.02] transition-all duration-500 cursor-pointer group bg-white/90 dark:bg-slate-900/90 hover:bg-gray-50/95 dark:hover:bg-gray-950/95"
        onClick={handleCompanyClick}
      >
        <div className="flex items-center gap-3">
          {/* Company Avatar with indicator */}
          <div className="relative flex-shrink-0">
            <div className="h-12 w-12 rounded-full overflow-hidden bg-white dark:bg-slate-800 border-2 border-gray-400 dark:border-gray-400 group-hover:border-gray-400 dark:group-hover:border-gray-400 transition-all duration-500">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-sm font-bold text-gray-900 dark:text-white">
                  {company.name.charAt(0)}
                </div>
              )}
            </div>
            {/* Active indicator dot */}
            <div className="absolute -top-1 -right-1 h-4 w-4 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-500 bg-gold-500 group-hover:bg-gold-500">
              <div className="h-1.5 w-1.5 bg-white rounded-full animate-pulse group-hover:animate-bounce"></div>
            </div>
          </div>

          {/* Company Info - Clickable */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-gray-900 dark:group-hover:text-gray-500 transition-all duration-500">
                {company.name}
              </h2>
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800/50 text-xs font-medium text-gray-900 dark:text-gray-300 rounded-full group-hover:text-gray-900 dark:group-hover:text-gray-500 transition-all duration-500 group-hover:bg-gold-100 dark:group-hover:bg-gray-900/60">
                Selected
              </span>
            </div>
            {company.location && (
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate flex items-center gap-1 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-500">
                <span className="h-1 w-1 bg-gray-400 rounded-full group-hover:bg-gold-400 transition-colors duration-500"></span>
                {company.location}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {company.websiteUrl && (
              <Link
                href={"#"}
                className="text-gray-900 dark:text-white hover:text-black dark:hover:text-gray-500 font-medium text-sm transition-colors duration-200"
              >
                View Store
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
