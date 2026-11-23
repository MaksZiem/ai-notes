import { BadRequestException } from '@nestjs/common';
import { ParseIdPipe } from './parse-id.pipe';

describe('ParseIdPipe', () => {
  const pipe = new ParseIdPipe();
  const metadata = { type: 'param' as const, data: 'workoutId' };

  it('passes a valid UUID through', async () => {
    const id = '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c';
    await expect(pipe.transform(id, metadata)).resolves.toBe(id);
  });

  it('rejects anything else with INVALID_ID and the parameter name', async () => {
    const error = await pipe.transform('123', metadata).catch((e) => e);
    expect(error).toBeInstanceOf(BadRequestException);
    expect(error.getResponse()).toEqual({
      statusCode: 400,
      code: 'INVALID_ID',
      message: 'Parameter workoutId must be a UUID',
      params: { param: 'workoutId' },
    });
  });
});
