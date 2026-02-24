import type {
  PaginatedResponse,
  InspectionDto,
  InspectionDetailDto,
  InspectionReviewDto,
  InspectionTemplateDto,
  InspectionTemplateDetailDto,
  InspectionTemplateVersionDto,
  CreateInspectionInput,
  UpdateInspectionDraftInput,
  ReviewInspectionInput,
  CreateTemplateInput,
  UpdateTemplateInput,
  PublishTemplateVersionInput,
} from '@ssm/shared';
import type { HttpClient } from '../client.js';
import type { ListParams } from '../types.js';

export class InspectionsEndpoints {
  constructor(private readonly http: HttpClient) {}

  // --- Inspections ---

  /** GET /inspections */
  async list(params?: ListParams): Promise<PaginatedResponse<InspectionDto>> {
    return this.http.get<PaginatedResponse<InspectionDto>>('/inspections', params);
  }

  /** POST /inspections */
  async create(input: CreateInspectionInput): Promise<InspectionDto> {
    return this.http.post<InspectionDto>('/inspections', input);
  }

  /** GET /inspections/:uuid */
  async get(uuid: string): Promise<InspectionDetailDto> {
    return this.http.get<InspectionDetailDto>(`/inspections/${uuid}`);
  }

  /** PATCH /inspections/:uuid */
  async updateDraft(uuid: string, input: UpdateInspectionDraftInput): Promise<InspectionDetailDto> {
    return this.http.patch<InspectionDetailDto>(`/inspections/${uuid}`, input);
  }

  /** DELETE /inspections/:uuid */
  async remove(uuid: string): Promise<void> {
    await this.http.del(`/inspections/${uuid}`);
  }

  /** POST /inspections/:uuid/submit */
  async submit(uuid: string): Promise<InspectionDetailDto> {
    return this.http.post<InspectionDetailDto>(`/inspections/${uuid}/submit`);
  }

  /** POST /inspections/:uuid/revise */
  async revise(uuid: string): Promise<InspectionDetailDto> {
    return this.http.post<InspectionDetailDto>(`/inspections/${uuid}/revise`);
  }

  /** POST /inspections/:uuid/close */
  async close(uuid: string): Promise<InspectionDetailDto> {
    return this.http.post<InspectionDetailDto>(`/inspections/${uuid}/close`);
  }

  /** GET /inspections/:uuid/pdf */
  async getPdf(uuid: string): Promise<{ pdfUrl: string }> {
    return this.http.get<{ pdfUrl: string }>(`/inspections/${uuid}/pdf`);
  }

  /** POST /inspections/:uuid/reviews */
  async createReview(uuid: string, input: ReviewInspectionInput): Promise<InspectionReviewDto> {
    return this.http.post<InspectionReviewDto>(`/inspections/${uuid}/reviews`, input);
  }

  /** GET /inspections/:uuid/reviews */
  async listReviews(uuid: string): Promise<InspectionReviewDto[]> {
    return this.http.get<InspectionReviewDto[]>(`/inspections/${uuid}/reviews`);
  }

  // --- Templates ---

  /** GET /inspection-templates */
  async listTemplates(params?: ListParams): Promise<PaginatedResponse<InspectionTemplateDto>> {
    return this.http.get<PaginatedResponse<InspectionTemplateDto>>('/inspection-templates', params);
  }

  /** POST /inspection-templates */
  async createTemplate(input: CreateTemplateInput): Promise<InspectionTemplateDto> {
    return this.http.post<InspectionTemplateDto>('/inspection-templates', input);
  }

  /** GET /inspection-templates/:uuid */
  async getTemplate(uuid: string): Promise<InspectionTemplateDetailDto> {
    return this.http.get<InspectionTemplateDetailDto>(`/inspection-templates/${uuid}`);
  }

  /** PATCH /inspection-templates/:uuid */
  async updateTemplate(uuid: string, input: UpdateTemplateInput): Promise<InspectionTemplateDto> {
    return this.http.patch<InspectionTemplateDto>(`/inspection-templates/${uuid}`, input);
  }

  /** DELETE /inspection-templates/:uuid */
  async removeTemplate(uuid: string): Promise<void> {
    await this.http.del(`/inspection-templates/${uuid}`);
  }

  /** POST /inspection-templates/:uuid/versions */
  async publishVersion(uuid: string, input: PublishTemplateVersionInput): Promise<InspectionTemplateVersionDto> {
    return this.http.post<InspectionTemplateVersionDto>(`/inspection-templates/${uuid}/versions`, input);
  }
}
