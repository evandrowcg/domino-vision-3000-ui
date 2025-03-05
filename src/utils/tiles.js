const remove = (tiles, index) => {
  const copy = [...tiles];
  copy.splice(index, 1);
  return copy;
};

const getTileHashValue = (tile) => {
  const copy = [...tile];
  copy.sort((a, b) => a - b);
  // Use 3 digits for the higher number to avoid sum
  return copy.reduce((acc, item, index) => acc + item * index * 100);
};

const getSequenceHashValue = (sequence) => {
  let copy = [...sequence];
  const lastTile = copy.pop();
  copy = copy.map(getTileHashValue);
  copy.sort((a, b) => a - b);

  // Add the last tile hash in position to avoid wrong de-duplication
  if (lastTile !== undefined) {
    copy.push(getTileHashValue(lastTile))
  }

  return copy.join('|');
};

const combineAll = (available, sequence, head, sequenceLength, sequenceScore, unusedScore) => {
  let results = [];

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
      unusedScore - head - free,
    );

    results.push(...sequences);
  }

  // Hook: If no more tiles available, return sequence
  if (results.length > 0) {
    return results;
  }

  return [
    {
      sequenceLength,
      sequenceScore,
      unusedScore,
      sequence: JSON.stringify(sequence),
      hash: getSequenceHashValue(sequence),
      unused: available.length,
    },
  ];
};

const retrieveUnique = (possibilities) => {
  const uniqueHash = possibilities.reduce((acc, possibility) => {
    acc.set(possibility.hash, possibility);
    return acc;
  }, new Map());

  return [...uniqueHash.values()];
};

export const combine = (available, head) => {
  const totalScore = available.reduce((acc, [left, right]) => acc + left + right, 0);
  const possibilities = retrieveUnique(combineAll(available, [], head, 0, 0, totalScore));
  possibilities.sort((a, b) => b.sequenceLength - a.sequenceLength);
  return possibilities;
};
