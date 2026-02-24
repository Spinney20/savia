import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateIssueInput,
  UpdateIssueStatusInput,
  AssignIssueInput,
  CreateIssueCommentInput,
} from '@ssm/shared';
import type { ListParams } from '@ssm/api-client';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function useIssues(params?: ListParams) {
  return useQuery({
    queryKey: ['issues', params],
    queryFn: () => api.issues.list(params),
  });
}

export function useIssue(uuid: string) {
  return useQuery({
    queryKey: ['issues', uuid],
    queryFn: () => api.issues.get(uuid),
    enabled: !!uuid,
  });
}

export function useIssueCategories() {
  return useQuery({
    queryKey: ['issue-categories'],
    queryFn: () => api.issues.listCategories(),
    staleTime: 10 * 60_000,
  });
}

export function useIssueComments(uuid: string) {
  return useQuery({
    queryKey: ['issues', uuid, 'comments'],
    queryFn: () => api.issues.listComments(uuid),
    enabled: !!uuid,
  });
}

export function useCreateIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateIssueInput) => api.issues.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success('Problemă raportată');
    },
    onError: () => toast.error('Nu am putut crea raportul.'),
  });
}

export function useUpdateIssueStatus(uuid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateIssueStatusInput) => api.issues.updateStatus(uuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['issues', uuid] });
      toast.success('Status actualizat');
    },
    onError: () => toast.error('Nu am putut actualiza statusul.'),
  });
}

export function useAssignIssue(uuid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AssignIssueInput) => api.issues.assign(uuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['issues', uuid] });
      toast.success('Problemă atribuită');
    },
    onError: () => toast.error('Nu am putut atribui problema.'),
  });
}

export function useDeleteIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => api.issues.remove(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success('Problemă ștearsă');
    },
    onError: () => toast.error('Nu am putut șterge raportul.'),
  });
}

export function useCreateIssueComment(uuid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateIssueCommentInput) => api.issues.createComment(uuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', uuid, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['issues', uuid] });
    },
    onError: () => toast.error('Nu am putut adăuga comentariul.'),
  });
}
