import { Trash2 } from "lucide-react";
import { useCartStore } from "../../store/cart.store";

export const CartItem = ({ item }: { item: any }) => {
  const remove = useCartStore(s => s.remove);
  const update = useCartStore(s => s.update);

  return (
    <div className="flex gap-3 py-3 border-b">
      <img
        src={item.product.image}
        className="w-16 h-16 object-cover rounded"
      />

      <div className="flex-1 space-y-1">
        <p className="font-medium">{item.product.name}</p>
        <p className="text-sm text-gray-500">
          ${item.product.price.toLocaleString()}
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => update(item.id, Math.max(1, item.quantity - 1))}
            className="w-7 h-7 border rounded"
          >
            −
          </button>

          <span>{item.quantity}</span>

          <button
            onClick={() => update(item.id, item.quantity + 1)}
            className="w-7 h-7 border rounded"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-col items-end justify-between">
        <button onClick={() => remove(item.id)}>
          <Trash2 size={18} className="text-gray-400 hover:text-red-500" />
        </button>

        <p className="font-semibold">
          ${(item.product.price * item.quantity).toLocaleString()}
        </p>
      </div>
    </div>
  );
};
