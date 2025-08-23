type Category = { id: string; name: string; nameRw?: string };

type Props = {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
  loading?: boolean;
};

export default function CategoryPills({ categories, selectedId, onSelect, loading }: Props) {
  return (
    <div className="mb-4">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2 pb-1 min-w-max">
          {categories.map((c) => {
            const active = (selectedId || "all") === c.id;
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`px-4 py-2 rounded-full border text-sm transition-all whitespace-nowrap ${
                  active
                    ? "bg-gradient-to-r from-pink-500 to-violet-600 text-white border-transparent shadow"
                    : "bg-background hover:bg-muted text-foreground border-border"
                }`}
                title={c.nameRw || c.name}
              >
                {c.nameRw || c.name}
              </button>
            );
          })}
          {loading && <div className="text-xs text-muted-foreground px-2">Loading...</div>}
        </div>
      </div>
    </div>
  );
}
