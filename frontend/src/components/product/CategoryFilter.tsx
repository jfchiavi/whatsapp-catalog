
type Props = {
  categories: string[];
  selected: Set<string>;
  onToggle: (category: string) => void;
};

export function CategoryFilter({ categories, selected, onToggle }: Props) {
  return (
    <aside className="w-full">
      <h3 className="text-lg font-semibold mb-6">
        Categorías
      </h3>

      <ul className="space-y-4">
        {categories.map((cat) => {
          const checked = selected.has(cat);

          return (
            <li key={cat} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onToggle(cat)}
                className={[
                  "h-5 w-5 rounded-sm border flex items-center justify-center",
                  checked ? "border-gray-400" : "border-gray-200",
                ].join(" ")}
              >
                {checked && <span className="text-sm">✓</span>}
              </button>

              <button
                type="button"
                onClick={() => onToggle(cat)}
                className="text-sm text-gray-700 hover:text-gray-900"
              >
                {cat}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}