import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type {
  TrainingDto,
  TrainingDetailDto,
  PaginatedResponse,
  CreateTrainingInput,
  ConfirmParticipationInput,
  UpdateParticipantsInput,
} from '@ssm/shared';
import type { ListParams } from '@ssm/api-client';
import { api } from '@/lib/api';
import Toast from 'react-native-toast-message';

export function useTrainings(params?: ListParams) {
  return useQuery({
    queryKey: ['trainings', params],
    queryFn: () => api.trainings.list(params),
  });
}

export function useInfiniteTrainings(params?: Omit<ListParams, 'page'>) {
  return useInfiniteQuery<PaginatedResponse<TrainingDto>>({
    queryKey: ['trainings', 'infinite', params],
    queryFn: ({ pageParam }) => api.trainings.list({ ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
  });
}

export function useTraining(uuid: string) {
  return useQuery({
    queryKey: ['trainings', uuid],
    queryFn: () => api.trainings.get(uuid),
    enabled: !!uuid,
  });
}

export function useCreateTraining() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTrainingInput) => api.trainings.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      Toast.show({ type: 'success', text1: 'Instructaj creat', text2: 'Instructajul a fost creat cu succes.' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Eroare', text2: 'Nu s-a putut crea instructajul.' });
    },
  });
}

export function useConfirmTraining(uuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ConfirmParticipationInput) => api.trainings.confirm(uuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings', uuid] });
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      Toast.show({ type: 'success', text1: 'Participare confirmata', text2: 'Confirmarea a fost inregistrata.' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Eroare', text2: 'Nu s-a putut confirma participarea.' });
    },
  });
}

/** Delete a training */
export function useDeleteTraining() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => api.trainings.remove(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      Toast.show({ type: 'success', text1: 'Instructaj șters', text2: 'Instructajul a fost șters.' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Eroare', text2: 'Nu s-a putut șterge instructajul.' });
    },
  });
}

/** Update participants for a training */
export function useUpdateParticipants(uuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateParticipantsInput) => api.trainings.updateParticipants(uuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings', uuid] });
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      Toast.show({ type: 'success', text1: 'Participanți actualizați', text2: 'Lista de participanți a fost actualizată.' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Eroare', text2: 'Nu s-au putut actualiza participanții.' });
    },
  });
}

export function useTrainingPdf(uuid: string) {
  return useQuery({
    queryKey: ['trainings', uuid, 'pdf'],
    queryFn: () => api.trainings.getPdf(uuid),
    enabled: !!uuid,
  });
}
