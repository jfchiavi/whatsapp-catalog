import { useState } from "react";
import { useCatalogProducts } from "@/hooks/useCatalog";
import { useDebounce } from "./useDebounce";

const HISTORY_KEY = "search-history";

export const useSearch = () => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { data: products = [] } = useCatalogProducts();
  const debounced = useDebounce(query, 300);

  const results = products
    .filter((p) =>
      `${p.name} ${p.batch || ""}`.toLowerCase().includes(debounced.toLowerCase())
    )
    .slice(0, 6);

  const history: string[] =
    JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");

  const saveHistory = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...history.filter((h) => h !== term)].slice(0, 5);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  return {
    query,
    setQuery,
    open,
    setOpen,
    results,
    history,
    saveHistory,
  };
};
