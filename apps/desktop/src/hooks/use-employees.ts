import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  CreateEmployeeDocumentInput,
  CreateUserForEmployeeInput,
  AssignEmployeeToSiteInput,
} from '@ssm/shared';
import type { ListParams } from '@ssm/api-client';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function useEmployees(params?: ListParams) {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: () => api.employees.list(params),
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
      toast.success('Angajat adăugat');
    },
    onError: () => toast.error('Nu am putut adăuga angajatul.'),
  });
}

export function useUpdateEmployee(uuid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateEmployeeInput) => api.employees.update(uuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', uuid] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Angajat actualizat');
    },
    onError: () => toast.error('Nu am putut actualiza angajatul.'),
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => api.employees.remove(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Angajat șters');
    },
    onError: () => toast.error('Nu am putut șterge angajatul.'),
  });
}

// Site assignments
export function useEmployeeSites(uuid: string) {
  return useQuery({
    queryKey: ['employees', uuid, 'sites'],
    queryFn: () => api.employees.listSites(uuid),
    enabled: !!uuid,
  });
}

export function useAssignSite(uuid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AssignEmployeeToSiteInput) => api.employees.assignSite(uuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', uuid, 'sites'] });
      toast.success('Șantier atribuit');
    },
    onError: () => toast.error('Nu am putut atribui șantierul.'),
  });
}

export function useRemoveSite(employeeUuid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (siteUuid: string) => api.employees.removeSite(employeeUuid, siteUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', employeeUuid, 'sites'] });
      toast.success('Șantier eliminat');
    },
    onError: () => toast.error('Nu am putut elimina șantierul.'),
  });
}

// Documents
export function useEmployeeDocuments(uuid: string) {
  return useQuery({
    queryKey: ['employees', uuid, 'documents'],
    queryFn: () => api.employees.listDocuments(uuid),
    enabled: !!uuid,
  });
}

export function useCreateDocument(uuid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEmployeeDocumentInput) => api.employees.createDocument(uuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', uuid, 'documents'] });
      toast.success('Document adăugat');
    },
    onError: () => toast.error('Nu am putut adăuga documentul.'),
  });
}

// User account creation
export function useCreateUserForEmployee(uuid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserForEmployeeInput) => api.employees.createUser(uuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', uuid] });
      toast.success('Cont creat', { description: 'Emailul de activare a fost trimis.' });
    },
    onError: () => toast.error('Nu am putut crea contul.'),
  });
}
