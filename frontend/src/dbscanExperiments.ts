export const experimentEps = [0.1, 0.2, 0.3, 0.5, 0.7] as const

export interface DBSCANResult {
  success: true
  algorithm: 'dbscan'
  eps: number
  min_samples: number
  n_clusters: number
  labels: number[]
  event_indices: number[]
  cluster_sizes: number[]
  noise_count: number
}

export function parseMinSamples(text: string): number[] {
  const values = text.split(',').map(value => Number(value.trim()))
  if (!text.trim() || values.some(value => !Number.isSafeInteger(value) || value < 1)) {
    throw new Error('Enter positive integers separated by commas for min_samples.')
  }
  const unique = [...new Set(values)]
  if (unique.length > 5) throw new Error('Use at most 5 min_samples values per experiment.')
  return unique
}

export async function runExperiments(
  minimums: number[],
  run: (eps: number, minimum: number) => Promise<DBSCANResult>,
  receive: (result: DBSCANResult) => void,
) {
  // Sequential calls avoid running several memory-intensive DBSCAN jobs together.
  for (const minimum of minimums) {
    for (const eps of experimentEps) receive(await run(eps, minimum))
  }
}

export function summarizeExperiment(result: DBSCANResult) {
  const total = result.labels.length
  return {
    noisePercent: total ? result.noise_count / total * 100 : 0,
    smallest: result.cluster_sizes.length ? result.cluster_sizes.reduce((min, size) => Math.min(min, size), Infinity) : null,
    largestPercent: total ? result.cluster_sizes.reduce((max, size) => Math.max(max, size), 0) / total * 100 : 0,
    smallClusters: result.cluster_sizes.filter(size => size / total < 0.01).length,
  }
}
