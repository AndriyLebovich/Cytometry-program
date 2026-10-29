import { filterSmallClusters } from './clusterFiltering.ts'

export interface ClusterView {
  channels: string[]
  data: number[][]
  indices: number[]
  labels: number[]
  clusters: { label: number; size: number }[]
  colorCount: number
}
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid analysis object')
  return value as Record<string, unknown>
}
const numbers = (value: unknown): number[] => {
  if (!Array.isArray(value) || !value.every(item => typeof item === 'number' && Number.isFinite(item))) throw new Error('Invalid numerical analysis data')
  return value
}
export function parseClusterView(value: unknown): ClusterView {
  const result = object(value), prepared = object(result.preprocessing), clustering = object(result.clustering)
  const channels = prepared.channels
  if (!Array.isArray(channels) || !channels.length || !channels.every(c => typeof c === 'string') || new Set(channels).size !== channels.length) throw new Error('Invalid analysis channels')
  const indices = numbers(prepared.event_indices), mapped = numbers(clustering.event_indices), labels = numbers(clustering.labels)
  if (indices.length !== mapped.length || indices.some((id, i) => !Number.isSafeInteger(id) || id < 0 || id !== mapped[i]) || new Set(indices).size !== indices.length) throw new Error('Invalid event mapping')
  if (!Array.isArray(prepared.data) || prepared.data.length !== indices.length) throw new Error('Invalid analysis rows')
  const scaler = prepared.scaler === null ? null : object(prepared.scaler)
  const mean = scaler ? numbers(scaler.mean) : null, scale = scaler ? numbers(scaler.scale) : null
  if (scaler && (mean!.length !== channels.length || scale!.length !== channels.length || scale!.some(v => v <= 0))) throw new Error('Invalid scaler')
  if (typeof prepared.standardized !== 'boolean' ||
      (indices.length > 0 ? prepared.standardized !== (scaler !== null) : scaler !== null)) throw new Error('Inconsistent scaler')
  const data = prepared.data.map(row => {
    const values = numbers(row)
    if (values.length !== channels.length) throw new Error('Invalid channel dimensions')
    return values.map((v, i) => {
      const raw = scaler ? v * scale![i] + mean![i] : v
      if (!Number.isFinite(raw)) throw new Error('Invalid original coordinate')
      return raw
    })
  })
  const summary = filterSmallClusters({ labels, event_indices: indices }, 1)
  return { channels, data, indices, labels, clusters: summary.clusters,
    colorCount: summary.clusters.reduce((count, c) => Math.max(count, c.label + 1), 1) }
}
export function visibleRows(view: ClusterView, population: number | 'all', limit = 2000) {
  const matching = view.labels.flatMap((label, i) => population === 'all' || label === population ? [i] : [])
  const count = Math.min(limit, matching.length)
  return { total: matching.length, rows: Array.from({ length: count }, (_, i) => matching[Math.floor(i * matching.length / count)]) }
}
