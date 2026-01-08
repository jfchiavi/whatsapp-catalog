import { api } from './api';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    branchId: string | null;
    tenantId: string | null;
  };
}
//conectar LoginPage → backend real, auth profesional con JWT + React Query.
export const loginRequest = async (payload: {
  email: string;
  password: string;
}): Promise<LoginResponse> => {
  const { data } = await api.post('/auth/login', payload);
  console.log('Datos recibidos del loginRequest:', data);
  return data;
};
