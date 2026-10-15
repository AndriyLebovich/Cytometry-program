"""K-Means baseline on an already preprocessed event matrix."""

import numpy as np
from sklearn.cluster import KMeans


def cluster_kmeans(data, event_indices, n_clusters):
    if isinstance(n_clusters, bool) or not isinstance(n_clusters, int) or n_clusters < 1:
        raise ValueError("Cluster count must be a positive integer")
    matrix = np.asarray(data, dtype=float)
    if matrix.ndim != 2 or not len(matrix) or matrix.shape[1] == 0:
        raise ValueError("Prepare a non-empty dataset before clustering")
    if not np.isfinite(matrix).all():
        raise ValueError("Clustering data must contain only finite numbers")
    if not isinstance(event_indices, list) or len(event_indices) != len(matrix):
        raise ValueError("Event indices must match data rows")
    if any(isinstance(index, bool) or not isinstance(index, int) or index < 0
           for index in event_indices) or len(set(event_indices)) != len(event_indices):
        raise ValueError("Event indices must be unique non-negative integers")
    if n_clusters > len(matrix):
        raise ValueError("Cluster count exceeds the number of retained events")
    if n_clusters > len(np.unique(matrix, axis=0)):
        raise ValueError("Cluster count exceeds the number of distinct event rows")
    model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = model.fit_predict(matrix)
    return {
        "algorithm": "kmeans",
        "n_clusters": n_clusters,
        "random_state": 42,
        "n_init": 10,
        "labels": labels.tolist(),
        "event_indices": event_indices.copy(),
        "cluster_sizes": np.bincount(labels, minlength=n_clusters).tolist(),
        "centers": model.cluster_centers_.tolist(),
        "inertia": float(model.inertia_),
    }
