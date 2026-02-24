/**
 * Escapes SQL LIKE/ILIKE wildcard characters (%, _) in user input.
 */
export function escapeLike(value: string): string {
  return value.replace(/%/g, '\\%').replace(/_/g, '\\_');
}
