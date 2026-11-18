export enum AccessLevel {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
  DELETE = 'DELETE',
}

export function hasAccess(
  owned: AccessLevel,
  required: AccessLevel,
): boolean {
  const rank: Record<AccessLevel, number> = {
    [AccessLevel.VIEW]: 1,
    [AccessLevel.EDIT]: 2,
    [AccessLevel.DELETE]: 3,
  };
  return rank[owned] >= rank[required];
}