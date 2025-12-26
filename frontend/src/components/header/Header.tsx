import { Link } from "react-router-dom";
import  { SearchBar } from "./SearchBar";
import  { CartButton } from "./CartButton";

export const Header = () => (
  <header className="sticky top-0 bg-white shadow z-50">
    <div className="max-w-7xl mx-auto p-4 flex items-center gap-4">
      <Link to="/" className="font-bold text-primary">
        Mi Tienda
      </Link>
      <SearchBar />
      <CartButton />
    </div>
  </header>
);
