export interface SelectedEvent {
  readonly [channel: string]: number
}

// Complete event records; deliberately independent of sampled scatter points.
export interface SelectedPopulation {
  readonly sourceFile: string
  readonly sourceEventCount: number
  readonly channels: readonly string[]
  readonly events: readonly SelectedEvent[]
}

export function createSelectedPopulation(
  sourceFile: string,
  sourceEventCount: number,
  channels: readonly string[],
  events: readonly SelectedEvent[],
): SelectedPopulation {
  return {
    sourceFile,
    sourceEventCount,
    channels: [...channels],
    events: events.map((event) => ({ ...event })),
  }
}

export const buildPopulationStatistics = (population: SelectedPopulation | null) => {
  if (!population || population.events.length === 0) {
    return {}
  }

  const events = population.events

  const channels = population.channels

  const statistics: Record<
    string,
    {
      min: number
      max: number
      mean: number
      median: number
    }
  > = {}

  for (const channel of channels) {
    const values = events
      .map((event) => event[channel])
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b)

    if (values.length === 0) {
      continue
    }

    const sum = values.reduce(
      (total, value) => total + value,
      0
    )

    const mean = sum / values.length

    const middle = Math.floor(values.length / 2)

    const median =
      values.length % 2 === 0
        ? (values[middle - 1] + values[middle]) / 2
        : values[middle]

    statistics[channel] = {
      min: values[0],
      max: values[values.length - 1],
      mean,
      median,
    }
  }

  return statistics
}

export const buildPopulationHistogram = (
  population: SelectedPopulation | null,
  channel: string,
  binsCount = 30
) => {
  if (!Number.isInteger(binsCount) || binsCount <= 0) {
    throw new Error('Histogram bin count must be a positive integer')
  }

  if (!population || !population.channels.includes(channel)) {
    return []
  }

  const values = population.events
    .map((event) => event[channel])
    .filter((value) => Number.isFinite(value))

  if (values.length === 0) {
    return []
  }

  const min = values.reduce((a, b) => Math.min(a, b), Infinity)
  const max = values.reduce((a, b) => Math.max(a, b), -Infinity)

  if (min === max) {
    return [
      {
        start: min,
        end: max,
        count: values.length,
      },
    ]
  }

  const binWidth = (max - min) / binsCount

  const bins = Array.from(
    { length: binsCount },
    (_, index) => ({
      start: min + index * binWidth,
      end:
        index === binsCount - 1
          ? max
          : min + (index + 1) * binWidth,
      count: 0,
    })
  )

  for (const value of values) {
    let index = Math.floor(
      (value - min) / binWidth
    )

    if (index >= binsCount) {
      index = binsCount - 1
    }

    bins[index].count++
  }

  return bins
}

