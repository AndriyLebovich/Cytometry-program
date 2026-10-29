import { buildPopulationStatistics } from './population.ts'
import type { PopulationGate, SelectedPopulation, SavedPopulation } from './population.ts'
import { parseClusterView } from './clusterView.ts'

// Manual records currently have no original event IDs. Keep that explicit so a
// future overlap comparison cannot accidentally match records by array position.
export interface WorkflowPopulation {
  id: string
  name: string
  method: 'manual' | 'automatic' | 'noise'
  sourceFile: string
  count: number
  denominator: number
  denominatorName: 'file events' | 'retained events'
  channels: readonly string[]
  statistics: ReturnType<typeof buildPopulationStatistics>
  membership: { gate: PopulationGate; eventIndices: null } | { gate: null; eventIndices: number[] }
}

export function workflowPopulations(file: string, current: SelectedPopulation | null,
  gate: PopulationGate | null, saved: readonly SavedPopulation[], result?: unknown): WorkflowPopulation[] {
  const rows: WorkflowPopulation[] = []
  const manual = (population: SelectedPopulation, boundary: PopulationGate, id: string, name: string) => {
    if (population.sourceFile !== file) throw new Error('Manual population belongs to another file')
    rows.push({ id, name, method: 'manual', sourceFile: file, count: population.events.length,
      denominator: population.sourceEventCount, denominatorName: 'file events', channels: population.channels,
      statistics: buildPopulationStatistics(population), membership: { gate: { ...boundary }, eventIndices: null } })
  }
  if (current && gate) manual(current, gate, 'manual:current', 'Current manual selection')
  for (const population of saved) manual(population, population.gate, `manual:${population.id}`, population.name)
  if (result !== undefined) {
    if (!result || typeof result !== 'object' || !('source_file' in result) || result.source_file !== file) {
      throw new Error('Automatic analysis belongs to another file')
    }
    const view = parseClusterView(result)
    for (const label of [...view.clusters.map(cluster => cluster.label), -1]) {
      const indices: number[] = []
      const events = []
      for (let i = 0; i < view.labels.length; i++) {
        if (view.labels[i] !== label) continue
        indices.push(view.indices[i])
        events.push(Object.fromEntries(view.channels.map((channel, j) => [channel, view.data[i][j]])))
      }
      rows.push({ id: `automatic:${label}`, name: label === -1 ? 'Noise (-1)' : `Detected cluster ${label}`,
        method: label === -1 ? 'noise' : 'automatic', sourceFile: file, count: indices.length,
        denominator: view.indices.length, denominatorName: 'retained events', channels: view.channels,
        statistics: buildPopulationStatistics({ sourceFile: file, sourceEventCount: view.indices.length, channels: view.channels, events }),
        membership: { gate: null, eventIndices: indices } })
    }
  }
  return rows
}
