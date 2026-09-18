import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "../../store/cart.store";
import { useBranches } from "../../hooks/useBranches";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const CartDrawer = ({ open, onClose }: Props) => {
  const { items, branchId, setBranch, isLoading } = useCartStore();
  const { data: branches } = useBranches();

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

            {/* Branch Selector */}
            {branches && branches.length > 0 && (
              <div className="p-4 border-b">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sucursal
                </label>
                <select
                  value={branchId || ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      setBranch(e.target.value);
                    }
                  }}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar sucursal...</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                      {branch.address ? ` - ${branch.address}` : ""}
                    </option>
                  ))}
                </select>
                {!branchId && items.length > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Seleccioná una sucursal para ver disponibilidad
                  </p>
                )}
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-auto p-4">
              {isLoading ? (
                <p className="text-center text-gray-500">Cargando carrito...</p>
              ) : items.length === 0 ? (
                <p className="text-center text-gray-500">
                  Tu carrito está vacío
                </p>
              ) : (
                items.map((item) => (
                  <CartItem key={item.id} item={item} branchId={branchId} />
                ))
              )}
            </div>

            {/* Summary */}
            {items.length > 0 && branchId && (
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
