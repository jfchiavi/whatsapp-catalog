import { useState } from 'react';
import { useUsers, useDeleteUser, useUpdateUser } from '../../hooks/useUsers';
import { CreateUserModal } from './CreateUserModal';
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

export default function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const deleteUser = useDeleteUser();
  const updateUser = useUpdateUser();
  const [showCreate, setShowCreate] = useState(false);

  if (isLoading) return <div>Cargando usuarios...</div>;

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      SUPER_ADMIN: 'bg-purple-100 text-purple-700',
      ADMIN: 'bg-blue-100 text-blue-700',
      BRANCH_MANAGER: 'bg-green-100 text-green-700',
      SELLER: 'bg-gray-100 text-gray-700',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[role] || ''}`}>
        {role}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Usuarios</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          Crear Usuario
        </button>
      </div>

      {!users || users.length === 0 ? (
        <div className="text-gray-500">No hay usuarios</div>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Nombre</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-center">Rol</th>
              <th className="p-2 text-left">Sucursal</th>
              <th className="p-2 text-center">Estado</th>
              <th className="p-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="p-2 font-medium">{user.name}</td>
                <td className="p-2 text-sm text-gray-500">{user.email}</td>
                <td className="p-2 text-center">{roleBadge(user.role)}</td>
                <td className="p-2 text-sm">{user.branch?.name || '-'}</td>
                <td className="p-2 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="p-2 text-center space-x-1">
                  <button
                    onClick={() =>
                      updateUser.mutate({
                        id: user.id,
                        data: { active: !user.active },
                      })
                    }
                    className="p-1 text-gray-500 hover:text-blue-600"
                    title={user.active ? 'Desactivar' : 'Activar'}
                  >
                    {user.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('¿Desactivar este usuario?')) {
                        deleteUser.mutate(user.id);
                      }
                    }}
                    className="p-1 text-gray-500 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
