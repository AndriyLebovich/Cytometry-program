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

const { default: AutomaticClusters, ClusterScatter } = await import('../src/AutomaticClusters.tsx')
const { parseClusterView, visibleRows } = await import('../src/clusterView.ts')
const fixture = () => ({ preprocessing: { channels: ['A', 'B'], data: [[0, 0], [1, 2], [2, 3]], event_indices: [2, 5, 9], standardized: true, scaler: { mean: [10, 20], scale: [2, 3] } }, clustering: { labels: [0, 3, -1], event_indices: [2, 5, 9] } })

test('shared workflow preserves independent manual and automatic memberships and denominators', async () => {
  const { workflowPopulations } = await import('../src/workflowPopulations.ts')
  const { default: PopulationWorkflow } = await import('../src/PopulationWorkflow.tsx')
  const { createSelectedPopulation, savePopulation } = await import('../src/population.ts')
  const current = createSelectedPopulation('sample.fcs', 10, ['A', 'B'], [{ A: 12, B: 26 }])
  const gate = { xChannel: 'A', yChannel: 'B', xMin: 11, xMax: 13, yMin: 25, yMax: 27 }
  const saved = [savePopulation(current, gate, '1', 'Saved gate')]
  const result = { ...fixture(), source_file: 'sample.fcs' }
  const before = structuredClone({ current, gate, saved, result })
  const rows = workflowPopulations('sample.fcs', current, gate, saved, result)
  assert.equal(rows.length, 5)
  assert.equal(rows[0].denominator, 10)
  assert.equal(rows[0].membership.eventIndices, null)
  assert.deepEqual(rows[3].membership.eventIndices, [5])
  assert.equal(rows[3].statistics.A.mean, 12)
  assert.equal(rows[3].denominator, 3)
  assert.equal(rows[4].method, 'noise')
  assert.deepEqual({ current, gate, saved, result }, before)
  // Clearing the gate preserves the saved manual snapshot and automatic result.
  assert.equal(workflowPopulations('sample.fcs', null, null, saved, result).length, 4)
  assert.equal(workflowPopulations('sample.fcs', current, gate, saved).length, 2)
  assert.deepEqual(workflowPopulations('new.fcs', null, null, []), [])
  assert.throws(() => workflowPopulations('new.fcs', current, gate, []), /another file/)
  assert.throws(() => workflowPopulations('new.fcs', null, null, [], result), /another file/)
  const html = renderToStaticMarkup(createElement(PopulationWorkflow, { file: 'sample.fcs', manual: { current, gate, saved }, result }))
  assert.match(html, /Saved gate/)
  assert.match(html, /Detected cluster 3/)
  assert.match(html, /Noise \(-1\)/)
  assert.match(html, /10.00% of 10 file events/)
  assert.match(html, /33.33% of 3 retained events/)
  assert.equal(workflowPopulations('sample.fcs', createSelectedPopulation('sample.fcs', 0, ['A'], []), gate, [])[0].count, 0)
})
test('complete filtered labels map to original coordinates and preserve input', () => {
  const input = fixture(), before = structuredClone(input), view = parseClusterView(input)
  assert.deepEqual(view.data, [[10, 20], [12, 26], [14, 29]])
  assert.deepEqual(view.clusters, [{ label: 0, size: 1 }, { label: 3, size: 1 }])
  assert.deepEqual(input, before)
  const render = population => renderToStaticMarkup(createElement(ClusterScatter, { view, x: 0, y: 1, population }))
  const all = render('all'), noise = render(-1), cluster = render(3)
  assert.equal((all.match(/<circle/g) || []).length, 3)
  assert.equal((noise.match(/<circle/g) || []).length, 1)
  assert.match(noise, /Event 9; noise/)
  assert.match(noise, /fill="#64748b"/)
  assert.match(cluster, /Event 5; cluster label 3/)
  assert.match(cluster, /A: 12; B: 26/)
  assert.equal(cluster.match(/<circle[^>]+>/)[0], all.match(/<circle[^>]+>/g)[1])
  const panel = renderToStaticMarkup(createElement(AutomaticClusters, { result: input }))
  assert.match(panel, /Detected cluster 3/)
  assert.match(panel, /Noise \(-1\)/)
})
test('invalid payloads and mismatched mapping fail visibly instead of mislabeling events', () => {
  const mutations = [v => v.clustering.event_indices.reverse(), v => v.clustering.labels.pop(), v => v.preprocessing.data[0].pop(), v => v.preprocessing.scaler.scale.pop(), v => v.clustering.labels[0] = -2, v => v.preprocessing.data[0][0] = Infinity]
  for (const mutate of mutations) {
    const input = fixture(); mutate(input)
    assert.throws(() => parseClusterView(input))
    assert.match(renderToStaticMarkup(createElement(AutomaticClusters, { result: input })), /role="alert"/)
  }
})
test('empty, constant, single channel, all noise and complete counts beyond plot sample', () => {
  const input = fixture()
  input.preprocessing = { channels: ['A'], data: Array.from({ length: 2501 }, () => [7]), event_indices: Array.from({ length: 2501 }, (_, i) => i), standardized: false, scaler: null }
  input.clustering = { labels: Array(2501).fill(-1), event_indices: input.preprocessing.event_indices }
  const view = parseClusterView(input)
  assert.equal(visibleRows(view, -1).total, 2501)
  assert.equal(visibleRows(view, -1).rows.length, 2000)
  const html = renderToStaticMarkup(createElement(ClusterScatter, { view, x: 0, y: 0 }))
  assert.doesNotMatch(html, /NaN|Infinity/)
  assert.match(html, /cx="250" cy="147"/)
  input.preprocessing.data = []; input.preprocessing.event_indices = []
  input.clustering.labels = []; input.clustering.event_indices = []
  assert.match(renderToStaticMarkup(createElement(AutomaticClusters, { result: input })), /No retained events/)
})

