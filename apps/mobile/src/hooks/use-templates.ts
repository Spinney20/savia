import { useQuery } from '@tanstack/react-query';
import type {
  InspectionTemplateDto,
  InspectionTemplateDetailDto,
} from '@ssm/shared';
import type { ListParams } from '@ssm/api-client';
import { api } from '@/lib/api';

/** List inspection templates with optional pagination/search params */
export function useTemplates(params?: ListParams) {
  return useQuery({
    queryKey: ['templates', params],
    queryFn: () => api.inspections.listTemplates(params),
  });
}

/** Get a single template by UUID */
export function useTemplate(uuid: string) {
  return useQuery({
    queryKey: ['templates', uuid],
    queryFn: () => api.inspections.getTemplate(uuid),
    enabled: !!uuid,
  });
}
