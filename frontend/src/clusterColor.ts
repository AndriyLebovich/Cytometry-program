export const clusterColor = (label: number, count: number) => label === -1 ? '#64748b' : `hsl(${label * 360 / count}, 70%, 42%)`
