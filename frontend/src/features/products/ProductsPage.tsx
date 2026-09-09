import { useState } from 'react';
import { CreateProductModal } from './CreateProductModal';
import { UpdateProductModal } from './UpdateProdcutModal';
import { CreateVariantModal } from './CreateVariantModal';
import { UpdateVariantModal } from './UpdateVariantModal';
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '@/hooks/useProducts';
import { useCreateVariant, useUpdateVariant, useDeleteVariant } from '@/hooks/useVariants';
import type { Product, Variant, CreateProductInput, UpdateProductInput, CreateVariantInput, UpdateVariantInput } from '@/types/product';

export default function ProductsPage() {
  const { data: products, isLoading, error } = useProducts();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const createVariantMutation = useCreateVariant();
  const updateVariantMutation = useUpdateVariant();
  const deleteVariantMutation = useDeleteVariant();

  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productForVariant, setProductForVariant] = useState<Product | null>(null);
  const [variantToEdit, setVariantToEdit] = useState<{ variant: Variant; productId: string } | null>(null);

  if (isLoading) return <p className="p-6">Cargando productos...</p>;
  if (error) return <p className="p-6 text-red-600">Error al cargar productos</p>;

  const handleCreateProduct = (data: CreateProductInput) => {
    createProductMutation.mutate(data, { onSuccess: () => setShowCreateProduct(false) });
  };

  const handleUpdateProduct = (data: UpdateProductInput) => {
    if (!productToEdit) return;
    updateProductMutation.mutate(
      { id: productToEdit.id, data },
      { onSuccess: () => setProductToEdit(null) }
    );
  };

  const handleDeleteProduct = (id: string) => {
    if (!confirm('Eliminar este producto y todas sus variantes?')) return;
    deleteProductMutation.mutate(id);
  };

  const handleCreateVariant = (data: CreateVariantInput) => {
    if (!productForVariant) return;
    createVariantMutation.mutate(
      { productId: productForVariant.id, data },
      { onSuccess: () => setProductForVariant(null) }
    );
  };

  const handleUpdateVariant = (data: UpdateVariantInput) => {
    if (!variantToEdit) return;
    updateVariantMutation.mutate(
      { id: variantToEdit.variant.id, data, productId: variantToEdit.productId },
      { onSuccess: () => setVariantToEdit(null) }
    );
  };

  const handleDeleteVariant = (variantId: string, productId: string) => {
    if (!confirm('Eliminar esta variante?')) return;
    deleteVariantMutation.mutate({ id: variantId, productId });
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Productos</h1>
        <button
          onClick={() => setShowCreateProduct(true)}
          className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800"
        >
          Nuevo producto
        </button>
      </header>

      {products?.length === 0 && (
        <p className="text-gray-500">No hay productos registrados.</p>
      )}

      <div className="space-y-4">
        {products?.map((product) => (
          <div key={product.id} className="border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-gray-50">
              <div className="flex items-center gap-4">
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                )}
                <div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-gray-500">
                    {product.variants.length} variante(s)
                    {product.batch && ` · Lote: ${product.batch}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    product.active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {product.active ? 'Activo' : 'Inactivo'}
                </span>
                <button
                  onClick={() => setProductForVariant(product)}
                  className="text-sm px-2 py-1 border rounded hover:bg-gray-100"
                >
                  + Variante
                </button>
                <button
                  onClick={() => setProductToEdit(product)}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Eliminar
                </button>
              </div>
            </div>

            {product.variants.length > 0 && (
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Precio</th>
                    <th className="p-3">Costo</th>
                    <th className="p-3">Atributos</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map((variant) => (
                    <tr key={variant.id} className="border-t">
                      <td className="p-3 font-mono text-xs">{variant.sku}</td>
                      <td className="p-3">${variant.price.toFixed(2)}</td>
                      <td className="p-3">${variant.cost.toFixed(2)}</td>
                      <td className="p-3 text-xs text-gray-600">
                        {Object.entries(variant.attributes).length > 0
                          ? Object.entries(variant.attributes)
                              .map(([k, v]) => `${k}: ${String(v)}`)
                              .join(', ')
                          : '—'}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() =>
                            setVariantToEdit({ variant, productId: product.id })
                          }
                          className="text-blue-600 hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteVariant(variant.id, product.id)}
                          className="text-red-600 hover:underline"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>

      {showCreateProduct && (
        <CreateProductModal
          onClose={() => setShowCreateProduct(false)}
          onSubmit={handleCreateProduct}
        />
      )}

      {productToEdit && (
        <UpdateProductModal
          product={productToEdit}
          onClose={() => setProductToEdit(null)}
          onSubmit={handleUpdateProduct}
        />
      )}

      {productForVariant && (
        <CreateVariantModal
          productName={productForVariant.name}
          onClose={() => setProductForVariant(null)}
          onSubmit={handleCreateVariant}
        />
      )}

      {variantToEdit && (
        <UpdateVariantModal
          variant={variantToEdit.variant}
          onClose={() => setVariantToEdit(null)}
          onSubmit={handleUpdateVariant}
        />
      )}
    </div>
  );
}
