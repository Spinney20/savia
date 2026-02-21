import type { Role } from '../types/user.types.js';
import { isRoleAtLeast } from '../constants/roles.js';

type Resource =
  | 'companies'
  | 'agencies'
  | 'sites'
  | 'employees'
  | 'users'
  | 'inspections'
  | 'inspection_templates'
  | 'trainings'
  | 'issues'
  | 'reports'
  | 'settings';

type Action = 'read' | 'create' | 'update' | 'delete';

/**
 * Simple permission check based on role hierarchy.
 * ADMIN and MANAGER_SSM can do everything.
 * Other roles have specific restrictions.
 */
export function canUserAccess(role: Role, resource: Resource, action: Action): boolean {
  // ADMIN and MANAGER_SSM have full access
  if (isRoleAtLeast(role, 'MANAGER_SSM')) return true;

  switch (resource) {
    case 'companies':
    case 'settings':
      return false; // only ADMIN/MANAGER_SSM

    case 'agencies':
      return action === 'read' && isRoleAtLeast(role, 'SEF_AGENTIE');

    case 'sites':
      return action === 'read';

    case 'employees':
      if (action === 'read') return isRoleAtLeast(role, 'SEF_SANTIER');
      return isRoleAtLeast(role, 'SEF_AGENTIE');

    case 'users':
      return action === 'read' && isRoleAtLeast(role, 'SEF_AGENTIE');

    case 'inspections':
      if (action === 'read') return true;
      if (action === 'create') return isRoleAtLeast(role, 'INSPECTOR_SSM');
      return isRoleAtLeast(role, 'INSPECTOR_SSM');

    case 'inspection_templates':
      return action === 'read';

    case 'trainings':
      if (action === 'read') return true;
      return isRoleAtLeast(role, 'SEF_SANTIER');

    case 'issues':
      if (action === 'read') return true;
      if (action === 'create') return true; // anyone can report
      return isRoleAtLeast(role, 'SEF_SANTIER');

    case 'reports':
      return action === 'read' && isRoleAtLeast(role, 'SEF_AGENTIE');

    default:
      return false;
  }
}
