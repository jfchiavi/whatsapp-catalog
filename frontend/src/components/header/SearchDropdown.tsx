import { Link } from "react-router-dom";
import { Clock, Search } from "lucide-react";

interface Props {
  query: string;
  results: any[];
  history: string[];
  onSelect: (value: string) => void;
}

export const SearchDropdown = ({
  query,
  results,
  history,
  onSelect,
}: Props) => {
  if (!query) {
    return (
      <div className="p-3">
        <p className="text-xs text-gray-500 mb-2">Búsquedas recientes</p>
        {history.length === 0 && (
          <p className="text-sm text-gray-400">Sin historial</p>
        )}
        {history.map(h => (
          <button
            key={h}
            onClick={() => onSelect(h)}
            className="flex items-center gap-2 w-full text-left p-2 hover:bg-gray-100 rounded"
          >
            <Clock size={14} />
            {h}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div>
      {results.map(p => (
        <Link
          key={p.id}
          to={`/product/${p.id}`}
          className="flex items-center gap-3 p-3 hover:bg-gray-100"
        >
          <img src={p.image} className="w-10 h-10 rounded object-cover" />
          <div>
            <p className="text-sm font-medium">{p.name}</p>
            <p className="text-xs text-gray-500">{p.category}</p>
          </div>
        </Link>
      ))}

      {results.length === 0 && (
        <p className="p-3 text-sm text-gray-500">
          No se encontraron resultados
        </p>
      )}
    </div>
  );
};
