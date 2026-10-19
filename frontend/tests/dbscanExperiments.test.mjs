import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseMinSamples, runExperiments, summarizeExperiment } from '../src/dbscanExperiments.ts'

test('experiment minimums are validated and deduplicated', () => {
  assert.deepEqual(parseMinSamples('5, 10, 5,20'), [5, 10, 20])
  for (const value of ['', '0', '-1', '2.5', 'NaN', '5,', '1,2,3,4,5,6']) {
    assert.throws(() => parseMinSamples(value))
  }
})

test('all requested eps and minimums run sequentially with completed results preserved on failure', async () => {
  const calls = [], received = []
  let active = false
  await runExperiments([5, 10], async (eps, minimum) => {
    assert.equal(active, false)
    active = true
    await Promise.resolve()
    calls.push([eps, minimum])
    active = false
    return { eps, min_samples: minimum }
  }, result => received.push(result))
  assert.deepEqual(calls, [5, 10].flatMap(minimum => [0.1, 0.2, 0.3, 0.5, 0.7].map(eps => [eps, minimum])))
  assert.equal(received.length, 10)
  const partial = []
  await assert.rejects(runExperiments([5], async eps => {
    if (eps === 0.3) throw new Error('failed')
    return { eps }
  }, result => partial.push(result)), /failed/)
  assert.deepEqual(partial, [{ eps: 0.1 }, { eps: 0.2 }])
})

test('summary handles noise, small clusters and single large cluster without filtering', () => {
  const result = { labels: Array(1000).fill(0), noise_count: 100, cluster_sizes: [5, 895] }
  const before = structuredClone(result)
  assert.deepEqual(summarizeExperiment(result), { noisePercent: 10, smallest: 5, smallClusters: 1, largestPercent: 89.5 })
  assert.deepEqual(result, before)
  assert.deepEqual(summarizeExperiment({ labels: [-1], noise_count: 1, cluster_sizes: [] }),
    { noisePercent: 100, smallest: null, smallClusters: 0, largestPercent: 0 })
  assert.equal(summarizeExperiment({ labels: [0], noise_count: 0, cluster_sizes: [1] }).largestPercent, 100)
})
