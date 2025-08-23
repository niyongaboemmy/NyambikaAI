type Company = {
  id: string;
  name: string;
  location?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
};

type Props = {
  company: Company;
  onClear: () => void;
};

export default function SelectedCompanyBar({ company, onClear }: Props) {
  return (
    <div className="sticky top-16 z-30 mb-4 backdrop-blur-md">
      <div className="bg-white/90 dark:bg-slate-900/90 border border-blue-200 dark:border-blue-800 rounded-xl p-3 shadow-lg">
        <div className="flex items-center gap-3">
          {/* Company Avatar with indicator */}
          <div className="relative flex-shrink-0">
            <div className="h-12 w-12 rounded-full overflow-hidden bg-white dark:bg-slate-800 border-2 border-blue-500 dark:border-blue-400">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400">
                  {company.name.charAt(0)}
                </div>
              )}
            </div>
            {/* Active indicator dot */}
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center">
              <div className="h-1.5 w-1.5 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Company Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-blue-600 dark:text-blue-400 truncate">{company.name}</h2>
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-xs font-medium text-blue-700 dark:text-blue-300 rounded-full">
                Selected
              </span>
            </div>
            {company.location && (
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate flex items-center gap-1">
                <span className="h-1 w-1 bg-gray-400 rounded-full"></span>
                {company.location}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {company.websiteUrl && (
              <a
                href={company.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:text-blue-600 font-medium hidden sm:inline px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
              >
                Visit
              </a>
            )}
            <button
              onClick={onClear}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Clear selection"
            >
              {/* simple x icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M6.225 4.811a.75.75 0 011.06 0L12 9.525l4.716-4.714a.75.75 0 111.06 1.06L13.06 10.586l4.716 4.716a.75.75 0 11-1.06 1.06L12 11.646l-4.716 4.716a.75.75 0 11-1.06-1.06l4.714-4.716-4.714-4.714a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
