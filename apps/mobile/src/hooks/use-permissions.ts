import { canUserAccess, isRoleAtLeast } from '@ssm/shared';
import type { Role } from '@ssm/shared';
import { useAuthStore } from '@/stores/auth.store';

export { canUserAccess, isRoleAtLeast };

export function usePermission(resource: Parameters<typeof canUserAccess>[1], action: Parameters<typeof canUserAccess>[2]): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  return canUserAccess(user.user.role, resource, action);
}

export function useRole(): Role | null {
  const user = useAuthStore((s) => s.user);
  return user?.user.role ?? null;
}
