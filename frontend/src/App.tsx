import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router.tsx'

// ❌ Error
// No QueryClient set, use QueryClientProvider to set one
// 🔍 Causa real
// Estás usando useQuery (React Query)
// ❌ pero nunca envolviste la app con QueryClientProvider

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

export default App
