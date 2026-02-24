import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type {
  InspectionDto,
  InspectionDetailDto,
  InspectionReviewDto,
  PaginatedResponse,
  CreateInspectionInput,
  UpdateInspectionDraftInput,
  ReviewInspectionInput,
} from '@ssm/shared';
import type { ListParams } from '@ssm/api-client';
import { api } from '@/lib/api';
import Toast from 'react-native-toast-message';

/** List inspections with optional pagination/search params */
export function useInspections(params?: ListParams) {
  return useQuery({
    queryKey: ['inspections', params],
    queryFn: () => api.inspections.list(params),
  });
}

export function useInfiniteInspections(params?: Omit<ListParams, 'page'>) {
  return useInfiniteQuery<PaginatedResponse<InspectionDto>>({
    queryKey: ['inspections', 'infinite', params],
    queryFn: ({ pageParam }) => api.inspections.list({ ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
  });
}

/** Get a single inspection by UUID */
export function useInspection(uuid: string) {
  return useQuery({
    queryKey: ['inspections', uuid],
    queryFn: () => api.inspections.get(uuid),
    enabled: !!uuid,
  });
}

/** Create a new inspection */
export function useCreateInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInspectionInput) => api.inspections.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      Toast.show({ type: 'success', text1: 'Inspecție creată', text2: 'Inspecția a fost creată cu succes.' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Eroare', text2: 'Nu am putut crea inspecția.' });
    },
  });
}

/** Update a draft inspection */
export function useUpdateDraft(uuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateInspectionDraftInput) => api.inspections.updateDraft(uuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections', uuid] });
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      Toast.show({ type: 'success', text1: 'Ciornă actualizată', text2: 'Modificările au fost salvate.' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Eroare', text2: 'Nu am putut salva modificările.' });
    },
  });
}

/** Submit a draft inspection for review */
export function useSubmitInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => api.inspections.submit(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      Toast.show({ type: 'success', text1: 'Inspecție trimisă', text2: 'Inspecția a fost trimisă pentru aprobare.' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Eroare', text2: 'Nu am putut trimite inspecția.' });
    },
  });
}

/** Close an approved inspection */
export function useCloseInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => api.inspections.close(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      Toast.show({ type: 'success', text1: 'Inspecție închisă', text2: 'Inspecția a fost închisă.' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Eroare', text2: 'Nu am putut închide inspecția.' });
    },
  });
}

/** List reviews for an inspection */
export function useInspectionReviews(uuid: string) {
  return useQuery({
    queryKey: ['inspections', uuid, 'reviews'],
    queryFn: () => api.inspections.listReviews(uuid),
    enabled: !!uuid,
  });
}

/** Create a review for an inspection */
export function useCreateReview(uuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReviewInspectionInput) => api.inspections.createReview(uuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections', uuid] });
      queryClient.invalidateQueries({ queryKey: ['inspections', uuid, 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      Toast.show({ type: 'success', text1: 'Recenzie adăugată', text2: 'Recenzia a fost înregistrată.' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Eroare', text2: 'Nu am putut adăuga recenzia.' });
    },
  });
}

/** Revise an inspection (send back to draft) */
export function useReviseInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => api.inspections.revise(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      Toast.show({ type: 'success', text1: 'Inspecție revizuită', text2: 'Inspecția a fost trimisă înapoi pentru revizuire.' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Eroare', text2: 'Nu am putut revizui inspecția.' });
    },
  });
}

/** Delete a draft inspection */
export function useDeleteInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => api.inspections.remove(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      Toast.show({ type: 'success', text1: 'Inspecție ștearsă', text2: 'Inspecția a fost ștearsă.' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Eroare', text2: 'Nu am putut șterge inspecția.' });
    },
  });
}

/** Get PDF URL for an inspection */
export function useInspectionPdf(uuid: string) {
  return useQuery({
    queryKey: ['inspections', uuid, 'pdf'],
    queryFn: () => api.inspections.getPdf(uuid),
    enabled: !!uuid,
  });
}
