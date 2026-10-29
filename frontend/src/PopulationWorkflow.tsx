import { useMemo } from 'react'
import { workflowPopulations } from './workflowPopulations'
import type { PopulationGate, SelectedPopulation, SavedPopulation } from './population'

export interface ManualWorkflow {
  current: SelectedPopulation | null
  gate: PopulationGate | null
  saved: readonly SavedPopulation[]
}

export default function PopulationWorkflow({ file, manual, result }: { file: string; manual: ManualWorkflow; result?: unknown }) {
  const { current, gate, saved } = manual
  const state = useMemo(() => {
    try { return { rows: workflowPopulations(file, current, gate, saved, result), error: '' } }
    catch (error) { return { rows: [], error: String(error) } }
  }, [file, current, gate, saved, result])
  return <section><h3>Manual and automatic population workflow</h3>
    <p>Source: {file}. Apply a manual gate above or run file analysis below. Both results remain available independently.</p>
    <p>Manual percentages use all file events; automatic percentages use retained events after preprocessing. Populations may overlap; counts must not be added. Detected clusters require biological validation.</p>
    {state.error && <p role="alert">Cannot combine populations: {state.error}</p>}
    {!state.error && !state.rows.length && <p>No population results yet.</p>}
    {state.rows.map(row => <details key={row.id}><summary>{row.name} - {row.method}: {row.count} events ({(row.denominator ? row.count / row.denominator * 100 : 0).toFixed(2)}% of {row.denominator} {row.denominatorName})</summary>
      <p>Channels: {row.channels.join(', ')}. Statistics use original channel units.</p>
      {row.membership.gate && <p>Gate: {row.membership.gate.xChannel} [{row.membership.gate.xMin}, {row.membership.gate.xMax}]; {row.membership.gate.yChannel} [{row.membership.gate.yMin}, {row.membership.gate.yMax}]</p>}
      <table><thead><tr><th>Channel</th><th>Min</th><th>Max</th><th>Mean</th><th>Median</th></tr></thead><tbody>{Object.entries(row.statistics).map(([channel, stats]) => <tr key={channel}><td>{channel}</td>{(['min', 'max', 'mean', 'median'] as const).map(key => <td key={key}>{stats[key].toFixed(2)}</td>)}</tr>)}</tbody></table>
    </details>)}
  </section>
}

