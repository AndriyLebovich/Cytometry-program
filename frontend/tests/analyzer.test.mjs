import assert from 'node:assert/strict'
import { test } from 'node:test'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runAnalysis, PythonAnalysisError } from '../electron/analyzer.ts'

const root = fileURLToPath(new URL('../../', import.meta.url))
const python = path.join(root, 'venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python')

test('Node launches real CLI for every algorithm and preserves complete analysis', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'fcs node '))
  const file = path.join(directory, 'дані with spaces.fcs')
  try {
    execFileSync(python, ['-c', "import flowio,sys; f=open(sys.argv[1],'wb'); flowio.create_fcs(f,[10,100,11,101,30,300,31,301],['A','B']); f.close()", file])
    for (const [algorithm, parameters, flags] of [
      ['kmeans', { n_clusters: 2 }, ['--n-clusters', '2']],
      ['dbscan', { eps: 5, min_samples: 2 }, ['--eps', '5', '--min-samples', '2']],
      ['hdbscan', { min_cluster_size: 2, min_samples: 1 }, ['--min-cluster-size', '2', '--min-samples', '1']],
    ]) {
      const result = await runAnalysis({ filePath: file, channels: ['B', 'A'], algorithm,
        parameters, standardize: false, minimumPopulationSize: 3 })
      const expected = JSON.parse(execFileSync(python, ['-m', 'backend.cli', file,
        '--channels', 'B', 'A', '--algorithm', algorithm, ...flags,
        '--no-standardize', '--minimum-population-size', '3'], { cwd: root, encoding: 'utf8' }))
      assert.deepEqual(result, expected)
      assert.deepEqual(result.preprocessing.event_indices, [0, 1, 2, 3])
    }
    for (const [request, code] of [
      [{ filePath: path.join(directory, 'missing.fcs'), channels: ['A'], algorithm: 'dbscan' }, 1],
      [{ filePath: file, channels: ['A'], algorithm: 'kmeans', parameters: { eps: 1 } }, 2],
    ]) {
      await assert.rejects(runAnalysis(request), error => error instanceof PythonAnalysisError
        && error.exitCode === code && error.stderr.length > 0)
    }
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test('spawn failure, chunked UTF-8 JSON, diagnostics and malformed output', async () => {
  const request = { filePath: 'test.fcs', channels: ['A'], algorithm: 'dbscan' }
  await assert.rejects(runAnalysis(request, { pythonPath: path.join(root, 'missing-python') }), /Cannot start Python/)
  const directory = mkdtempSync(path.join(tmpdir(), 'analyzer process '))
  try {
    // A tiny Python CLI package exercises the actual stream contract.
    const { mkdirSync } = await import('node:fs')
    mkdirSync(path.join(directory, 'backend'))
    writeFileSync(path.join(directory, 'backend', '__init__.py'), '')
    const cli = path.join(directory, 'backend', 'cli.py')
    writeFileSync(cli, `import sys\nsys.stderr.write('diagnostic')\nsys.stdout.write('{"text": "дані", "values": [')\nsys.stdout.flush()\nsys.stdout.write('1,2]}')\n`)
    assert.deepEqual(await runAnalysis(request, { pythonPath: python, projectRoot: directory }),
      { text: 'дані', values: [1, 2] })
    for (const output of ['', 'broken', 'null', '[]']) {
      writeFileSync(cli, `print(${JSON.stringify(output)})\n`)
      await assert.rejects(runAnalysis(request, { pythonPath: python, projectRoot: directory }), /Invalid JSON/)
    }
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
