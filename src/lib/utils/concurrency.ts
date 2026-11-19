/** Like `Promise.all(items.map(work))`, but with at most `limit` running at once. Results keep the input order. */
export const mapWithConcurrency = async <Item, Result>(
  items: Item[],
  limit: number,
  work: (item: Item, index: number) => Promise<Result>,
): Promise<Result[]> => {
  const results: Result[] = new Array(items.length);
  const indexQueue = items.map((_, index) => index);

  const runWorker = async (): Promise<void> => {
    const index = indexQueue.shift();
    if (index === undefined) return;
    results[index] = await work(items[index], index);
    return runWorker();
  };

  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, runWorker));
  return results;
};

/** Splits a list into consecutive groups of `size`. */
export const chunkList = <Item>(items: Item[], size: number): Item[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));
