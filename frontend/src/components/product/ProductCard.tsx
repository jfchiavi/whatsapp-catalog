import type { Product } from "../../types/product";
import { Link } from "react-router-dom";
import { Button } from "../common/Button";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "../../store/cart.store";

export const ProductCard = ({ product }: { product: Product }) => {
  const add = useCartStore((s) => s.add);
  const defaultVariant = product.variants[0];

  const handleAdd = () => {
    if (!defaultVariant) return;
    add(product, defaultVariant, 1);
  };

  return (
    <div className="bg-white rounded shadow hover:shadow-lg transition">
      <Link to={`/product/${product.id}`}>
        <img
          src={product.imageUrl || "https://picsum.photos/400/300"}
          alt={product.name}
          className="rounded-t h-48 w-full object-cover"
        />
      </Link>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold">{product.name}</h3>
        {defaultVariant ? (
          <p className="font-bold">${defaultVariant.price.toFixed(2)}</p>
        ) : (
          <p className="text-gray-400 text-sm">Sin variantes</p>
        )}
        {product.variants.length > 1 && (
          <p className="text-xs text-gray-500">
            {product.variants.length} opciones disponibles
          </p>
        )}
        <Button
          onClick={handleAdd}
          disabled={!defaultVariant}
          className="w-full bg-primary text-white py-2 rounded disabled:opacity-50"
        >
          <ShoppingCart size={18} />
          Agregar al carrito
        </Button>
      </div>
    </div>
  );
};
