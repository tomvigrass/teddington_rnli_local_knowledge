import { shuffleArray } from '../src/core/utils/shuffleUtils';

describe('shuffleArray', () => {
  it('returns a new array with same elements', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input);
    expect(result).toHaveLength(input.length);
    expect(result.sort()).toEqual(input.sort());
  });

  it('does not mutate the input array', () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    shuffleArray(input);
    expect(input).toEqual(copy);
  });

  it('handles empty array', () => {
    expect(shuffleArray([])).toEqual([]);
  });

  it('handles single element', () => {
    expect(shuffleArray([42])).toEqual([42]);
  });

  it('produces different orderings', () => {
    const input = Array.from({ length: 20 }, (_, i) => i);
    const results = new Set<string>();
    for (let i = 0; i < 10; i++) {
      results.add(shuffleArray(input).join(','));
    }
    expect(results.size).toBeGreaterThan(1);
  });
});
