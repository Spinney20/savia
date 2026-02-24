import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateTemplateInput,
  UpdateTemplateInput,
  PublishTemplateVersionInput,
} from '@ssm/shared';
import type { ListParams } from '@ssm/api-client';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function useTemplates(params?: ListParams) {
  return useQuery({
    queryKey: ['templates', params],
    queryFn: () => api.inspections.listTemplates(params),
  });
}

export function useTemplate(uuid: string) {
  return useQuery({
    queryKey: ['templates', uuid],
    queryFn: () => api.inspections.getTemplate(uuid),
    enabled: !!uuid,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTemplateInput) => api.inspections.createTemplate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Șablon creat');
    },
    onError: () => toast.error('Nu am putut crea șablonul.'),
  });
}

export function useUpdateTemplate(uuid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTemplateInput) => api.inspections.updateTemplate(uuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', uuid] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Șablon actualizat');
    },
    onError: () => toast.error('Nu am putut actualiza șablonul.'),
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => api.inspections.removeTemplate(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Șablon șters');
    },
    onError: () => toast.error('Nu am putut șterge șablonul.'),
  });
}

export function usePublishVersion(uuid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PublishTemplateVersionInput) => api.inspections.publishVersion(uuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', uuid] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Versiune publicată');
    },
    onError: () => toast.error('Nu am putut publica versiunea.'),
  });
}
