import type {
  PaginatedResponse,
  IssueCategoryDto,
  IssueReportDto,
  IssueDetailDto,
  IssueCommentDto,
  CreateIssueInput,
  UpdateIssueStatusInput,
  AssignIssueInput,
  CreateIssueCommentInput,
} from '@ssm/shared';
import type { HttpClient } from '../client.js';
import type { ListParams } from '../types.js';

export class IssuesEndpoints {
  constructor(private readonly http: HttpClient) {}

  /** GET /issues/categories */
  async listCategories(): Promise<IssueCategoryDto[]> {
    return this.http.get<IssueCategoryDto[]>('/issues/categories');
  }

  /** GET /issues */
  async list(params?: ListParams): Promise<PaginatedResponse<IssueReportDto>> {
    return this.http.get<PaginatedResponse<IssueReportDto>>('/issues', params);
  }

  /** POST /issues */
  async create(input: CreateIssueInput): Promise<IssueDetailDto> {
    return this.http.post<IssueDetailDto>('/issues', input);
  }

  /** GET /issues/:uuid */
  async get(uuid: string): Promise<IssueDetailDto> {
    return this.http.get<IssueDetailDto>(`/issues/${uuid}`);
  }

  /** PATCH /issues/:uuid/status */
  async updateStatus(uuid: string, input: UpdateIssueStatusInput): Promise<IssueDetailDto> {
    return this.http.patch<IssueDetailDto>(`/issues/${uuid}/status`, input);
  }

  /** PATCH /issues/:uuid/assign */
  async assign(uuid: string, input: AssignIssueInput): Promise<IssueDetailDto> {
    return this.http.patch<IssueDetailDto>(`/issues/${uuid}/assign`, input);
  }

  /** DELETE /issues/:uuid */
  async remove(uuid: string): Promise<void> {
    await this.http.del(`/issues/${uuid}`);
  }

  /** POST /issues/:uuid/comments */
  async createComment(uuid: string, input: CreateIssueCommentInput): Promise<IssueCommentDto> {
    return this.http.post<IssueCommentDto>(`/issues/${uuid}/comments`, input);
  }

  /** GET /issues/:uuid/comments */
  async listComments(uuid: string): Promise<IssueCommentDto[]> {
    return this.http.get<IssueCommentDto[]>(`/issues/${uuid}/comments`);
  }
}
