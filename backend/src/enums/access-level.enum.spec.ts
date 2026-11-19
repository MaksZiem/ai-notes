import { AccessLevel, hasAccess } from './access-level.enum';

describe('hasAccess', () => {
  it('allows an equal level', () => {
    expect(hasAccess(AccessLevel.EDIT, AccessLevel.EDIT)).toBe(true);
  });

  it('allows a higher level', () => {
    expect(hasAccess(AccessLevel.DELETE, AccessLevel.VIEW)).toBe(true);
    expect(hasAccess(AccessLevel.EDIT, AccessLevel.VIEW)).toBe(true);
  });

  it('denies a lower level', () => {
    expect(hasAccess(AccessLevel.VIEW, AccessLevel.EDIT)).toBe(false);
    expect(hasAccess(AccessLevel.EDIT, AccessLevel.DELETE)).toBe(false);
  });
});
