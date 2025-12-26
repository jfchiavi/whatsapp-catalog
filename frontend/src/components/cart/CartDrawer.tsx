import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "../../store/cart.store";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const CartDrawer = ({ open, onClose }: Props) => {
  const items = useCartStore(s => s.items);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Drawer */}
          <motion.aside
            className="
              fixed z-50 bg-white
              bottom-0 left-0 right-0 h-[85%]
              md:top-0 md:right-0 md:left-auto md:h-full md:w-[420px]
              rounded-t-xl md:rounded-none
              flex flex-col
            "
            initial={{ y: "100%", x: "100%" }}
            animate={{ y: 0, x: 0 }}
            exit={{ y: "100%", x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
          >
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-bold">
                Tu carrito ({items.length})
              </h2>
              <button onClick={onClose}>
                <X />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-auto p-4">
              {items.length === 0 ? (
                <p className="text-center text-gray-500">
                  Tu carrito está vacío
                </p>
              ) : (
                items.map(item => (
                  <CartItem key={item.id} item={item} />
                ))
              )}
            </div>

            {/* Summary */}
            {items.length > 0 && (
              <div className="p-4">
                <CartSummary onClose={onClose} />
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
