import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiError } from '@google/genai';
import { cosineSimilarity } from './cosine-similarity';
import { assignDefined } from './assign-defined';
import { capitalize } from './capitalize';
import { handleGeminiError } from './handle-gemini-error';
import { hashPassword } from './hash-password';

describe('cosineSimilarity', () => {
  it('returns 1 for vectors pointing the same way', () => {
    expect(cosineSimilarity([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
  });

  it('returns 0 for perpendicular vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  });

  it('returns -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 1], [-1, -1])).toBeCloseTo(-1);
  });

  it('returns 0 instead of NaN for a zero vector', () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
});

describe('assignDefined', () => {
  it('copies defined values', () => {
    const target = { title: 'Old', color: 'red' };

    assignDefined(target, { title: 'New' });

    expect(target).toEqual({ title: 'New', color: 'red' });
  });

  it('skips undefined values', () => {
    const target = { title: 'Old', color: 'red' };

    assignDefined(target, { title: undefined, color: 'blue' });

    expect(target).toEqual({ title: 'Old', color: 'blue' });
  });

  it('keeps null and empty values, because they are deliberate', () => {
    const target: { title: string; color: string | null } = {
      title: 'Old',
      color: 'red',
    };

    assignDefined(target, { title: '', color: null });

    expect(target).toEqual({ title: '', color: null });
  });
});

describe('capitalize', () => {
  it('upper-cases the first letter and lower-cases the rest', () => {
    expect(capitalize('mARKETING')).toBe('Marketing');
  });

  it('handles Polish letters', () => {
    expect(capitalize('łódź')).toBe('Łódź');
  });

  it('returns an empty string for empty input', () => {
    expect(capitalize('')).toBe('');
  });
});

describe('handleGeminiError', () => {
  it('turns a Gemini 429 into a 429 with the AI_QUOTA_EXCEEDED code', () => {
    const error = new ApiError({ message: 'quota', status: 429 });
    expect.assertions(3);

    try {
      handleGeminiError(error);
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      expect((e as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
      expect((e as HttpException).getResponse()).toMatchObject({
        code: 'AI_QUOTA_EXCEEDED',
      });
    }
  });

  it('rethrows any other error unchanged', () => {
    const error = new ApiError({ message: 'server', status: 500 });

    expect(() => handleGeminiError(error)).toThrow(error);
  });
});

describe('hashPassword', () => {
  it('returns salt.hash in hex', async () => {
    const result = await hashPassword('secret123');

    expect(result).toMatch(/^[0-9a-f]{16}\.[0-9a-f]{64}$/);
  });

  it('uses a random salt, so the same password gives different hashes', async () => {
    const first = await hashPassword('secret123');
    const second = await hashPassword('secret123');

    expect(first).not.toBe(second);
  });
});
