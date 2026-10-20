interface ClusterAssignment {
  labels: number[]
  event_indices: number[]
}

export const validPopulationMinimum = (value: number) => Number.isSafeInteger(value) && value >= 1

// Pure postprocessing of complete assignments, independent of React and Python.
// Preserve identifiers and never renumber surviving clusters.
export function filterSmallClusters<T extends ClusterAssignment>(source: T, minimum: number) {
  if (!validPopulationMinimum(minimum)) throw new Error('Minimum population size must be a positive safe integer')
  if (source.labels.length !== source.event_indices.length) throw new Error('Event mapping must match labels')
  const counts = new Map<number, number>()
  for (const label of source.labels) {
    if (!Number.isSafeInteger(label) || label < -1) throw new Error('Invalid cluster label')
    if (label >= 0) counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  const removed = new Set([...counts].filter(([, size]) => size < minimum).map(([label]) => label))
  const labels = source.labels.map(label => removed.has(label) ? -1 : label)
  const clusters = [...counts].filter(([label]) => !removed.has(label)).sort(([a], [b]) => a - b)
  return {
    ...source, labels,
    n_clusters: clusters.length,
    cluster_sizes: clusters.map(([, size]) => size),
    noise_count: labels.filter(label => label === -1).length,
    clusters: clusters.map(([label, size]) => ({ label, size })),
    removed_clusters: removed.size,
    reassigned_count: source.labels.filter(label => removed.has(label)).length,
  }
}
