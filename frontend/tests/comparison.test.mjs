import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runDensityComparison, validComparisonParameters } from '../src/comparisonRunner.ts'

const parameters = { eps: 0.5, dbscanMinimum: 5, minClusterSize: 10, hdbscanMinimum: 3 }
const dataset = { data: [[0], [1], [20]], event_indices: [2, 7, 12] }
const response = algorithm => ({ success: true, algorithm, labels: [0, 0, -1], event_indices: [2, 7, 12], n_clusters: 1, cluster_sizes: [2], noise_count: 1 })

test('comparison sends the same complete data and mapping sequentially with independent parameters', async () => {
  const before = structuredClone(dataset), calls = []
  const pair = await runDensityComparison(dataset, parameters, async (command, payload) => {
    calls.push(command)
    assert.strictEqual(payload.data, dataset.data)
    assert.strictEqual(payload.event_indices, dataset.event_indices)
    if (command === 'dbscan') {
      assert.equal(payload.eps, 0.5)
      assert.equal(payload.min_samples, 5)
    } else {
      assert.deepEqual(calls, ['dbscan', 'hdbscan'])
      assert.equal(payload.min_cluster_size, 10)
      assert.equal(payload.min_samples, 3)
    }
    return response(command)
  })
  assert.equal(pair.dbscan.algorithm, 'dbscan')
  assert.equal(pair.hdbscan.algorithm, 'hdbscan')
  assert.deepEqual(dataset, before)
})

test('comparison rejects failure or mismatched events and stops scheduling after invalidation', async () => {
  for (const bad of [{ success: false, message: 'failed' }, { ...response('dbscan'), event_indices: [7, 2, 12] }]) {
    let calls = 0
    await assert.rejects(runDensityComparison(dataset, parameters, async () => { calls++; return bad }))
    assert.equal(calls, 1)
  }
  let active = true, calls = 0
  await assert.rejects(runDensityComparison(dataset, parameters, async command => {
    calls++
    active = false
    return response(command)
  }, () => active), /superseded/)
  assert.equal(calls, 1)
  await assert.rejects(runDensityComparison(dataset, parameters, async command => command === 'dbscan'
    ? response(command) : { success: false, message: 'HDBSCAN failed' }), /HDBSCAN failed/)
})

test('comparison validates parameters and handles all-noise results', async () => {
  for (const changes of [{ eps: 0 }, { eps: Infinity }, { dbscanMinimum: 1.5 }, { minClusterSize: 1 }, { hdbscanMinimum: 0 }]) {
    assert.equal(validComparisonParameters({ ...parameters, ...changes }), false)
  }
  await assert.rejects(runDensityComparison({ data: [], event_indices: [] }, parameters, async () => {}), /non-empty/)
  const pair = await runDensityComparison(dataset, parameters, async command => ({ ...response(command),
    labels: [-1, -1, -1], n_clusters: 0, cluster_sizes: [], noise_count: 3 }))
  assert.equal(pair.hdbscan.noise_count, 3)
  assert.deepEqual(pair.dbscan.cluster_sizes, [])
})
