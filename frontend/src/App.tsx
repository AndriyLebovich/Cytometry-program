import { useState } from 'react'
import './App.css'

declare global {
  interface Window {
    electronAPI: {
      runPython: (
        command: string,
        data?: unknown
      ) => Promise<unknown>

      selectFcsFile: () => Promise<string | null>
    }
  }
}

interface FcsStatistics {
  min: number
  max: number
  mean: number
  median: number
}

interface ScatterPoint {
  x: number
  y: number
}

interface FcsResult {
  success: boolean
  file: string
  events: number
  channels: string[]
  statistics: Record<string, FcsStatistics>
  plot_data?: number[]
}

interface ScatterResult {
  success: boolean
  x_channel: string
  y_channel: string
  points: ScatterPoint[]
}

interface GateResult {
  success: boolean
  count: number
  total: number
  percentage: number
  x_min: number
  x_max: number
  y_min: number
  y_max: number
}

function App() {
  const [fcsResult, setFcsResult] = useState<FcsResult | null>(null)
  const [fcsError, setFcsError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState('')
  const [xChannel, setXChannel] = useState('')
  const [yChannel, setYChannel] = useState('')
  const [scatterData, setScatterData] = useState<ScatterResult | null>(null)
  // State for create gate
  const [gate, setGate] = useState<{
  x1: number
  y1: number
  x2: number
  y2: number
} | null>(null)

const [isDrawingGate, setIsDrawingGate] = useState(false)
const [gateStart, setGateStart] = useState<{
  x: number
  y: number
} | null>(null)

const [gateResult, setGateResult] = useState<GateResult | null>(null)

  const testFcs = async () => {
    setFcsError('')
    setFcsResult(null)
    setLoading(true)

    try {
      const filePath = await window.electronAPI.selectFcsFile()

      if (!filePath) {
        setLoading(false)
        return
      }

      const result = await window.electronAPI.runPython('read_fcs', {
        file_path: filePath,
      })

      if (
        typeof result === 'object' &&
        result !== null &&
        'success' in result &&
        result.success === true
      ) {
        setFcsResult(result as FcsResult)
      } else {
        if (
          typeof result === 'object' &&
          result !== null &&
          'message' in result
        ) {
          setFcsError(String(result.message))
        } else {
          setFcsError('Failed to read FCS file')
        }
      }
    } catch (error) {
      setFcsError(String(error))
    } finally {
      setLoading(false)
    }
  }

const loadChannelData = async (channel: string) => {
  if (!fcsResult) {
    return
  }

  try {
    setFcsError('')

    const result = await window.electronAPI.runPython('read_fcs', {
      file_path: fcsResult.file,
      selected_channel: channel,
    })

    if (
      typeof result === 'object' &&
      result !== null &&
      'success' in result &&
      result.success === true
    ) {
      const channelResult = result as FcsResult

      setFcsResult((current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          plot_data: channelResult.plot_data,
        }
      })

      console.log(
        'Loaded plot data:',
        channelResult.plot_data?.length
      )
    } else {
      setFcsError('Failed to load channel data')
    }
  } catch (error) {
    setFcsError(String(error))
  }
}

const loadScatterData = async (
  xChannelValue: string,
  yChannelValue: string
) => {
  if (!fcsResult || !xChannelValue || !yChannelValue) {
    return
  }

  try {
    setFcsError('')

    const result = await window.electronAPI.runPython(
      'read_scatter',
      {
        file_path: fcsResult.file,
        x_channel: xChannelValue,
        y_channel: yChannelValue,
      }
    )

    if (
      typeof result === 'object' &&
      result !== null &&
      'success' in result &&
      result.success === true
    ) {
      setScatterData(result as ScatterResult)

      console.log(
        'Loaded scatter points:',
        (result as ScatterResult).points.length
      )
    } else {
      setFcsError('Failed to load scatter data')
    }
  } catch (error) {
    setFcsError(String(error))
  }
}

const buildHistogram = (values: number[], binCount = 50) => {
  if (values.length === 0) {
    return []
  }

  const min = Math.min(...values)
  const max = Math.max(...values)

  if (min === max) {
    return [
      {
        start: min,
        end: max,
        count: values.length,
      },
    ]
  }

  const binWidth = (max - min) / binCount

  const bins = Array.from(
    { length: binCount },
    (_, index) => ({
      start: min + index * binWidth,
      end: min + (index + 1) * binWidth,
      count: 0,
    })
  )

  for (const value of values) {
    let index = Math.floor((value - min) / binWidth)

    if (index >= binCount) {
      index = binCount - 1
    }

    bins[index].count += 1
  }

  return bins
}

const histogram =
  fcsResult?.plot_data
    ? buildHistogram(fcsResult.plot_data)
    : []

const maxHistogramCount =
  histogram.length > 0
    ? Math.max(...histogram.map((bin) => bin.count))
    : 0

  // To create gate
    const handleScatterMouseDown = (
  event: React.MouseEvent<SVGSVGElement>
) => {
  const svg = event.currentTarget
  const rect = svg.getBoundingClientRect()

  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  setGateStart({ x, y })
  setIsDrawingGate(true)
  setGate(null)
}
const handleScatterMouseUp = (
  event: React.MouseEvent<SVGSVGElement>
) => {
  if (!gateStart) {
    return
  }

  const svg = event.currentTarget
  const rect = svg.getBoundingClientRect()

  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  setGate({
    x1: gateStart.x,
    y1: gateStart.y,
    x2: x,
    y2: y,
  })

  setIsDrawingGate(false)
  setGateStart(null)
}
const handleScatterMouseMove = (
  event: React.MouseEvent<SVGSVGElement>
) => {
  if (!isDrawingGate || !gateStart) {
    return
  }

  const svg = event.currentTarget
  const rect = svg.getBoundingClientRect()

  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  setGate({
    x1: gateStart.x,
    y1: gateStart.y,
    x2: x,
    y2: y,
  })
}

const applyGate = async () => {
  if (!fcsResult || !scatterData || !gate) {
    return
  }

  const xValues = scatterData.points.map((point) => point.x)
  const yValues = scatterData.points.map((point) => point.y)

  const minX = Math.min(...xValues)
  const maxX = Math.max(...xValues)
  const minY = Math.min(...yValues)
  const maxY = Math.max(...yValues)

  const width = 800
  const height = 540

  const left = 70
  const right = 30
  const top = 30
  const bottom = 70

  const plotWidth = width - left - right
  const plotHeight = height - top - bottom

  const xFromPixel = (pixel: number) =>
    minX +
    ((pixel - left) / plotWidth) *
      (maxX - minX)

  const yFromPixel = (pixel: number) =>
    minY +
    ((height - bottom - pixel) / plotHeight) *
      (maxY - minY)

  const pixelX1 = Math.min(gate.x1, gate.x2)
  const pixelX2 = Math.max(gate.x1, gate.x2)

  const pixelY1 = Math.min(gate.y1, gate.y2)
  const pixelY2 = Math.max(gate.y1, gate.y2)

  const gateX1 = xFromPixel(pixelX1)
  const gateX2 = xFromPixel(pixelX2)

  const gateY1 = yFromPixel(pixelY2)
  const gateY2 = yFromPixel(pixelY1)

  const xMin = Math.min(gateX1, gateX2)
  const xMax = Math.max(gateX1, gateX2)

  const yMin = Math.min(gateY1, gateY2)
  const yMax = Math.max(gateY1, gateY2)

  try {
    setFcsError('')

    const result = await window.electronAPI.runPython(
      'apply_gate',
      {
        file_path: fcsResult.file,
        x_channel: scatterData.x_channel,
        y_channel: scatterData.y_channel,
        x_min: xMin,
        x_max: xMax,
        y_min: yMin,
        y_max: yMax,
      }
    )

    if (
      typeof result === 'object' &&
      result !== null &&
      'success' in result &&
      result.success === true
    ) {
      const gateResult = result as GateResult

          setGateResult({
            success: true,
            count: gateResult.count,
            total: gateResult.total,
            percentage: gateResult.percentage,
            x_min: xMin,
            x_max: xMax,
            y_min: yMin,
            y_max: yMax,
          })
    } else {
      setFcsError('Failed to apply gate')
    }
  } catch (error) {
    setFcsError(String(error))
  }
}

const clearGate = () => {
  setGate(null)
  setGateResult(null)
}

  return (
    <main className="app">
      <header className="header">
        <h1>FCS Analyzer</h1>
        <p>Flow cytometry data analysis</p>
      </header>

      <section className="controls">
        <button
          type="button"
          onClick={testFcs}
          disabled={loading}
        >
          {loading ? 'Reading FCS file...' : 'Open FCS file'}
        </button>
      </section>

      {fcsError && (
        <section className="error">
          <strong>Error:</strong> {fcsError}
        </section>
      )}

      {fcsResult && (
        <>
          <section className="file-info">
            <h2>FCS File</h2>

            <p>
              <strong>File:</strong> {fcsResult.file}
            </p>

            <p>
              <strong>Events:</strong>{' '}
              {fcsResult.events.toLocaleString()}
            </p>

            <p>
              <strong>Channels:</strong> {fcsResult.channels.length}
            </p>
          </section>

          <section className="channel-selector">
  <h2>Channel Analysis</h2>

  <label htmlFor="channel-select">
    Select channel:
  </label>

  <select
  id="channel-select"
  value={selectedChannel}
  onChange={(event) => {
    const channel = event.target.value

    setSelectedChannel(channel)

    if (channel) {
      loadChannelData(channel)
    }
  }}
>
    <option value="">Select a channel</option>

    {fcsResult.channels.map((channel) => (
      <option key={channel} value={channel}>
        {channel}
      </option>
    ))}
  </select>

  {selectedChannel &&
    fcsResult.statistics[selectedChannel] && (
      <div className="selected-statistics">
        <p>
          <strong>Min:</strong>{' '}
          {fcsResult.statistics[selectedChannel].min.toFixed(2)}
        </p>

        <p>
          <strong>Max:</strong>{' '}
          {fcsResult.statistics[selectedChannel].max.toFixed(2)}
        </p>

        <p>
          <strong>Mean:</strong>{' '}
          {fcsResult.statistics[selectedChannel].mean.toFixed(2)}
        </p>

        <p>
          <strong>Median:</strong>{' '}
          {fcsResult.statistics[selectedChannel].median.toFixed(2)}
        </p>
      </div>
    )}
</section>

{scatterData && scatterData.points.length > 0 && (
  <section className="scatter-section">
    <h2>
      {scatterData.x_channel} × {scatterData.y_channel}
    </h2>

    <div className="scatter-container">
      <svg
        className="scatter-plot"
        viewBox="0 0 800 540"
        preserveAspectRatio="none"
        onMouseDown={handleScatterMouseDown}
        onMouseMove={handleScatterMouseMove}
        onMouseUp={handleScatterMouseUp}
        >
        {(() => {
          const xValues = scatterData.points.map((point) => point.x)
          const yValues = scatterData.points.map((point) => point.y)

          const minX = Math.min(...xValues)
          const maxX = Math.max(...xValues)
          const minY = Math.min(...yValues)
          const maxY = Math.max(...yValues)

          const width = 800
          const height = 540

          const left = 70
          const right = 30
          const top = 30
          const bottom = 70

          const plotWidth = width - left - right
          const plotHeight = height - top - bottom

          const xScale = (value: number) =>
            left +
            ((value - minX) / (maxX - minX)) *
              plotWidth

          const yScale = (value: number) =>
            height -
            bottom -
            ((value - minY) / (maxY - minY)) *
              plotHeight

          const gridLines = 5

          return (
            <>
              {/* Grid */}
              {Array.from(
                { length: gridLines + 1 },
                (_, index) => {
                  const ratio = index / gridLines

                  const x = left + ratio * plotWidth
                  const y = top + ratio * plotHeight

                  return (
                    <g key={`grid-${index}`}>
                      <line
                        x1={x}
                        y1={top}
                        x2={x}
                        y2={height - bottom}
                        stroke="#ddd"
                      />

                      <line
                        x1={left}
                        y1={y}
                        x2={width - right}
                        y2={y}
                        stroke="#ddd"
                      />
                    </g>
                  )
                }
              )}

              {/* Points */}
              {scatterData.points.map((point, index) => (
                <circle
                  key={index}
                  cx={xScale(point.x)}
                  cy={yScale(point.y)}
                  r="2"
                  opacity="0.5"
                >
                  <title>
                    {scatterData.x_channel}: {point.x.toFixed(2)}
                    {'\n'}
                    {scatterData.y_channel}: {point.y.toFixed(2)}
                  </title>
                </circle>
              ))}

              {/* Gate */}
              {gate && (
                <rect
                  x={Math.min(gate.x1, gate.x2)}
                  y={Math.min(gate.y1, gate.y2)}
                  width={Math.abs(gate.x2 - gate.x1)}
                  height={Math.abs(gate.y2 - gate.y1)}
                  fill="none"
                  stroke="#000"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  pointerEvents="none"
                />
              )}

              {/* X axis */}
              <line
                x1={left}
                y1={height - bottom}
                x2={width - right}
                y2={height - bottom}
                stroke="#333"
              />

              {/* Y axis */}
              <line
                x1={left}
                y1={top}
                x2={left}
                y2={height - bottom}
                stroke="#333"
              />

              {/* X axis labels */}
              <text
                x={left}
                y={height - 35}
                textAnchor="middle"
                fontSize="12"
              >
                {minX.toFixed(0)}
              </text>

              <text
                x={width - right}
                y={height - 35}
                textAnchor="middle"
                fontSize="12"
              >
                {maxX.toFixed(0)}
              </text>

              {/* Y axis labels */}
              <text
                x={left - 10}
                y={height - bottom}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="12"
              >
                {minY.toFixed(0)}
              </text>

              <text
                x={left - 10}
                y={top}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="12"
              >
                {maxY.toFixed(0)}
              </text>

              {/* X axis title */}
              <text
                x={left + plotWidth / 2}
                y={height - 10}
                textAnchor="middle"
                fontSize="16"
                fontWeight="600"
              >
                {scatterData.x_channel}
              </text>

              {/* Y axis title */}
              <text
                x="18"
                y={top + plotHeight / 2}
                textAnchor="middle"
                fontSize="16"
                fontWeight="600"
                transform={`rotate(-90 18 ${top + plotHeight / 2})`}
              >
                {scatterData.y_channel}
              </text>
            </>
          )
        })()}
      </svg>
      {gate && (
            <div className="gate-actions">
              <button
                type="button"
                onClick={applyGate}
                className="apply-gate-button"
              >
                Apply Gate
              </button>

              <button
                type="button"
                onClick={clearGate}
                className="clear-gate-button"
              >
                Clear Gate
              </button>
            </div>
          )}
    </div>

    <p className="scatter-info">
      Showing {scatterData.points.length.toLocaleString()} sampled events
    </p>
    {gateResult && (
  <div className="gate-result">
    <h3>Gate Result</h3>

    <p>
      <strong>{scatterData.x_channel}</strong>:
      {' '}
      {gateResult.x_min.toFixed(0)}
      {' – '}
      {gateResult.x_max.toFixed(0)}
    </p>

    <p>
      <strong>{scatterData.y_channel}</strong>:
      {' '}
      {gateResult.y_min.toFixed(0)}
      {' – '}
      {gateResult.y_max.toFixed(0)}
    </p>

    <p>
      Events inside gate:{' '}
      <strong>
        {gateResult.count.toLocaleString()}
      </strong>
    </p>

    <p>
      Total events:{' '}
      <strong>
        {gateResult.total.toLocaleString()}
      </strong>
    </p>

    <p>
      Percentage:{' '}
      <strong>
        {gateResult.percentage.toFixed(2)}%
      </strong>
    </p>
  </div>
)}
  </section>
)}

<section className="scatter-controls">
  <h2>2D Scatter Plot</h2>

  <div className="scatter-selectors">
    <label>
      X Axis

      <select
        value={xChannel}
        onChange={(event) => {
          const channel = event.target.value

          setXChannel(channel)

          if (channel && yChannel) {
            loadScatterData(channel, yChannel)
          }
        }}
      >
        <option value="">Select X channel</option>

        {fcsResult.channels.map((channel) => (
          <option key={channel} value={channel}>
            {channel}
          </option>
        ))}
      </select>
    </label>

    <label>
      Y Axis

      <select
        value={yChannel}
        onChange={(event) => {
          const channel = event.target.value

          setYChannel(channel)

          if (xChannel && channel) {
            loadScatterData(xChannel, channel)
          }
        }}
      >
        <option value="">Select Y channel</option>

        {fcsResult.channels.map((channel) => (
          <option key={channel} value={channel}>
            {channel}
          </option>
        ))}
      </select>
    </label>
  </div>
</section>

{selectedChannel && histogram.length > 0 && (
  <section className="histogram-section">
    <h2>{selectedChannel} Distribution</h2>

    <div className="histogram">
      {histogram.map((bin, index) => {
        const height =
          maxHistogramCount > 0
            ? (bin.count / maxHistogramCount) * 100
            : 0

        return (
          <div
            key={index}
            className="histogram-bar"
            style={{ height: `${height}%` }}
            title={`${bin.start.toFixed(0)} – ${bin.end.toFixed(0)}: ${bin.count} events`}
          />
        )
      })}
    </div>

    <div className="histogram-axis">
      <span>
        {histogram[0].start.toFixed(0)}
      </span>

      <span>
        {histogram[histogram.length - 1].end.toFixed(0)}
      </span>
    </div>

    <p className="histogram-info">
      Showing {fcsResult.plot_data?.length.toLocaleString()} sampled events
    </p>
  </section>
)}

          <section className="channels">
            <h2>Channels</h2>

            <ul>
              {fcsResult.channels.map((channel) => (
                <li key={channel}>{channel}</li>
              ))}
            </ul>
          </section>

          <section className="statistics">
            <h2>Statistics</h2>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th>Min</th>
                    <th>Max</th>
                    <th>Mean</th>
                    <th>Median</th>
                  </tr>
                </thead>

                <tbody>
                  {Object.entries(fcsResult.statistics).map(
                    ([channel, statistics]) => (
                      <tr key={channel}>
                        <td>{channel}</td>
                        <td>{statistics.min.toFixed(2)}</td>
                        <td>{statistics.max.toFixed(2)}</td>
                        <td>{statistics.mean.toFixed(2)}</td>
                        <td>{statistics.median.toFixed(2)}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {!fcsResult && !fcsError && !loading && (
        <section className="empty-state">
          <h2>No FCS file selected</h2>
          <p>Open an FCS file to start the analysis.</p>
        </section>
      )}
    </main>
  )
}

export default App