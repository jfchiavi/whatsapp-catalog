import { useState } from 'react';
import { useCreateUser } from '../../hooks/useUsers';
import { useBranches } from '../../hooks/useBranches';
import { X } from 'lucide-react';
import { UserRole } from '@/types/auth';

interface Props {
  onClose: () => void;
}

const ROLES: UserRole[] = ['ADMIN', 'BRANCH_MANAGER', 'SELLER'];

export const CreateUserModal = ({ onClose }: Props) => {
  const createUser = useCreateUser();
  const { data: branches } = useBranches();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('SELLER');
  const [branchId, setBranchId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createUser.mutate(
      {
        name,
        email,
        password,
        role,
        branchId: branchId || undefined,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Crear Usuario</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contraseña *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Rol *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full border rounded-lg px-3 py-2"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {(role === 'BRANCH_MANAGER' || role === 'SELLER') && (
            <div>
              <label className="block text-sm font-medium mb-1">Sucursal</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Sin sucursal</option>
                {branches?.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={createUser.isPending}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {createUser.isPending ? 'Creando...' : 'Crear usuario'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border py-2 rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
