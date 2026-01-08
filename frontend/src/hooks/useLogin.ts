import { useMutation } from '@tanstack/react-query';
import { loginRequest } from '@/services/auth.api';

export const useLogin = () => {
  return useMutation({
    mutationFn: loginRequest,
  });
};
