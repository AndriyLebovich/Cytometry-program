import { useEffect, useRef, useState } from 'react'
import ClusteringAnalysis from './KMeansAnalysis'
import type { PreprocessedDataset } from './Preprocessing'
import { runDensityComparison, validComparisonParameters } from './comparisonRunner'

export default function DensityComparison({ dataset }: { dataset: PreprocessedDataset }) {
  const [parameters, setParameters] = useState({ eps: 0.5, dbscanMinimum: 5, minClusterSize: 5, hdbscanMinimum: 5 })
  const [result, setResult] = useState<Awaited<ReturnType<typeof runDensityComparison>> | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [x, setX] = useState(0)
  const [y, setY] = useState(Math.min(1, dataset.channels.length - 1))
  const revision = useRef(0)
  useEffect(() => () => { revision.current += 1 }, [])
  const run = async () => {
    const current = ++revision.current
    setBusy(true)
    setResult(null)
    setError('')
    try {
      const pair = await runDensityComparison(dataset, parameters,
        (command, payload) => window.electronAPI.runPython(command, payload), () => current === revision.current)
      if (current === revision.current) setResult(pair)
    } catch (failure) {
      if (current === revision.current) setError(String(failure))
    } finally {
      if (current === revision.current) setBusy(false)
    }
  }
  return <section>
    <h3>DBSCAN vs HDBSCAN</h3>
    <p>Compare all {dataset.retained_count.toLocaleString()} retained events from {dataset.source_file}.
      Channels: {dataset.channels.join(', ')}; {dataset.standardized ? 'StandardScaler enabled' : 'original scale'}.
      Both algorithms use this same prepared dataset.</p>
    {([
      ['eps', 'DBSCAN eps', 0, 'any'], ['dbscanMinimum', 'DBSCAN min_samples', 1, '1'],
      ['minClusterSize', 'HDBSCAN min_cluster_size', 2, '1'], ['hdbscanMinimum', 'HDBSCAN min_samples', 1, '1'],
    ] as const).map(([key, label, min, step]) => <label key={key}>{label} <input type="number" min={min} step={step}
      disabled={busy} value={parameters[key]} onChange={event => {
        setParameters(previous => ({ ...previous, [key]: Number(event.target.value) }))
        setResult(null)
        setError('')
      }} /></label>)}
    <button type="button" disabled={busy || !dataset.retained_count || !validComparisonParameters(parameters)} onClick={run}>
      {busy ? 'Comparing...' : 'Compare DBSCAN and HDBSCAN'}</button>
    {error && <p role="alert">{error}</p>}
    {result && <>
      <div className="table-container"><table>
        <thead><tr><th>Algorithm</th><th>Clusters</th><th>Noise events</th><th>Noise %</th><th>Cluster sizes (events / % of retained)</th></tr></thead>
        <tbody>{[result.dbscan, result.hdbscan].map(entry => <tr key={entry.algorithm}>
          <td>{entry.algorithm.toUpperCase()}</td><td>{entry.n_clusters}</td><td>{entry.noise_count}</td>
          <td>{(entry.noise_count / dataset.retained_count * 100).toFixed(2)}</td>
          <td>{entry.cluster_sizes.map((size, index) => `#${index + 1}: ${size} / ${(size / dataset.retained_count * 100).toFixed(2)}%`).join('; ') || 'None'}</td>
        </tr>)}</tbody>
      </table></div>
      <p>Cluster numbers and colors are local to each algorithm; matching numbers do not identify matching populations.
        Compare separated groups, merged groups and gray noise using the shared axes below.</p>
      {(['X', 'Y'] as const).map(axis => <label key={axis}>Comparison {axis} axis <select value={axis === 'X' ? x : y}
        onChange={event => (axis === 'X' ? setX : setY)(Number(event.target.value))}>
        {dataset.channels.map((channel, index) => <option key={channel} value={index}>{channel}</option>)}
      </select></label>)}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ flex: '1 1 460px' }}><ClusteringAnalysis dataset={dataset} algorithm="dbscan" comparison={{ result: result.dbscan, x, y }} /></div>
        <div style={{ flex: '1 1 460px' }}><ClusteringAnalysis dataset={dataset} algorithm="hdbscan" comparison={{ result: result.hdbscan, x, y }} /></div>
      </div>
      <p>For the MVP, DBSCAN offers an explicit radius for controlled parameter experiments. HDBSCAN is useful
        when one radius merges dense groups or loses sparse groups as noise. Retain both for inspection;
        fewer noise events or more clusters alone do not establish a better result. Validate on representative FCS
        files and manual gates before choosing a method. Neither result is biologically validated.</p>
    </>}
  </section>
}

