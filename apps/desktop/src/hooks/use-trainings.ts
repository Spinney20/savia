import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateTrainingInput,
  ConfirmParticipationInput,
  UpdateParticipantsInput,
} from '@ssm/shared';
import type { ListParams } from '@ssm/api-client';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function useTrainings(params?: ListParams) {
  return useQuery({
    queryKey: ['trainings', params],
    queryFn: () => api.trainings.list(params),
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
      toast.success('Instructaj creat');
    },
    onError: () => toast.error('Nu am putut crea instructajul.'),
  });
}

export function useConfirmTraining(uuid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ConfirmParticipationInput) => api.trainings.confirm(uuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings', uuid] });
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      toast.success('Participare confirmată');
    },
    onError: () => toast.error('Nu am putut confirma participarea.'),
  });
}

export function useUpdateParticipants(uuid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateParticipantsInput) => api.trainings.updateParticipants(uuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings', uuid] });
      toast.success('Participanți actualizați');
    },
    onError: () => toast.error('Nu am putut actualiza participanții.'),
  });
}

export function useDeleteTraining() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => api.trainings.remove(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      toast.success('Instructaj șters');
    },
    onError: () => toast.error('Nu am putut șterge instructajul.'),
  });
}

export function useTrainingPdf(uuid: string) {
  return useQuery({
    queryKey: ['trainings', uuid, 'pdf'],
    queryFn: () => api.trainings.getPdf(uuid),
    enabled: !!uuid,
  });
}
