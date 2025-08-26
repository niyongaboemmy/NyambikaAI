type Company = {
  id: string;
  name: string;
  location?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
};

import { Link, useLocation } from "wouter";

type Props = {
  company: Company;
  onClear: () => void;
};

export default function SelectedCompanyBar({ company, onClear }: Props) {
  const [, setLocation] = useLocation();

  const handleCompanyClick = () => {
    setLocation(`/store/${company.id}`);
  };
  return (
    <div className="sticky top-[4.6rem] z-30 mb-4 backdrop-blur-md">
      <div
        className="bg-gradient-to-r from-white/90 to-blue-50/90 dark:from-slate-900/90 dark:to-blue-950/90 border border-blue-200 dark:border-blue-800 rounded-xl p-3 shadow-lg hover:shadow-2xl hover:shadow-blue-500/20 hover:from-blue-50/95 hover:to-purple-50/95 dark:hover:from-blue-950/95 dark:hover:to-purple-950/95 hover:border-blue-400 dark:hover:border-blue-600 hover:scale-[1.02] transition-all duration-500 cursor-pointer group"
        onClick={handleCompanyClick}
      >
        <div className="flex items-center gap-3">
          {/* Company Avatar with indicator */}
          <div className="relative flex-shrink-0">
            <div className="h-12 w-12 rounded-full overflow-hidden bg-white dark:bg-slate-800 border-2 border-blue-500 dark:border-blue-400 group-hover:border-purple-500 dark:group-hover:border-purple-400 group-hover:shadow-lg group-hover:shadow-purple-500/30 transition-all duration-500">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400">
                  {company.name.charAt(0)}
                </div>
              )}
            </div>
            {/* Active indicator dot */}
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center group-hover:from-purple-500 group-hover:to-pink-500 group-hover:scale-110 transition-all duration-500">
              <div className="h-1.5 w-1.5 bg-white rounded-full animate-pulse group-hover:animate-bounce"></div>
            </div>
          </div>

          {/* Company Info - Clickable */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-blue-600 dark:text-blue-400 truncate group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-all duration-500">
                {company.name}
              </h2>
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-xs font-medium text-blue-700 dark:text-blue-300 rounded-full group-hover:bg-gradient-to-r group-hover:from-purple-100 group-hover:to-blue-100 dark:group-hover:from-purple-900/60 dark:group-hover:to-blue-800/60 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-all duration-500">
                Selected
              </span>
            </div>
            {company.location && (
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate flex items-center gap-1 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-500">
                <span className="h-1 w-1 bg-gray-400 rounded-full group-hover:bg-purple-400 transition-colors duration-500"></span>
                {company.location}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {company.websiteUrl && (
              <Link
                to={`/store/${company.id}`}
                className="text-xs text-blue-500 hover:text-blue-600 font-medium hidden sm:inline px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
              >
                Visit
              </Link>
            )}
            <button
              onClick={onClear}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Clear selection"
            >
              {/* simple x icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M6.225 4.811a.75.75 0 011.06 0L12 9.525l4.716-4.714a.75.75 0 111.06 1.06L13.06 10.586l4.716 4.716a.75.75 0 11-1.06 1.06L12 11.646l-4.716 4.716a.75.75 0 11-1.06-1.06l4.714-4.716-4.714-4.714a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
