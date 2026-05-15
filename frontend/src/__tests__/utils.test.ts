/**
 * @jest-environment node
 */

describe('Utility functions', () => {
  it('should import utils module', () => {
    const utils = require('@/lib/utils');
    expect(utils).toBeDefined();
  });

  it('cn function combines class names', () => {
    const { cn } = require('@/lib/utils');
    const result = cn('foo', 'bar', false && 'baz', 'qux');
    expect(result).toContain('foo');
    expect(result).toContain('bar');
    expect(result).toContain('qux');
    expect(result).not.toContain('baz');
  });
});
