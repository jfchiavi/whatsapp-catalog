import { useState } from 'react';
import { CreateProductModal } from './CreateProductModal';
import {
  useProducts,
  useCreateProduct,
  useDeleteProduct,
} from '@/hooks/useProducts';

export default function ProductsPage() {
  const { data, isLoading, error } = useProducts();
  const createMutation = useCreateProduct();
  const deleteMutation = useDeleteProduct();

  const [showCreate, setShowCreate] = useState(false);

  if (isLoading) return <p>Cargando productos...</p>;
  if (error) return <p>Error al cargar productos</p>;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Productos</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800"
        >
          Nuevo producto
        </button>
      </header>

      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">SKU</th>
              <th className="p-3">Nombre</th>
              <th className="p-3">Precio</th>
              <th className="p-3">Costo</th>
              <th className="p-3">Estado</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((product) => (
              <tr key={product.id} className="border-t">
                <td className="p-3">{product.sku}</td>
                <td className="p-3">{product.name}</td>
                <td className="p-3">${product.price}</td>
                <td className="p-3">${product.cost}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      product.active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {product.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  <button className="text-blue-600 hover:underline">
                    Editar
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(product.id)}
                    className="text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateProductModal
          onClose={() => setShowCreate(false)}
          onSubmit={(data) => {
            createMutation.mutate(data);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}
