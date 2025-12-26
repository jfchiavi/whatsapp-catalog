import type { Product } from "../../types";
import { Link } from "react-router-dom";
import {Button} from "../common/Button";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "../../store/cart.store";

export const ProductCard = ({ product }: { product: Product }) => {
  const add = useCartStore(s => s.add);

  return (
    <div className="bg-white rounded shadow hover:shadow-lg transition">
      <Link to={`/product/${product.id}`}>
        <img src={product.image} className="rounded-t h-48 w-full object-cover" />
      </Link>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold">{product.name}</h3>
        <p className="font-bold">${product.price}</p>
        <Button
          onClick={() => add(product, 1)}
          className="w-full bg-primary text-white py-2 rounded"
        >
          <ShoppingCart size={18} />
          Agregar al carrito
        </Button>
      </div>
    </div>
  );
};
