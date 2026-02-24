export { ApiError } from './errors.js';
export { HttpClient } from './client.js';
export type { ApiClientConfig, TokenStorage, TokenResponse, ListParams, FileInput } from './types.js';

export { AuthEndpoints } from './endpoints/auth.js';
export { EmployeesEndpoints } from './endpoints/employees.js';
export { InspectionsEndpoints } from './endpoints/inspections.js';
export { TrainingsEndpoints } from './endpoints/trainings.js';
export { IssuesEndpoints } from './endpoints/issues.js';
export { UploadEndpoints } from './endpoints/upload.js';
export { NotificationsEndpoints } from './endpoints/notifications.js';

import type { ApiClientConfig } from './types.js';
import { HttpClient } from './client.js';
import { AuthEndpoints } from './endpoints/auth.js';
import { EmployeesEndpoints } from './endpoints/employees.js';
import { InspectionsEndpoints } from './endpoints/inspections.js';
import { TrainingsEndpoints } from './endpoints/trainings.js';
import { IssuesEndpoints } from './endpoints/issues.js';
import { UploadEndpoints } from './endpoints/upload.js';
import { NotificationsEndpoints } from './endpoints/notifications.js';

export interface ApiClient {
  readonly http: HttpClient;
  readonly auth: AuthEndpoints;
  readonly employees: EmployeesEndpoints;
  readonly inspections: InspectionsEndpoints;
  readonly trainings: TrainingsEndpoints;
  readonly issues: IssuesEndpoints;
  readonly upload: UploadEndpoints;
  readonly notifications: NotificationsEndpoints;
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  const http = new HttpClient(config);
  return {
    http,
    auth: new AuthEndpoints(http),
    employees: new EmployeesEndpoints(http),
    inspections: new InspectionsEndpoints(http),
    trainings: new TrainingsEndpoints(http),
    issues: new IssuesEndpoints(http),
    upload: new UploadEndpoints(http),
    notifications: new NotificationsEndpoints(http),
  };
}
