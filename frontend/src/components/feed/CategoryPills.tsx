type Category = {
  id: string;
  name: string;
  nameRw?: string;
  imageUrl?: string;
};

type Props = {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
  loading?: boolean;
};

// Fallback image for categories without images
const defaultCategoryImage =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop&crop=center";

export default function CategoryPills({
  categories,
  selectedId,
  onSelect,
  loading,
}: Props) {
  return (
    <div className="mb-2">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex items-start gap-3 pb-2 min-w-max px-1 pt-1">
          {categories.map((c) => {
            const active = (selectedId || "all") === c.id;
            const imageUrl = c.imageUrl || defaultCategoryImage;

            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className="flex flex-col items-center gap-2 group min-w-[70px] transition-all duration-200"
                title={c.nameRw || c.name}
              >
                <div
                  className={`relative transition-all duration-300 ${
                    active
                      ? "bg-gradient-to-tr from-pink-500 via-purple-500 to-violet-600 shadow-lg scale-110"
                      : "bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600"
                  } p-[2px] rounded-full group-hover:scale-105`}
                >
                  <div className="bg-white dark:bg-gray-900 rounded-full p-[1px]">
                    <div className="h-12 w-12 rounded-full overflow-hidden relative">
                      <img
                        src={imageUrl}
                        alt={c.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            defaultCategoryImage;
                        }}
                      />
                      {active && (
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent"></div>
                      )}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium text-center leading-tight max-w-[70px] truncate ${
                    active
                      ? "text-purple-600 dark:text-purple-400 font-semibold"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {c.nameRw || c.name}
                </span>
              </button>
            );
          })}
          {loading && (
            <div className="flex flex-col items-center gap-2 min-w-[70px]">
              <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
              <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
