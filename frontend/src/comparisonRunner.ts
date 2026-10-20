import type { DBSCANResult } from './dbscanExperiments'
import type { HDBSCANResult } from './KMeansAnalysis'

export interface ComparisonParameters {
  eps: number
  dbscanMinimum: number
  minClusterSize: number
  hdbscanMinimum: number
}

export function validComparisonParameters(p: ComparisonParameters) {
  return Number.isFinite(p.eps) && p.eps > 0 &&
    [p.dbscanMinimum, p.hdbscanMinimum].every(n => Number.isSafeInteger(n) && n >= 1) &&
    Number.isSafeInteger(p.minClusterSize) && p.minClusterSize >= 2
}

export async function runDensityComparison(
  dataset: { data: number[][]; event_indices: number[] },
  p: ComparisonParameters,
  run: (command: string, payload: Record<string, unknown>) => Promise<unknown>,
  active: () => boolean = () => true,
) {
  if (!validComparisonParameters(p)) throw new Error('Invalid comparison parameters')
  if (!dataset.data.length) throw new Error('Prepare a non-empty dataset')
  const call = async (algorithm: 'dbscan' | 'hdbscan', parameters: Record<string, number>) => {
    if (!active()) throw new Error('Comparison superseded')
    const response = await run(algorithm, { data: dataset.data, event_indices: dataset.event_indices, ...parameters })
    if (!active()) throw new Error('Comparison superseded')
    if (typeof response !== 'object' || response === null || !('success' in response) || response.success !== true) {
      throw new Error(typeof response === 'object' && response !== null && 'message' in response
        ? String(response.message) : `${algorithm} failed`)
    }
    const result = response as DBSCANResult | HDBSCANResult
    if (result.algorithm !== algorithm || result.labels.length !== dataset.data.length ||
      result.event_indices.length !== dataset.event_indices.length ||
      result.event_indices.some((index, row) => index !== dataset.event_indices[row])) {
      throw new Error('Comparison requires identical retained events in identical order')
    }
    return result
  }
  // Sequential execution limits simultaneous memory use. Publish only a complete pair.
  const dbscan = await call('dbscan', { eps: p.eps, min_samples: p.dbscanMinimum })
  const hdbscan = await call('hdbscan', { min_cluster_size: p.minClusterSize, min_samples: p.hdbscanMinimum })
  return { dbscan, hdbscan }
}
