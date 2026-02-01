export type Tile = [number, number];

export interface DominoSequenceResult {
  sequenceLength: number;
  sequenceScore: number;
  unusedScore: number;
  sequence: Tile[];
  hash: string;
  unused: number;
}

const isValidTileValue = (value: number): boolean => {
  return Number.isInteger(value) && value >= 0 && value <= 12;
};

const validateTile = (tile: unknown): tile is Tile => {
  if (!Array.isArray(tile) || tile.length !== 2) {
    return false;
  }
  return isValidTileValue(tile[0]) && isValidTileValue(tile[1]);
};

const validateTiles = (tiles: unknown[]): tiles is Tile[] => {
  return tiles.every(validateTile);
};

const remove = (tiles: Tile[], index: number): Tile[] => {
  const copy = [...tiles];
  copy.splice(index, 1);
  return copy;
};

const getTileHashValue = (tile: Tile): number => {
  const copy = [...tile];
  copy.sort((a, b) => a - b);
  // Use 3 digits for the higher number to avoid sum
  return copy.reduce((acc, item, index) => acc + item * index * 100, 0);
};

const getSequenceHashValue = (sequence: Tile[]): string => {
  const copy = [...sequence];
  const lastTile = copy.pop();
  const hashes = copy.map(getTileHashValue);
  hashes.sort((a, b) => a - b);

  // Add the last tile hash in position to avoid wrong de-duplication
  if (lastTile !== undefined) {
    hashes.push(getTileHashValue(lastTile));
  }

  return hashes.join('|');
};

const combineAll = (
  available: Tile[],
  sequence: Tile[],
  head: number,
  sequenceLength: number,
  sequenceScore: number,
  unusedScore: number
): DominoSequenceResult[] => {
  const results: DominoSequenceResult[] = [];

  for (let index = 0; index < available.length; index++) {
    const tile = available[index];
    const occupiedIndex = tile.indexOf(head);

    if (occupiedIndex === -1) {
      continue;
    }

    const free = tile[occupiedIndex === 0 ? 1 : 0];

    const sequences = combineAll(
      remove(available, index),
      [...sequence, [head, free]],
      free,
      sequenceLength + 1,
      sequenceScore + head + free,
      unusedScore - head - free
    );

    results.push(...sequences);
  }

  // Hook: If no more tiles available, return sequence
  if (results.length > 0) {
    return results;
  }

  if (sequenceLength === 0) {
    return [];
  }

  // The last one with a double cannot compose a valid sequence
  const [lastLeft, lastRight] = sequence[sequenceLength - 1];

  if (lastLeft === lastRight && available.length > 0) {
    return [];
  }

  // If there is no results, it means that this is the end of the streak
  return [
    {
      sequenceLength,
      sequenceScore,
      unusedScore,
      sequence: sequence,
      hash: getSequenceHashValue(sequence),
      unused: available.length,
    },
  ];
};

const retrieveUnique = (possibilities: DominoSequenceResult[]): DominoSequenceResult[] => {
  const uniqueHash = possibilities.reduce((acc, possibility) => {
    acc.set(possibility.hash, possibility);
    return acc;
  }, new Map<string, DominoSequenceResult>());

  return Array.from(uniqueHash.values());
};

export const combine = (available: unknown[], head: number): DominoSequenceResult[] => {
  // Input validation
  if (!Array.isArray(available)) {
    throw new Error('Available tiles must be an array');
  }

  if (!validateTiles(available)) {
    throw new Error('Invalid tiles: each tile must be a [number, number] array with values 0-12');
  }

  if (!isValidTileValue(head)) {
    throw new Error('Invalid head value: must be an integer between 0 and 12');
  }

  const totalScore = available.reduce((acc, [left, right]) => acc + left + right, 0);
  const possibilities = retrieveUnique(
    combineAll(available, [], head, 0, 0, totalScore)
  );

  possibilities.sort((a, b) =>
    b.sequenceLength === a.sequenceLength
      ? b.sequenceScore - a.sequenceScore
      : b.sequenceLength - a.sequenceLength
  );

  return possibilities;
};
