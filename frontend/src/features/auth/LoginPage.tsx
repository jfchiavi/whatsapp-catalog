import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const schema = z.object({
    email: z.string().email(),
    password: z.string().min(4),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const form = useForm<FormData>({ resolver: zodResolver(schema) });

    const onSubmit = async (data: FormData) => {
        // MOCK LOGIN
        login(
        {
            id: '1',
            name: 'Admin Principal',
            email: data.email,
            role: 'super_admin' as any,
            branchId: null,
        },
        'mock-jwt-token'
        );

        navigate('/dashboard');
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-sm mx-auto mt-40 space-y-4">
            <input {...form.register('email')} placeholder="Email" className="w-full border p-2" />
            <input type="password" {...form.register('password')} placeholder="Password" className="w-full border p-2" />
            <button className="w-full bg-black text-white py-2">Ingresar</button>
        </form>
    );
}