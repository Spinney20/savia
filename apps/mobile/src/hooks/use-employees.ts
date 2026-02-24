import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type {
  EmployeeDto,
  PaginatedResponse,
  CreateEmployeeInput,
  UpdateEmployeeInput,
} from '@ssm/shared';
import type { ListParams } from '@ssm/api-client';
import { api } from '@/lib/api';
import Toast from 'react-native-toast-message';

export function useEmployees(params?: ListParams) {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: () => api.employees.list(params),
  });
}

export function useInfiniteEmployees(params?: Omit<ListParams, 'page'>) {
  return useInfiniteQuery<PaginatedResponse<EmployeeDto>>({
    queryKey: ['employees', 'infinite', params],
    queryFn: ({ pageParam }) => api.employees.list({ ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
  });
}

export function useEmployee(uuid: string) {
  return useQuery({
    queryKey: ['employees', uuid],
    queryFn: () => api.employees.get(uuid),
    enabled: !!uuid,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => api.employees.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      Toast.show({ type: 'success', text1: 'Angajat adăugat', text2: 'Angajatul a fost adăugat cu succes.' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Eroare', text2: 'Nu s-a putut adăuga angajatul.' });
    },
  });
}

export function useUpdateEmployee(uuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateEmployeeInput) => api.employees.update(uuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', uuid] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      Toast.show({ type: 'success', text1: 'Angajat actualizat', text2: 'Datele angajatului au fost actualizate.' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Eroare', text2: 'Nu s-au putut actualiza datele angajatului.' });
    },
  });
}
