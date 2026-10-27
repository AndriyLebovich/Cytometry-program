type AlgorithmOptions =
  | { algorithm: 'kmeans'; parameters?: { n_clusters?: number } }
  | { algorithm: 'dbscan'; parameters?: { eps?: number; min_samples?: number } }
  | { algorithm: 'hdbscan'; parameters?: { min_cluster_size?: number; min_samples?: number } }

export type AnalysisRequest = AlgorithmOptions & {
  filePath: string
  channels: string[]
  standardize?: boolean
  minimumPopulationSize?: number
}

export type AnalysisResponse =
  | { success: true; result: unknown }
  | { success: false; error: { message: string; exitCode: number | null; signal: string | null; stderr: string } }
