import type {
  PaginatedResponse,
  EmployeeDto,
  EmployeeDocumentDto,
  EmployeeSiteAssignmentDto,
  UserDto,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  CreateUserForEmployeeInput,
  AssignEmployeeToSiteInput,
  CreateEmployeeDocumentInput,
} from '@ssm/shared';
import type { HttpClient } from '../client.js';
import type { ListParams } from '../types.js';

export class EmployeesEndpoints {
  constructor(private readonly http: HttpClient) {}

  /** GET /employees */
  async list(params?: ListParams): Promise<PaginatedResponse<EmployeeDto>> {
    return this.http.get<PaginatedResponse<EmployeeDto>>('/employees', params);
  }

  /** POST /employees */
  async create(input: CreateEmployeeInput): Promise<EmployeeDto> {
    return this.http.post<EmployeeDto>('/employees', input);
  }

  /** GET /employees/:uuid */
  async get(uuid: string): Promise<EmployeeDto> {
    return this.http.get<EmployeeDto>(`/employees/${uuid}`);
  }

  /** PATCH /employees/:uuid */
  async update(uuid: string, input: UpdateEmployeeInput): Promise<EmployeeDto> {
    return this.http.patch<EmployeeDto>(`/employees/${uuid}`, input);
  }

  /** DELETE /employees/:uuid */
  async remove(uuid: string): Promise<void> {
    await this.http.del(`/employees/${uuid}`);
  }

  /** POST /employees/:uuid/user */
  async createUser(uuid: string, input: CreateUserForEmployeeInput): Promise<UserDto> {
    return this.http.post<UserDto>(`/employees/${uuid}/user`, input);
  }

  /** GET /employees/:uuid/sites */
  async listSites(uuid: string): Promise<EmployeeSiteAssignmentDto[]> {
    return this.http.get<EmployeeSiteAssignmentDto[]>(`/employees/${uuid}/sites`);
  }

  /** POST /employees/:uuid/sites */
  async assignSite(uuid: string, input: AssignEmployeeToSiteInput): Promise<EmployeeSiteAssignmentDto> {
    return this.http.post<EmployeeSiteAssignmentDto>(`/employees/${uuid}/sites`, input);
  }

  /** DELETE /employees/:uuid/sites/:siteUuid */
  async removeSite(uuid: string, siteUuid: string): Promise<void> {
    await this.http.del(`/employees/${uuid}/sites/${siteUuid}`);
  }

  /** GET /employees/:uuid/documents */
  async listDocuments(uuid: string): Promise<EmployeeDocumentDto[]> {
    return this.http.get<EmployeeDocumentDto[]>(`/employees/${uuid}/documents`);
  }

  /** POST /employees/:uuid/documents */
  async createDocument(uuid: string, input: CreateEmployeeDocumentInput): Promise<EmployeeDocumentDto> {
    return this.http.post<EmployeeDocumentDto>(`/employees/${uuid}/documents`, input);
  }
}
