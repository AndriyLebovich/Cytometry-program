import type { WorkflowPopulation } from './workflowPopulations.ts'
import { parseClusterView } from './clusterView.ts'

// Quote every field; neutralize spreadsheet formulas in user-controlled text.
export function csv(rows: readonly (readonly unknown[])[]): string {
  return '\uFEFF' + rows.map(row => row.map(value => {
    const text = value == null ? '' : String(value)
    const safe = typeof value === 'string' && /^[\s]*[=+\-@]/.test(text) ? "'" + text : text
    return '"' + safe.replaceAll('"', '""') + '"'
  }).join(',')).join('\r\n') + '\r\n'
}

export function statisticsCsv(populations: readonly WorkflowPopulation[]): string {
  return csv([['source_file', 'population_id', 'population', 'method', 'count', 'percentage', 'denominator', 'denominator_name', 'channel', 'min', 'max', 'mean', 'median', 'gate'],
    ...populations.flatMap(p => p.channels.map(channel => {
      const s = p.statistics[channel]
      return [p.sourceFile, p.id, p.name, p.method, p.count, p.denominator ? p.count / p.denominator * 100 : 0,
        p.denominator, p.denominatorName, channel, s?.min, s?.max, s?.mean, s?.median, p.membership.gate ? JSON.stringify(p.membership.gate) : '']
    }))])
}

export function clusteringCsv(result: unknown): string {
  const view = parseClusterView(result)
  const source = result as { source_file?: unknown; clustering?: { algorithm?: unknown } }
  return csv([['source_file', 'algorithm', 'event_index', 'cluster_label', 'population', ...view.channels],
    ...view.indices.map((id, i) => [source.source_file, source.clustering?.algorithm, id, view.labels[i],
      view.labels[i] === -1 ? 'noise' : 'detected cluster', ...view.data[i]])])
}

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function scatterPng(svg: SVGSVGElement): Promise<Blob> {
  const copy = svg.cloneNode(true) as SVGSVGElement
  const { width, height } = svg.viewBox.baseVal
  if (!width || !height) throw new Error('Scatter has no dimensions')
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  copy.setAttribute('width', String(width))
  copy.setAttribute('height', String(height))
  copy.style.color = '#111827'
  copy.style.background = 'white'
  copy.style.fontFamily = 'Arial, sans-serif'
  copy.style.maxWidth = 'none'
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml' }))
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Cannot render scatter image'))
      img.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = width * 2
    canvas.height = height * 2
    const context = canvas.getContext('2d')
    if (!context) throw new Error('PNG canvas unavailable')
    context.fillStyle = 'white'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(img, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG encoding failed')), 'image/png'))
  } finally { URL.revokeObjectURL(url) }
}
