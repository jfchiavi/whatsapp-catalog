import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
import { useDebounce } from '@/hooks/useDebounce';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const { data: customers, isLoading } = useCustomers(debouncedSearch || undefined);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Clientes</h1>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-3 text-gray-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre, teléfono o email"
          className="w-full border rounded-lg pl-9 pr-3 py-2"
        />
      </div>

      {isLoading ? (
        <div>Cargando clientes...</div>
      ) : !customers || customers.length === 0 ? (
        <div className="text-gray-500">No hay clientes</div>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Nombre</th>
              <th className="p-2 text-left">Teléfono</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-center">Pedidos</th>
              <th className="p-2 text-left">Alta</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-t hover:bg-gray-50">
                <td className="p-2 font-medium">
                  <Link to={`/customers/${customer.id}`} className="text-blue-600 hover:underline">
                    {customer.name}
                  </Link>
                </td>
                <td className="p-2 text-sm">{customer.phone}</td>
                <td className="p-2 text-sm text-gray-500">{customer.email || '-'}</td>
                <td className="p-2 text-center">{customer._count?.orders ?? 0}</td>
                <td className="p-2 text-sm text-gray-500">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
