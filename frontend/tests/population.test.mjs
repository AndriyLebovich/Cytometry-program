import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createSelectedPopulation, buildPopulationStatistics, buildPopulationHistogram } from '../src/population.ts'

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
