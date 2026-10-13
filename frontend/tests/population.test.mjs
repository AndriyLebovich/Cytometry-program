import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createSelectedPopulation, savePopulation, buildPopulationStatistics, buildPopulationHistogram } from '../src/population.ts'

test('complete population is independent of source records and scatter sampling', () => {
  const events = [{ X: 2, Y: 8, Z: 100 }, { X: 4, Y: 6, Z: 300 }]
  const channels = ['X', 'Y', 'Z']
  const population = createSelectedPopulation('sample.fcs', 1000, channels, events)
  events[0].Z = 9999
  channels.pop()
  assert.equal(population.sourceEventCount, 1000)
  assert.deepEqual(population.channels, ['X', 'Y', 'Z'])
  assert.deepEqual(buildPopulationStatistics(population).Z, { min: 100, max: 300, mean: 200, median: 200 })
  assert.equal(buildPopulationHistogram(population, 'Z', 2).reduce((sum, bin) => sum + bin.count, 0), 2)
  assert.deepEqual(buildPopulationHistogram(population, 'Z', 2).map(bin => bin.count), [1, 1])
})

test('empty populations and missing channels are safe', () => {
  const population = createSelectedPopulation('sample.fcs', 0, ['X'], [])
  assert.deepEqual(buildPopulationStatistics(population), {})
  assert.deepEqual(buildPopulationHistogram(population, 'X'), [])
  assert.deepEqual(buildPopulationStatistics(null), {})
  assert.deepEqual(buildPopulationHistogram(population, 'missing'), [])
  assert.throws(() => buildPopulationHistogram(population, 'X', 0))
})

test('odd median, constant distributions and invalid values', () => {
  const population = createSelectedPopulation('sample.fcs', 5, ['X', 'Y'], [
    { X: 9, Y: 7 }, { X: 1, Y: 7 }, { X: 5, Y: 7 },
    { X: NaN, Y: Infinity },
  ])
  assert.deepEqual(buildPopulationStatistics(population).X, { min: 1, max: 9, mean: 5, median: 5 })
  assert.deepEqual(buildPopulationHistogram(population, 'Y'), [{ start: 7, end: 7, count: 3 }])
})

test('large complete populations do not exceed function argument limits', () => {
  const population = createSelectedPopulation('large.fcs', 200000, ['X'],
    Array.from({ length: 200000 }, (_, X) => ({ X })))
  assert.equal(buildPopulationStatistics(population).X.median, 99999.5)
  assert.equal(buildPopulationHistogram(population, 'X').reduce((sum, bin) => sum + bin.count, 0), 200000)
})

const gate = { xChannel: 'X', yChannel: 'Y', xMin: 0, xMax: 10, yMin: 0, yMax: 10 }

test('multiple saved populations preserve independent gates, data, statistics and identity', () => {
  const active = createSelectedPopulation('sample.fcs', 100, ['X', 'Y'], [{ X: 2, Y: 4 }])
  const first = savePopulation(active, gate, 'id-1', 'Population 1')
  const second = savePopulation(createSelectedPopulation('sample.fcs', 100, ['X', 'Y'], [{ X: 8, Y: 9 }]),
    { ...gate, xMin: 5 }, 'id-2', 'Population 2')
  active.events[0].X = 999
  const changedGate = { ...gate }
  const third = savePopulation(second, changedGate, 'id-3', 'Population 3')
  changedGate.xMin = -100
  assert.equal(first.events[0].X, 2)
  assert.equal(first.statistics.X.mean, 2)
  assert.equal(first.percentage, 1)
  assert.equal(second.statistics.X.mean, 8)
  assert.equal(second.gate.xMin, 5)
  assert.equal(third.gate.xMin, 0)
  assert.notEqual(first.id, second.id)
  assert.equal(buildPopulationHistogram(first, 'X')[0].count, 1)
  assert.equal(first.sourceFile, second.sourceFile)
})

test('saved empty populations are safe and invalid metadata is rejected', () => {
  const population = createSelectedPopulation('sample.fcs', 0, ['X', 'Y'], [])
  const saved = savePopulation(population, gate, 'empty', 'Empty population')
  assert.equal(saved.percentage, 0)
  assert.deepEqual(saved.statistics, {})
  assert.throws(() => savePopulation(population, gate, '', 'Name'))
  assert.throws(() => savePopulation(population, { ...gate, xMax: -1 }, 'id', 'Name'))
  assert.throws(() => savePopulation(population, { ...gate, xMin: NaN }, 'id', 'Name'))
  assert.throws(() => savePopulation(population, { ...gate, xChannel: 'unknown' }, 'id', 'Name'))
})
