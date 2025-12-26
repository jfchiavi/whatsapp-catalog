import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useSearch } from "../../hooks/useSearch";
import { SearchDropdown } from "./SearchDropdown";

export const SearchBar = () => {
  const nav = useNavigate();
  const {
    query,
    setQuery,
    open,
    setOpen,
    results,
    history,
    saveHistory,
  } = useSearch();

  const submit = (value: string) => {
    saveHistory(value);
    setOpen(false);
    nav(`/search?q=${encodeURIComponent(value)}`);
  };

  return (
    <div className="relative flex-1 max-w-xl">
      <div className="flex items-center border rounded-lg px-3 py-2 bg-white">
        <Search size={18} className="text-gray-400" />
        <input
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={e => {
            if (e.key === "Enter") submit(query);
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Buscar productos..."
          className="flex-1 outline-none px-2"
        />

        {query && (
          <button
            onClick={() => setQuery("")}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-2 w-full bg-white border rounded-lg shadow-lg z-50">
          <SearchDropdown
            query={query}
            results={results}
            history={history}
            onSelect={submit}
          />
        </div>
      )}
    </div>
  );
};
