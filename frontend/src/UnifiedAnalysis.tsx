import { useState } from 'react'
import AutomaticClusters from './AutomaticClusters'
import PopulationWorkflow from './PopulationWorkflow'
import type { ManualWorkflow } from './PopulationWorkflow'
import type { AnalysisRequest, AnalysisResponse } from './analysisContract'

export default function UnifiedAnalysis({ file, channels, manual }: { file: string; channels: string[]; manual: ManualWorkflow }) {
  const [selected, setSelected] = useState<string[]>([])
  const [algorithm, setAlgorithm] = useState<AnalysisRequest['algorithm']>('dbscan')
  const [standardize, setStandardize] = useState(true)
  const [busy, setBusy] = useState(false)
  const [response, setResponse] = useState<AnalysisResponse | null>(null)
  const analyze = async () => {
    setBusy(true)
    setResponse(null)
    try {
      setResponse(await window.electronAPI.analyzeFcs({ filePath: file, channels: selected, algorithm, standardize }))
    } catch (error) {
      setResponse({ success: false, error: { message: String(error), exitCode: null, signal: null, stderr: '' } })
    } finally { setBusy(false) }
  }
  return <section>
    <h2>Unified file analysis</h2>
    <PopulationWorkflow file={file} manual={manual} result={response?.success ? response.result : undefined} />
    <fieldset disabled={busy}>
      <legend>Analysis channels</legend>
      {channels.map(channel => <label key={channel} style={{ marginRight: 12 }}>
        <input type="checkbox" checked={selected.includes(channel)} onChange={() => {
          setSelected(current => current.includes(channel) ? current.filter(item => item !== channel) : [...current, channel])
          setResponse(null)
        }} />{channel}
      </label>)}
      <p><label>Algorithm <select value={algorithm} onChange={event => {
        setAlgorithm(event.target.value as AnalysisRequest['algorithm']); setResponse(null)
      }}>
        <option value="kmeans">K-Means</option><option value="dbscan">DBSCAN</option><option value="hdbscan">HDBSCAN</option>
      </select></label></p>
      <label><input type="checkbox" checked={standardize} onChange={event => {
        setStandardize(event.target.checked); setResponse(null)
      }} />Standardize channels</label>
      <p>Uses Python default algorithm parameters. Detected clusters require biological validation.</p>
      <button disabled={!selected.length} onClick={analyze}>Run file analysis</button>
    </fieldset>
    {busy && <p role="status">Analyzing file...</p>}
    {response?.success === false && <p role="alert">{response.error.message}</p>}
    {response?.success === true && <><AutomaticClusters result={response.result} /><details><summary>Analysis JSON result</summary>
      <pre style={{ maxHeight: 320, overflow: 'auto' }}>{JSON.stringify(response.result, null, 2)}</pre>
    </details></>}
  </section>
}
