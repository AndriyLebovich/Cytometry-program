import { validPopulationMinimum } from './clusterFiltering'

export default function PopulationMinimum({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return <div>
    <label>Minimum population size (events) <input type="number" min="1" step="1" value={value}
      onChange={event => onChange(Number(event.target.value))} /></label>
    {!validPopulationMinimum(value) && <p role="alert">Enter a positive whole number. Filtering is inactive until corrected.</p>}
    <p>Clusters with fewer events become gray noise. Size is counted across all analyzed events.
      Set 1 to restore the original result. This optional size rule does not establish biological significance;
      small groups may be relevant. It is separate from HDBSCAN min_cluster_size.</p>
  </div>
}
