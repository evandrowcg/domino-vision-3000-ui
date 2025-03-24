import { combine } from '../../utils/tiles';

describe('combine function', () => {
  test('should return the best sequence for simple tiles', () => {
    const available = [
      [1, 2],
      [2, 3],
      [3, 4],
    ];
    const head = 1;
    const result = combine(available, head);

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].sequence).toContain('1,2'); // Ensure expected sequence format
  });

  test('should return the best sequence for complex tiles', () => {
    const available = [
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
    ];
    const head = 1;
    const result = combine(available, head);

    expect(result).toBeDefined();
    expect(result[0].sequenceLength).toBe(5);
  });

  test('should handle cases with no possible sequences', () => {
    const available = [
      [1, 2],
      [3, 4],
    ];
    const head = 5; // No matching tile
    const result = combine(available, head);

    expect(result).toBeDefined();
    expect(result.length).toBe(0);
  });

  test('should return the best sequence for a large sequence of complex tiles', () => {
    const available = [
      [1, 5],
      [0, 0],
      [3, 12],
      [0, 3],
      [0, 9],
      [2, 5],
      [8, 12],
      [1, 6],
      [1, 9],
      [6, 8],
      [3, 3],
      [9, 10],
      [3, 7],
      [0, 5],
      [0, 1],
      [12, 12],
    ];
    const head = 6;
    const result = combine(available, head);

    expect(result).toBeDefined();
    expect(result[0].sequenceLength).toBe(13);
  });

  test('should not return sequences with double values as last tile', () => {
    const available = [
      [0, 1],
      [1, 2],
      [2, 2],
    ];
    const head = 0;
    const result = combine(available, head);

    expect(result).toBeDefined();
    expect(result.length).toBe(1);
    expect(result[0].sequenceLength).toBe(2);
  });
});
