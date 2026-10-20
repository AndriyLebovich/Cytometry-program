import assert from 'node:assert/strict'
import { test } from 'node:test'
import { registerHooks } from 'node:module'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// Load actual TSX components for an SVG regression check without a browser.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
      for (const extension of ['.tsx', '.ts']) {
        try { return next(specifier + extension, context) } catch (error) {
          if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error
        }
      }
    }
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url.endsWith('.tsx')) return { format: 'module', shortCircuit: true,
      source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext },
      }).outputText }
    return next(url, context)
  },
})
const { default: ClusteringAnalysis } = await import('../src/KMeansAnalysis.tsx')

test('actual scatter turns tiny clusters gray and preserves coordinates, IDs and survivor colors', () => {
  const dataset = { channels: ['A', 'B'], data: [[0, 0], [2, 2], [3, 3], [8, 8]],
    event_indices: [2, 5, 9, 11], retained_count: 4, scaler: null }
  for (const algorithm of ['dbscan', 'hdbscan']) {
    const result = { algorithm, labels: [0, 1, 1, -1], event_indices: dataset.event_indices,
      n_clusters: 2, cluster_sizes: [1, 2], noise_count: 1 }
    const render = minimum => renderToStaticMarkup(createElement(ClusteringAnalysis, {
      dataset, algorithm, comparison: { result, x: 0, y: 1, minimum },
    }))
    const original = render(1), filtered = render(2)
    const circles = markup => [...markup.matchAll(/<circle[^>]*>.*?<\/circle>/g)].map(match => match[0])
    const before = circles(original), after = circles(filtered)
    assert.equal(after.length, 4)
    assert.match(after[0], /fill="#64748b"/)
    assert.match(after[0], /Event 2; noise/)
    assert.equal(after[1], before[1])
    assert.equal(after[2], before[2])
    assert.equal(after[3], before[3])
    assert.match(filtered, /1 detected clusters/)
    assert.match(filtered, /Noise: 2 events \(50.00%\)/)
    assert.match(filtered, /Detected cluster 2/)
    assert.equal(render(1), original)
  }
})
