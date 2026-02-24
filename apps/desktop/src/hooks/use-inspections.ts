import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateInspectionInput,
  UpdateInspectionDraftInput,
  ReviewInspectionInput,
} from '@ssm/shared';
import type { ListParams } from '@ssm/api-client';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function useInspections(params?: ListParams) {
  return useQuery({
    queryKey: ['inspections', params],
    queryFn: () => api.inspections.list(params),
  });
}

export function useInspection(uuid: string) {
  return useQuery({
    queryKey: ['inspections', uuid],
    queryFn: () => api.inspections.get(uuid),
    enabled: !!uuid,
  });
}

export function useCreateInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInspectionInput) => api.inspections.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast.success('Inspecție creată');
    },
    onError: () => toast.error('Nu am putut crea inspecția.'),
  });
}

export function useUpdateDraft(uuid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInspectionDraftInput) => api.inspections.updateDraft(uuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections', uuid] });
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast.success('Ciornă salvată');
    },
    onError: () => toast.error('Nu am putut salva modificările.'),
  });
}

export function useSubmitInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => api.inspections.submit(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast.success('Inspecție trimisă pentru aprobare');
    },
    onError: () => toast.error('Nu am putut trimite inspecția.'),
  });
}

export function useCloseInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => api.inspections.close(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast.success('Inspecție închisă');
    },
    onError: () => toast.error('Nu am putut închide inspecția.'),
  });
}

export function useReviseInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => api.inspections.revise(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast.success('Inspecție retrimisă pentru revizuire');
    },
    onError: () => toast.error('Eroare la retimitere.'),
  });
}

export function useInspectionReviews(uuid: string) {
  return useQuery({
    queryKey: ['inspections', uuid, 'reviews'],
    queryFn: () => api.inspections.listReviews(uuid),
    enabled: !!uuid,
  });
}

export function useCreateReview(uuid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReviewInspectionInput) => api.inspections.createReview(uuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections', uuid] });
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast.success('Recenzie adăugată');
    },
    onError: () => toast.error('Nu am putut adăuga recenzia.'),
  });
}

export function useInspectionPdf(uuid: string) {
  return useQuery({
    queryKey: ['inspections', uuid, 'pdf'],
    queryFn: () => api.inspections.getPdf(uuid),
    enabled: !!uuid,
  });
}

export function useDeleteInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => api.inspections.remove(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast.success('Inspecție ștearsă');
    },
    onError: () => toast.error('Nu am putut șterge inspecția.'),
  });
}
