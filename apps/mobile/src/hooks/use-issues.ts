import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  IssueReportDto,
  IssueDetailDto,
  IssueCategoryDto,
  IssueCommentDto,
  PaginatedResponse,
  CreateIssueInput,
  UpdateIssueStatusInput,
  AssignIssueInput,
  CreateIssueCommentInput,
} from '@ssm/shared';
import type { ListParams } from '@ssm/api-client';
import { api } from '@/lib/api';
import Toast from 'react-native-toast-message';

// Queries

export function useIssues(params?: ListParams) {
  return useQuery<PaginatedResponse<IssueReportDto>>({
    queryKey: ['issues', params],
    queryFn: () => api.issues.list(params),
  });
}

export function useInfiniteIssues(params?: Omit<ListParams, 'page'>) {
  return useInfiniteQuery<PaginatedResponse<IssueReportDto>>({
    queryKey: ['issues', 'infinite', params],
    queryFn: ({ pageParam }) => api.issues.list({ ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
  });
}

export function useIssue(uuid: string) {
  return useQuery<IssueDetailDto>({
    queryKey: ['issues', uuid],
    queryFn: () => api.issues.get(uuid),
    enabled: !!uuid,
  });
}

export function useIssueCategories() {
  return useQuery<IssueCategoryDto[]>({
    queryKey: ['issue-categories'],
    queryFn: () => api.issues.listCategories(),
    staleTime: 10 * 60_000,
  });
}

export function useIssueComments(uuid: string) {
  return useQuery<IssueCommentDto[]>({
    queryKey: ['issues', uuid, 'comments'],
    queryFn: () => api.issues.listComments(uuid),
    enabled: !!uuid,
  });
}

// Mutations

export function useCreateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateIssueInput) => api.issues.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      Toast.show({ type: 'success', text1: 'Problemă creată', text2: 'Raportul a fost trimis cu succes.' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Eroare', text2: 'Nu am putut crea raportul.' });
    },
  });
}

export function useUpdateIssueStatus(uuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateIssueStatusInput) => api.issues.updateStatus(uuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['issues', uuid] });
      Toast.show({ type: 'success', text1: 'Status actualizat' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Eroare', text2: 'Nu am putut actualiza statusul.' });
    },
  });
}

export function useAssignIssue(uuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AssignIssueInput) => api.issues.assign(uuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['issues', uuid] });
      Toast.show({ type: 'success', text1: 'Problemă atribuită' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Eroare', text2: 'Nu am putut atribui problema.' });
    },
  });
}

export function useDeleteIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => api.issues.remove(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      Toast.show({ type: 'success', text1: 'Problemă ștearsă' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Eroare', text2: 'Nu am putut șterge raportul.' });
    },
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
    onError: () => {
      Toast.show({ type: 'error', text1: 'Eroare', text2: 'Nu am putut adăuga comentariul.' });
    },
  });
}
