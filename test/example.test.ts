import { wrapError } from '../src/utils/errors';

describe('wrapError', () => {
  it('should wrap a standard error', () => {
    const err = new Error('fail');
    const wrapped = wrapError(err);
    expect(wrapped).toBeInstanceOf(Error);
    expect(wrapped.message).toBe('fail');
  });
}); 