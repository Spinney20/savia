import type {
  PaginatedResponse,
  TrainingDto,
  TrainingDetailDto,
  TrainingParticipantDto,
  CreateTrainingInput,
  ConfirmParticipationInput,
  UpdateParticipantsInput,
} from '@ssm/shared';
import type { HttpClient } from '../client.js';
import type { ListParams } from '../types.js';

export class TrainingsEndpoints {
  constructor(private readonly http: HttpClient) {}

  /** GET /trainings */
  async list(params?: ListParams): Promise<PaginatedResponse<TrainingDto>> {
    return this.http.get<PaginatedResponse<TrainingDto>>('/trainings', params);
  }

  /** POST /trainings */
  async create(input: CreateTrainingInput): Promise<TrainingDetailDto> {
    return this.http.post<TrainingDetailDto>('/trainings', input);
  }

  /** GET /trainings/:uuid */
  async get(uuid: string): Promise<TrainingDetailDto> {
    return this.http.get<TrainingDetailDto>(`/trainings/${uuid}`);
  }

  /** DELETE /trainings/:uuid */
  async remove(uuid: string): Promise<void> {
    await this.http.del(`/trainings/${uuid}`);
  }

  /** POST /trainings/:uuid/confirm */
  async confirm(uuid: string, input: ConfirmParticipationInput): Promise<TrainingParticipantDto> {
    return this.http.post<TrainingParticipantDto>(`/trainings/${uuid}/confirm`, input);
  }

  /** PATCH /trainings/:uuid/participants */
  async updateParticipants(uuid: string, input: UpdateParticipantsInput): Promise<TrainingDetailDto> {
    return this.http.patch<TrainingDetailDto>(`/trainings/${uuid}/participants`, input);
  }

  /** GET /trainings/:uuid/pdf */
  async getPdf(uuid: string): Promise<{ pdfUrl: string }> {
    return this.http.get<{ pdfUrl: string }>(`/trainings/${uuid}/pdf`);
  }
}
