import { useEffect, useRef, useState } from 'react'
import type { PreprocessedDataset } from './Preprocessing'
import { parseMinSamples, runExperiments, summarizeExperiment } from './dbscanExperiments'
import type { DBSCANResult } from './dbscanExperiments'

interface KMeansResult {
  success: true
  algorithm: 'kmeans'
  n_clusters: number
  random_state: number
  n_init: number
  labels: number[]
  event_indices: number[]
  cluster_sizes: number[]
  centers: number[][]
  inertia: number
}


const color = (label: number, count: number) => label === -1 ? '#64748b' : `hsl(${label * 360 / count}, 70%, 42%)`

export default function ClusteringAnalysis({ dataset, algorithm = 'kmeans' }: { dataset: PreprocessedDataset; algorithm?: 'kmeans' | 'dbscan' }) {
  const name = algorithm === 'dbscan' ? 'DBSCAN' : 'K-Means'
  const [eps, setEps] = useState(0.5)
  const [minSamples, setMinSamples] = useState(5)
  const [count, setCount] = useState(2)
  const [result, setResult] = useState<KMeansResult | DBSCANResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [x, setX] = useState(0)
  const [y, setY] = useState(Math.min(1, dataset.channels.length - 1))
  const [minimums, setMinimums] = useState('5, 10, 20')
  const [experiments, setExperiments] = useState<DBSCANResult[]>([])
  const revision = useRef(0)
  useEffect(() => () => { revision.current += 1 }, [])

  const run = async () => {
    const current = ++revision.current
    setBusy(true)
    setResult(null)
    setError('')
    try {
      const response = await window.electronAPI.runPython(algorithm, {
        data: dataset.data, event_indices: dataset.event_indices,
        ...(algorithm === 'dbscan' ? { eps, min_samples: minSamples } : { n_clusters: count }),
      })
      if (current !== revision.current) return
      if (typeof response === 'object' && response !== null && 'success' in response && response.success === true) {
        setResult(response as KMeansResult | DBSCANResult)
      } else {
        throw new Error(typeof response === 'object' && response !== null && 'message' in response
          ? String(response.message) : `${name} failed`)
      }
    } catch (failure) {
      if (current === revision.current) setError(String(failure))
    } finally {
      if (current === revision.current) setBusy(false)
    }
  }

  const experiment = async () => {
    const current = ++revision.current
    setBusy(true)
    setError('')
    setExperiments([])
    setResult(null)
    try {
      const values = parseMinSamples(minimums)
      await runExperiments(values, async (radius, minimum) => {
        const response = await window.electronAPI.runPython('dbscan', {
          data: dataset.data, event_indices: dataset.event_indices,
          eps: radius, min_samples: minimum,
        })
        if (current !== revision.current) throw new Error('Experiment superseded')
        if (typeof response !== 'object' || response === null || !('success' in response) || response.success !== true) {
          throw new Error(typeof response === 'object' && response !== null && 'message' in response
            ? String(response.message) : 'DBSCAN experiment failed')
        }
        return response as DBSCANResult
      }, entry => {
        setExperiments(previous => [...previous, entry])
        setResult(entry)
      })
    } catch (failure) {
      if (current === revision.current) setError(String(failure))
    } finally {
      if (current === revision.current) setBusy(false)
    }
  }

  // Invert StandardScaler for comparison in original channel units; never reload FCS.
  const rawValue = (row: number[], column: number) => dataset.scaler
    ? row[column] * dataset.scaler.scale[column] + dataset.scaler.mean[column] : row[column]
  const bounds = dataset.data.reduce((range, row) => {
    const a = rawValue(row, x), b = rawValue(row, y)
    return [Math.min(range[0], a), Math.max(range[1], a), Math.min(range[2], b), Math.max(range[3], b)]
  }, [Infinity, -Infinity, Infinity, -Infinity])
  const sampleSize = Math.min(2000, dataset.data.length)
  const rows = Array.from({ length: sampleSize }, (_, index) => Math.floor(index * dataset.data.length / sampleSize))
  const plot = (colored: boolean) => <svg viewBox="0 0 460 330" role="img"
    aria-label={colored ? `${name} clusters` : 'Original retained events'} style={{ width: '100%', maxWidth: 460 }}>
    <path d="M55 15 V280 H445" fill="none" stroke="currentColor" />
    {rows.map(index => {
      const row = dataset.data[index]
      const px = bounds[1] === bounds[0] ? 250 : 55 + (rawValue(row, x) - bounds[0]) / (bounds[1] - bounds[0]) * 390
      const py = bounds[3] === bounds[2] ? 147 : 280 - (rawValue(row, y) - bounds[2]) / (bounds[3] - bounds[2]) * 265
      return <circle key={index} cx={px} cy={py} r="2" opacity="0.65"
        fill={colored && result ? color(result.labels[index], result.n_clusters) : '#64748b'}>
        <title>Event {dataset.event_indices[index]}{colored && result ? result.labels[index] === -1 ? '; noise' : `; cluster ${result.labels[index] + 1}` : ''}</title>
      </circle>
    })}
    <text x="250" y="325" textAnchor="middle">{dataset.channels[x]}</text>
    <text transform="translate(15 150) rotate(-90)" textAnchor="middle">{dataset.channels[y]}</text>
    <text x="55" y="300" fontSize="10">{bounds[0].toPrecision(4)}</text>
    <text x="445" y="300" textAnchor="end" fontSize="10">{bounds[1].toPrecision(4)}</text>
    <text x="50" y="280" textAnchor="end" fontSize="10">{bounds[2].toPrecision(3)}</text>
    <text x="50" y="20" textAnchor="end" fontSize="10">{bounds[3].toPrecision(3)}</text>
  </svg>

  return <div>
    <h3>{name}{algorithm === 'kmeans' ? ' baseline' : ' density clustering'}</h3>
    <p>{algorithm === 'dbscan'
      ? 'DBSCAN detects dense mathematical groups and marks other events as noise. Detected clusters are not biologically validated populations. eps uses the prepared dataset units.'
      : 'K-Means assigns every retained event to a mathematical cluster. It does not detect noise or validate biological populations.'}</p>
    {algorithm === 'kmeans' ? <label>Number of clusters <input disabled={busy} type="number" min="1" max={dataset.retained_count} value={count}
      onChange={event => {
        revision.current += 1
        setCount(Number(event.target.value))
        setResult(null)
        setError('')
        setBusy(false)
      }} /></label> : <>
      <label>eps <input disabled={busy} type="number" min="0" step="any" value={eps} onChange={event => {
        revision.current += 1
        setEps(Number(event.target.value))
        setResult(null)
        setError('')
        setBusy(false)
      }} /></label>
      <label>min_samples <input disabled={busy} type="number" min="1" step="1" value={minSamples} onChange={event => {
        revision.current += 1
        setMinSamples(Number(event.target.value))
        setResult(null)
        setError('')
        setBusy(false)
      }} /></label>
    </>}
    <button type="button" disabled={busy || dataset.retained_count === 0 || (algorithm === 'dbscan'
      ? !Number.isFinite(eps) || eps <= 0 || !Number.isInteger(minSamples) || minSamples < 1
      : !Number.isInteger(count) || count < 1 || count > dataset.retained_count)} onClick={run}>
      {busy ? 'Clustering…' : `Run ${name}`}
    </button>
    {algorithm === 'dbscan' && <section>
      <h4>DBSCAN parameter experiments</h4>
      <p>Compare eps 0.1, 0.2, 0.3, 0.5 and 0.7 on the same complete prepared dataset.
        Channels: {dataset.channels.join(', ')}; {dataset.standardized ? 'StandardScaler enabled' : 'original scale'}.
        Results depend on these channels and their scale.</p>
      <label>min_samples values <input disabled={busy} value={minimums}
        onChange={event => setMinimums(event.target.value)} /></label>
      <button type="button" disabled={busy || dataset.retained_count === 0} onClick={experiment}>
        {busy ? 'Running...' : 'Run parameter experiments'}
      </button>
      <p>Increase eps to inspect reduced noise, merging groups and a possible single large cluster.
        Compare min_samples at the same eps to inspect density sensitivity. Small clusters below 1% are counted for comparison; all events remain included.
        Cluster numbers are local to each run. Inspect the scatter to assess possible merging.</p>
      {experiments.length > 0 && <>
        <p>{experiments.length} runs completed. Select a row result to inspect its clusters and noise below.
          If a run fails, completed results remain available.</p>
        <div className="table-container"><table>
          <thead><tr><th>eps</th><th>min_samples</th><th>Clusters</th><th>Noise</th><th>Noise %</th>
            <th>Smallest cluster</th><th>Clusters below 1%</th><th>Largest cluster %</th><th>Scatter</th></tr></thead>
          <tbody>{experiments.map(entry => {
            const summary = summarizeExperiment(entry)
            return <tr key={`${entry.eps}-${entry.min_samples}`}>
              <td>{entry.eps}</td><td>{entry.min_samples}</td><td>{entry.n_clusters}</td>
              <td>{entry.noise_count}</td><td>{summary.noisePercent.toFixed(2)}</td>
              <td>{summary.smallest ?? 'None'}</td><td>{summary.smallClusters}</td><td>{summary.largestPercent.toFixed(2)}</td>
              <td><button type="button" disabled={busy} aria-pressed={result === entry}
                onClick={() => setResult(entry)}>View</button></td>
            </tr>
          })}</tbody>
        </table></div>
      </>}
    </section>}
    {error && <p role="alert">{error}</p>}
    {result && <>
      {result.algorithm === 'dbscan' && <p>Displayed result: eps {result.eps}; min_samples {result.min_samples}.</p>}
      <p>{result.labels.length.toLocaleString()} events analyzed; {result.n_clusters} detected clusters.
        {result.algorithm === 'kmeans' ? ` Inertia: ${result.inertia.toPrecision(5)}.`
          : ` Noise: ${result.noise_count.toLocaleString()} events (${(result.noise_count / result.labels.length * 100).toFixed(2)}%). Noise is shown in gray.`}</p>
      <ul>{result.cluster_sizes.map((size, label) => <li key={label} style={{ color: color(label, result.n_clusters) }}>
        Detected cluster {label + 1}: {size.toLocaleString()} events ({(size / result.labels.length * 100).toFixed(2)}%)
      </li>)}</ul>
      {(['X', 'Y'] as const).map(axis => <label key={axis}>{axis} axis <select value={axis === 'X' ? x : y}
        onChange={event => (axis === 'X' ? setX : setY)(Number(event.target.value))}>
        {dataset.channels.map((channel, index) => <option key={channel} value={index}>{channel}</option>)}
      </select></label>)}
      <p>Same events and axis ranges in original channel units. Showing {sampleSize.toLocaleString()} of {dataset.retained_count.toLocaleString()} retained events; clustering uses all retained events. Removed invalid events are excluded from both plots.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <div><h4>Original scatter (retained events)</h4>{plot(false)}</div>
        <div><h4>{name} clusters{algorithm === 'dbscan' ? ' and noise' : ''}</h4>{plot(true)}</div>
      </div>
    </>}
  </div>
}
