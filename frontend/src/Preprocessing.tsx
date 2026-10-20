import { useRef, useState } from 'react'
import DensityComparison from './DensityComparison'
import ClusteringAnalysis from './KMeansAnalysis'

export interface PreprocessedDataset {
  success: true
  source_file: string
  channels: string[]
  data: number[][]
  event_indices: number[]
  removed_event_indices: number[]
  input_count: number
  retained_count: number
  removed_count: number
  standardized: boolean
  scaler: { mean: number[]; scale: number[] } | null
}

export default function Preprocessing({ file, channels }: { file: string; channels: string[] }) {
  const [selected, setSelected] = useState<string[]>([])
  const [standardize, setStandardize] = useState(true)
  const [dataset, setDataset] = useState<PreprocessedDataset | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const revision = useRef(0)

  const invalidate = () => {
    revision.current += 1
    setDataset(null)
    setError('')
    setBusy(false)
  }

  const prepare = async () => {
    const current = ++revision.current
    setBusy(true)
    setError('')
    setDataset(null)
    try {
      const result = await window.electronAPI.runPython('preprocess', {
        file_path: file, channels: selected, standardize,
      })
      if (current !== revision.current) return
      if (typeof result === 'object' && result !== null && 'success' in result && result.success === true) {
        setDataset(result as PreprocessedDataset)
      } else {
        throw new Error(typeof result === 'object' && result !== null && 'message' in result
          ? String(result.message) : 'Preprocessing failed')
      }
    } catch (failure) {
      if (current === revision.current) setError(String(failure))
    } finally {
      if (current === revision.current) setBusy(false)
    }
  }

  return <section className="statistics">
    <h2>Data preprocessing</h2>
    <p>Prepare all events from this file for future clustering. Manual gates remain available.</p>
    <fieldset><legend>Clustering channels</legend>
      {channels.map(channel => <label key={channel} style={{ marginRight: 16 }}>
        <input type="checkbox" checked={selected.includes(channel)} onChange={event => {
          invalidate()
          setSelected(current => event.target.checked ? [...current, channel] : current.filter(value => value !== channel))
        }} />{channel}
      </label>)}
    </fieldset>
    <label><input type="checkbox" checked={standardize} onChange={event => {
      invalidate()
      setStandardize(event.target.checked)
    }} />Standardize channels (StandardScaler)</label>
    <button type="button" disabled={busy || selected.length === 0} onClick={prepare}>
      {busy ? 'Preparing…' : 'Prepare dataset'}
    </button>
    {error && <p role="alert">{error}</p>}
    {dataset && <div>
      <p>Input: {dataset.input_count.toLocaleString()}; retained: {dataset.retained_count.toLocaleString()}; removed (NaN/∞ in selected channels): {dataset.removed_count.toLocaleString()}.</p>
      <p>{dataset.standardized ? 'StandardScaler enabled.' : 'Original numerical scale.'} Channels: {dataset.channels.join(', ')}.</p>
      {dataset.retained_count === 0 ? <p>No valid events available for clustering.</p> : <>
        <p>Dataset ready. Preview of the first 5 rows; event indices are zero-based positions in the original file.</p>
        <div className="table-container"><table>
          <thead><tr><th>Original event index</th>{dataset.channels.map(channel => <th key={channel}>{channel}</th>)}</tr></thead>
          <tbody>{dataset.data.slice(0, 5).map((row, index) => <tr key={dataset.event_indices[index]}>
            <td>{dataset.event_indices[index]}</td>{row.map((value, column) => <td key={column}>{value.toFixed(4)}</td>)}
          </tr>)}</tbody>
        </table></div>
      </>}
      <DensityComparison dataset={dataset} />
      <ClusteringAnalysis dataset={dataset} />
      <ClusteringAnalysis dataset={dataset} algorithm="dbscan" />
      <ClusteringAnalysis dataset={dataset} algorithm="hdbscan" />
    </div>}
  </section>
}
