import { useState } from 'react'
import { clusterColor } from './clusterColor'
import { parseClusterView, visibleRows } from './clusterView'
import type { ClusterView } from './clusterView'

export function ClusterScatter({ view, x, y, population = 'all' }: { view: ClusterView; x: number; y: number; population?: number | 'all' }) {
  const { rows, total } = visibleRows(view, population)
  const bounds = view.data.reduce((b, row) => [Math.min(b[0], row[x]), Math.max(b[1], row[x]), Math.min(b[2], row[y]), Math.max(b[3], row[y])], [Infinity, -Infinity, Infinity, -Infinity])
  if (!view.data.length) return <p>No retained events.</p>
  return <><p>Showing {rows.length} of {total} matching events; {view.data.length} retained events in total. Counts use complete assignments. Axes use original channel units and shared ranges.</p>
    <svg viewBox="0 0 460 330" role="img" aria-label="Automatic clusters and noise" style={{ width: '100%', maxWidth: 600 }}>
      <path d="M55 15 V280 H445" fill="none" stroke="currentColor" />
      {rows.map(i => <circle key={view.indices[i]} cx={bounds[0] === bounds[1] ? 250 : 55 + (view.data[i][x] - bounds[0]) / (bounds[1] - bounds[0]) * 390}
        cy={bounds[2] === bounds[3] ? 147 : 280 - (view.data[i][y] - bounds[2]) / (bounds[3] - bounds[2]) * 265} r="2" opacity="0.65" fill={clusterColor(view.labels[i], view.colorCount)}>
        <title>{`Event ${view.indices[i]}; ${view.labels[i] === -1 ? 'noise' : `cluster label ${view.labels[i]}`}; ${view.channels[x]}: ${view.data[i][x]}; ${view.channels[y]}: ${view.data[i][y]}`}</title>
      </circle>)}
      <text x="250" y="325" textAnchor="middle">{view.channels[x]}</text>
      <text transform="translate(15 150) rotate(-90)" textAnchor="middle">{view.channels[y]}</text>
      <text x="55" y="300" fontSize="10">{bounds[0].toPrecision(4)}</text><text x="445" y="300" textAnchor="end" fontSize="10">{bounds[1].toPrecision(4)}</text>
      <text x="50" y="280" textAnchor="end" fontSize="10">{bounds[2].toPrecision(4)}</text><text x="50" y="20" textAnchor="end" fontSize="10">{bounds[3].toPrecision(4)}</text>
    </svg></>
}
function Populations({ view }: { view: ClusterView }) {
  const [x, setX] = useState(0), [y, setY] = useState(Math.min(1, view.channels.length - 1))
  const [population, setPopulation] = useState<number | 'all'>('all')
  const populations = [...view.clusters, { label: -1, size: view.labels.filter(l => l === -1).length }]
  return <section><h3>Detected populations and noise</h3>
    <p>Labels are original zero-based algorithm identifiers. Noise has label -1 and is gray. Detected clusters require biological validation.</p>
    <table><thead><tr><th>Population / label</th><th>Events</th><th>% retained</th><th>Inspect</th></tr></thead><tbody>
      {populations.map(({ label, size }) => <tr key={label}><td style={{ color: clusterColor(label, view.colorCount) }}>{label === -1 ? 'Noise (-1)' : `Detected cluster ${label}`}</td><td>{size}</td><td>{(view.labels.length ? size / view.labels.length * 100 : 0).toFixed(2)}</td><td><button aria-pressed={population === label} onClick={() => setPopulation(label)}>View {label === -1 ? 'noise' : `cluster ${label}`}</button></td></tr>)}
    </tbody></table>
    <button aria-pressed={population === 'all'} onClick={() => setPopulation('all')}>View all events</button>
    {(['X', 'Y'] as const).map(axis => <label key={axis}>{axis} axis <select value={axis === 'X' ? x : y} onChange={e => (axis === 'X' ? setX : setY)(Number(e.target.value))}>{view.channels.map((c, i) => <option key={c} value={i}>{c}</option>)}</select></label>)}
    <ClusterScatter view={view} x={x} y={y} population={population} />
  </section>
}
export default function AutomaticClusters({ result }: { result: unknown }) {
  let view: ClusterView
  try { view = parseClusterView(result) } catch (error) { return <p role="alert">Cannot visualize analysis: {String(error)}</p> }
  return <Populations view={view} />
}

