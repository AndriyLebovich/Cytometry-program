import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { download, scatterPng } from './exports'

export default function ScatterExport({ children }: { children: ReactNode }) {
  const container = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  return <div ref={container}>{children}<button disabled={busy} onClick={async () => {
    setError(''); setBusy(true)
    try {
      const svg = container.current?.querySelector('svg')
      if (!svg) throw new Error('No scatter available')
      download(await scatterPng(svg), 'scatter.png')
    } catch (cause) { setError(String(cause)) }
    finally { setBusy(false) }
  }}>Export scatter PNG</button>{error && <p role="alert">{error}</p>}</div>
}
