import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleAnalysis } from '../dist-electron/electron/analysisIpc.js'
import { PythonAnalysisError } from '../dist-electron/electron/analyzer.js'

const request = { filePath: 'sample.fcs', channels: ['A'], algorithm: 'dbscan' }

test('compiled preload exposes fixed analysis IPC and preserves existing methods', async () => {
  let api
  const calls = []
  const response = { success: true, result: { clustering: { labels: [0, -1] } } }
  runInNewContext(readFileSync(new URL('../dist-electron/electron/preload.cjs', import.meta.url), 'utf8'), {
    exports: {}, require: name => {
      assert.equal(name, 'electron')
      return { contextBridge: { exposeInMainWorld: (name, value) => { assert.equal(name, 'electronAPI'); api = value } },
        ipcRenderer: { invoke: async (...args) => { calls.push(args); return response } } }
    },
  })
  assert.deepEqual(Object.keys(api).sort(), ['analyzeFcs', 'runPython', 'selectFcsFile'])
  assert.equal(await api.analyzeFcs(request), response)
  assert.deepEqual(calls[0], ['analyze-fcs', request])
  await api.runPython('read_fcs', { file_path: 'old.fcs' })
  await api.selectFcsFile()
  assert.equal(calls[1][0], 'run-python')
  assert.equal(calls[2][0], 'select-fcs-file')
})

test('IPC validates untrusted payloads before launching Python', async () => {
  for (const invalid of [null, [], {}, { ...request, pythonPath: 'bad' },
    { ...request, channels: ['A', 'A'] }, { ...request, standardize: 'false' },
    { ...request, algorithm: 'bad' }, { ...request, parameters: { n_clusters: 2 } },
    { ...request, parameters: { eps: Infinity } }, { ...request, minimumPopulationSize: 0 }]) {
    const result = await handleAnalysis(invalid, async () => { assert.fail('must not launch Python') })
    assert.equal(result.success, false)
    assert.match(result.error.message, /Invalid/)
  }
  const output = { labels: [0, -1], event_indices: [3, 9] }
  assert.deepEqual(await handleAnalysis(request, async value => {
    assert.deepEqual(value, request); return output
  }), { success: true, result: output })
})

test('IPC preserves Python diagnostics in a structured clone compatible envelope', async () => {
  const response = await handleAnalysis(request, async () => {
    throw new PythonAnalysisError('failed', 2, null, 'invalid channel')
  })
  assert.deepEqual(structuredClone(response), { success: false,
    error: { message: 'failed', exitCode: 2, signal: null, stderr: 'invalid channel' } })
})

test('IPC handler returns complete real Python analysis and file errors', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'fcs ipc '))
  const root = fileURLToPath(new URL('../../', import.meta.url))
  const python = path.join(root, 'venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python')
  const filePath = path.join(directory, 'дані sample.fcs')
  try {
    execFileSync(python, ['-c', "import flowio,sys; f=open(sys.argv[1],'wb'); flowio.create_fcs(f,[10,100,11,101,30,300,31,301],['A','B']); f.close()", filePath])
    for (const algorithm of ['kmeans', 'dbscan', 'hdbscan']) {
      const parameters = algorithm === 'kmeans' ? { n_clusters: 2 } : algorithm === 'dbscan' ? { min_samples: 2 } : { min_cluster_size: 2, min_samples: 1 }
      const response = await handleAnalysis({ ...request, filePath, algorithm, parameters, channels: ['B', 'A'] })
      assert.equal(response.success, true)
      assert.deepEqual(response.result.preprocessing.event_indices, [0, 1, 2, 3])
      assert.deepEqual(response.result.statistics.channels, ['B', 'A'])
      assert.equal(response.result.clustering.algorithm, algorithm)
      assert.equal(response.result.clustering.labels.length, 4)
    }
    const response = await handleAnalysis({ ...request, filePath: path.join(directory, 'missing.fcs') })
    assert.equal(response.success, false)
    assert.equal(response.error.exitCode, 1)
    assert.ok(response.error.stderr.length)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
