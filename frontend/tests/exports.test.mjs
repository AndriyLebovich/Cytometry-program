import assert from 'node:assert/strict'
import { test } from 'node:test'
import { csv, statisticsCsv, clusteringCsv, scatterPng } from '../src/exports.ts'

test('CSV escapes text, formulas, Unicode and preserves negative numeric labels', () => {
  assert.equal(csv([['a,"b\nc', '=SUM(A1)', 'Клітини', -1, null]]), '\uFEFF"a,""b\nc","\'=SUM(A1)","Клітини","-1",""\r\n')
})

test('clustering CSV exports every original event, noise and original units without mutation', () => {
  const size = 2101
  const result = { source_file: 'sample.fcs', preprocessing: { channels: ['A'], data: Array.from({ length: size }, (_, i) => [i]), event_indices: Array.from({ length: size }, (_, i) => i * 2), standardized: true, scaler: { mean: [10], scale: [2] } }, clustering: { algorithm: 'dbscan', labels: Array.from({ length: size }, (_, i) => i === 0 ? -1 : 3), event_indices: Array.from({ length: size }, (_, i) => i * 2) } }
  const before = structuredClone(result)
  const output = clusteringCsv(result)
  assert.equal(output.split('\r\n').length, size + 2)
  assert.match(output, /"0","-1","noise","10"/)
  assert.match(output, /"4200","3","detected cluster","4210"/)
  assert.deepEqual(result, before)
  assert.throws(() => clusteringCsv({}), /Invalid/)
})

test('statistics CSV includes denominator, gate, missing statistics and unrounded values', () => {
  const output = statisticsCsv([{ id: 'manual:1', name: 'Selected', method: 'manual', sourceFile: 'sample.fcs', count: 1, denominator: 3, denominatorName: 'file events', channels: ['A', 'B'], statistics: { A: { min: 1, max: 2, mean: 1.123456789, median: 1 } }, membership: { gate: { xChannel: 'A', yChannel: 'B', xMin: 0, xMax: 2, yMin: 0, yMax: 2 }, eventIndices: null } }])
  assert.match(output, /33.33333333333333/)
  assert.match(output, /1.123456789/)
  assert.match(output, /"B","","","",""/)
  assert.match(output, /xMin/)
})

test('PNG renders SVG into a double-resolution canvas and releases its URL', async () => {
  const saved = Object.fromEntries(['document', 'Image', 'XMLSerializer'].map(key => [key, globalThis[key]]))
  const create = URL.createObjectURL, revoke = URL.revokeObjectURL
  const attributes = {}, canvas = { getContext: () => ({ fillRect() {}, drawImage() {}, set fillStyle(v) {} }), toBlob: callback => callback(new Blob(['png'], { type: 'image/png' })) }
  let revoked = false
  try {
    URL.createObjectURL = () => 'blob:test'
    URL.revokeObjectURL = () => { revoked = true }
    globalThis.XMLSerializer = class { serializeToString() { return '<svg/>' } }
    globalThis.Image = class { set src(value) { this.onload() } }
    globalThis.document = { createElement: () => canvas }
    const svg = { viewBox: { baseVal: { width: 460, height: 330 } }, cloneNode: () => ({ style: {}, setAttribute: (key, value) => { attributes[key] = value } }) }
    assert.equal((await scatterPng(svg)).type, 'image/png')
    assert.equal(canvas.width, 920)
    assert.equal(canvas.height, 660)
    assert.equal(attributes.xmlns, 'http://www.w3.org/2000/svg')
    assert.equal(revoked, true)
  } finally {
    Object.assign(globalThis, saved)
    URL.createObjectURL = create; URL.revokeObjectURL = revoke
  }
})
