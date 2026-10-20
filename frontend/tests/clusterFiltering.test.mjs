import assert from 'node:assert/strict'
import { test } from 'node:test'
import { filterSmallClusters } from '../src/clusterFiltering.ts'

test('complete assignments determine sizes, strict threshold preserves IDs, mapping and inputs', () => {
  const source = { labels: [0, 1, 1, 2, 2, 2, -1], event_indices: [2, 4, 8, 9, 15, 16, 20] }
  const before = structuredClone(source)
  const result = filterSmallClusters(source, 2)
  assert.deepEqual(result.labels, [-1, 1, 1, 2, 2, 2, -1])
  assert.deepEqual(result.clusters, [{ label: 1, size: 2 }, { label: 2, size: 3 }])
  assert.equal(result.noise_count, 2)
  assert.equal(result.removed_clusters, 1)
  assert.equal(result.reassigned_count, 1)
  assert.equal(result.n_clusters, 2)
  assert.deepEqual(result.event_indices, source.event_indices)
  assert.deepEqual(source, before)
  assert.deepEqual(filterSmallClusters(source, 1).labels, source.labels)
})

test('empty, all noise, all removed and repeated threshold changes are safe', () => {
  for (const labels of [[], [-1, -1], [0, 0, 1]]) {
    const source = { labels, event_indices: labels.map((_, index) => index) }
    const result = filterSmallClusters(source, 10)
    assert.equal(result.n_clusters, 0)
    assert.equal(result.noise_count, labels.length)
    assert.deepEqual(result.clusters, [])
    assert.deepEqual(filterSmallClusters(source, 1).labels, labels)
  }
})

test('invalid thresholds, labels and mismatched mapping are rejected', () => {
  for (const minimum of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => filterSmallClusters({ labels: [], event_indices: [] }, minimum), /positive safe integer/)
  }
  assert.throws(() => filterSmallClusters({ labels: [0], event_indices: [] }, 1), /mapping/)
  assert.throws(() => filterSmallClusters({ labels: [-2], event_indices: [0] }, 1), /label/)
})

test('all algorithms and comparison use the same reversible rule without losing fit metadata', () => {
  for (const algorithm of ['kmeans', 'dbscan', 'hdbscan']) {
    const source = { algorithm, labels: [0, 1, 1], event_indices: [1, 3, 7], eps: 0.5, inertia: 42 }
    const result = filterSmallClusters(source, 2)
    assert.deepEqual(result.labels, [-1, 1, 1])
    assert.equal(result.algorithm, algorithm)
    assert.equal(result.eps, 0.5)
    assert.equal(result.inertia, 42)
    assert.equal(result.clusters.reduce((total, cluster) => total + cluster.size, result.noise_count), 3)
  }
})
