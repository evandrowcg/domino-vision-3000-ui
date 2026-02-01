import { combine, Tile, DominoSequenceResult } from '../../utils/tiles';

describe('combine function', () => {
  test('should return the best sequence for simple tiles', () => {
    const available: Tile[] = [
      [1, 2],
      [2, 3],
      [3, 4],
    ];
    const head = 1;
    const result: DominoSequenceResult[] = combine(available, head);

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].sequence).toContainEqual([1, 2]);
  });

  test('should return the best sequence for complex tiles', () => {
    const available: Tile[] = [
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
    const available: Tile[] = [
      [1, 2],
      [3, 4],
    ];
    const head = 5; // No matching tile
    const result = combine(available, head);

    expect(result).toBeDefined();
    expect(result.length).toBe(0);
  });

  test('should return the best sequence for a large sequence of complex tiles', () => {
    const available: Tile[] = [
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
    const available: Tile[] = [
      [0, 1],
      [1, 2],
      [2, 2],
      [5, 3],
    ];
    const head = 0;
    const result = combine(available, head);

    expect(result).toBeDefined();
    expect(result.length).toBe(1);
    expect(result[0].sequenceLength).toBe(2);
  });

  test('should return sequences with double values as last tile if no other tile is available', () => {
    const available: Tile[] = [
      [0, 1],
      [1, 2],
      [2, 2],
    ];
    const head = 0;
    const result = combine(available, head);

    expect(result).toBeDefined();
    expect(result.length).toBe(1);
    expect(result[0].sequenceLength).toBe(3);
  });

  // Validation tests
  describe('input validation', () => {
    test('should throw error for non-array input', () => {
      expect(() => combine('not an array' as unknown as Tile[], 1)).toThrow('Available tiles must be an array');
    });

    test('should throw error for invalid tile format', () => {
      const invalid = [[1, 2, 3]] as unknown as Tile[];
      expect(() => combine(invalid, 1)).toThrow('Invalid tiles');
    });

    test('should throw error for tile values out of range', () => {
      const invalid: Tile[] = [[1, 15]];
      expect(() => combine(invalid, 1)).toThrow('Invalid tiles');
    });

    test('should throw error for negative tile values', () => {
      const invalid: Tile[] = [[-1, 5]];
      expect(() => combine(invalid, 1)).toThrow('Invalid tiles');
    });

    test('should throw error for invalid head value', () => {
      const available: Tile[] = [[1, 2]];
      expect(() => combine(available, 15)).toThrow('Invalid head value');
    });

    test('should throw error for negative head value', () => {
      const available: Tile[] = [[1, 2]];
      expect(() => combine(available, -1)).toThrow('Invalid head value');
    });

    test('should handle empty array', () => {
      const result = combine([], 1);
      expect(result).toEqual([]);
    });
  });

  // Result structure tests
  describe('result structure', () => {
    test('should return results with correct structure', () => {
      const available: Tile[] = [[1, 2], [2, 3]];
      const result = combine(available, 1);

      expect(result[0]).toHaveProperty('sequenceLength');
      expect(result[0]).toHaveProperty('sequenceScore');
      expect(result[0]).toHaveProperty('unusedScore');
      expect(result[0]).toHaveProperty('sequence');
      expect(result[0]).toHaveProperty('hash');
      expect(result[0]).toHaveProperty('unused');
    });

    test('should calculate sequence score correctly', () => {
      const available: Tile[] = [[1, 2], [2, 3]];
      const result = combine(available, 1);

      // Sequence [1,2], [2,3] should have score 1+2+2+3 = 8
      expect(result[0].sequenceScore).toBe(8);
    });

    test('should calculate unused score correctly', () => {
      const available: Tile[] = [[1, 2], [5, 6]];
      const result = combine(available, 1);

      // Total is 1+2+5+6=14, used is 1+2=3, unused is 11
      expect(result[0].unusedScore).toBe(11);
      expect(result[0].unused).toBe(1);
    });

    test('should sort results by sequence length descending', () => {
      const available: Tile[] = [[1, 2], [2, 3], [5, 6]];
      const result = combine(available, 1);

      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].sequenceLength).toBeGreaterThanOrEqual(result[i].sequenceLength);
      }
    });
  });
});
