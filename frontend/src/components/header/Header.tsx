import { Link } from "react-router-dom";
import  { SearchBar } from "./SearchBar";
import  { CartButton } from "./CartButton";

export const Header = () => (
  <header className="sticky top-0 bg-white shadow z-50">
    <div className="max-w-7xl mx-auto p-4 flex items-center">
      {/* Logo */}
      <Link to="/" className="font-bold text-primary mr-4 whitespace-nowrap">
        Mi Tienda
      </Link>

      {/* Search centrado */}
      <div className="flex-1 flex justify-center">
      <SearchBar />
      </div>

      {/* Cart */}
      <div className="ml-4">
      <CartButton />
      </div>

    </div>
  </header>
);
