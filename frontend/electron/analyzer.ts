import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { AnalysisRequest } from '../src/analysisContract.js'
export type { AnalysisRequest } from '../src/analysisContract.js'

export class PythonAnalysisError extends Error {
  readonly exitCode: number | null
  readonly signal: NodeJS.Signals | null
  readonly stderr: string
  constructor(message: string, exitCode: number | null,
    signal: NodeJS.Signals | null, stderr: string) {
    super(message)
    this.name = 'PythonAnalysisError'
    this.exitCode = exitCode
    this.signal = signal
    this.stderr = stderr
  }
}

// Works both from electron/ source and dist-electron/electron/ output.
const directory = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(directory, directory.endsWith(`${path.sep}dist-electron${path.sep}electron`)
  ? '../../..' : '../..')

/** Node/main-process API. CLI owns validation and the unchanged analysis JSON schema. */
export function runAnalysis(request: AnalysisRequest, options: {
  pythonPath?: string; projectRoot?: string
} = {}): Promise<unknown> {
  const projectRoot = options.projectRoot ?? root
  const pythonPath = options.pythonPath ?? path.join(projectRoot, 'venv',
    process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python')
  const args = ['-B', '-m', 'backend.cli', path.resolve(request.filePath),
    '--channels', ...request.channels, '--algorithm', request.algorithm,
    request.standardize === false ? '--no-standardize' : '--standardize',
    '--minimum-population-size', String(request.minimumPopulationSize ?? 1)]
  for (const [name, value] of Object.entries(request.parameters ?? {})) {
    args.push(`--${name.replaceAll('_', '-')}`, String(value))
  }
  return new Promise((resolve, reject) => {
    const child = spawn(pythonPath, args, {
      cwd: projectRoot, shell: false, windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    })
    let stdout = '', stderr = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => { stdout += chunk })
    child.stderr.on('data', (chunk: string) => { stderr += chunk })
    child.on('error', error => reject(new PythonAnalysisError(
      `Cannot start Python: ${error.message}`, null, null, stderr)))
    child.on('close', (code, signal) => {
      if (code !== 0) {
        reject(new PythonAnalysisError(
          `Python analysis failed (exit code ${code}, signal ${signal ?? 'none'}): ${stderr.trim()}`,
          code, signal, stderr))
        return
      }
      try {
        const result: unknown = JSON.parse(stdout)
        if (result === null || typeof result !== 'object' || Array.isArray(result)) {
          throw new Error('Expected an analysis object')
        }
        resolve(result)
      } catch {
        reject(new PythonAnalysisError('Invalid JSON response from Python', code, signal, stderr))
      }
    })
  })
}
