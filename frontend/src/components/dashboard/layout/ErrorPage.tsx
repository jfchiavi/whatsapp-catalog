// src/components/ErrorPage.tsx
import { useRouteError } from 'react-router-dom';

export default function ErrorPage() {
  const error = useRouteError() as any;

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow text-center">
        <h1 className="text-xl font-bold mb-2">Algo salió mal</h1>
        <p className="text-gray-600 text-sm">
          {error?.message || 'Error inesperado'}
        </p>
      </div>
    </div>
  );
}
