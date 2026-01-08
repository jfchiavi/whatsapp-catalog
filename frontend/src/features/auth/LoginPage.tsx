import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLogin } from '@/hooks/useLogin';
import { useAuth } from '@/context/AuthContext';
import { schema, type FormData } from './login.schema';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const response = await loginMutation.mutateAsync(data);
      login(response.user, response.accessToken);
      //⚠️ En producción real esto va en cookie httpOnly.
      localStorage.setItem('refreshToken', response.refreshToken);

      navigate('/dashboard');
    } catch (error) {
      alert('Credenciales inválidas');
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="max-w-sm mx-auto mt-40 space-y-4"
    >
      <input
        {...form.register('email')}
        placeholder="Email"
        className="w-full border p-2"
      />
      <input
        type="password"
        {...form.register('password')}
        placeholder="Password"
        className="w-full border p-2"
      />

      <button
        type="submit"
        disabled={loginMutation.isPending}
        className="w-full bg-black text-white py-2 disabled:opacity-50"
      >
        {loginMutation.isPending ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  );
}
