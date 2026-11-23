import { readSessionToken, SESSION_COOKIE } from './session-cookie';

describe('readSessionToken', () => {
  it('reads the session cookie among others', () => {
    expect(
      readSessionToken(`NEXT_LOCALE=pl; ${SESSION_COOKIE}=abc.def.ghi; x=1`),
    ).toBe('abc.def.ghi');
  });

  it('returns null without the cookie', () => {
    expect(readSessionToken('NEXT_LOCALE=pl')).toBeNull();
    expect(readSessionToken(undefined)).toBeNull();
    expect(readSessionToken(`${SESSION_COOKIE}=`)).toBeNull();
  });
});
