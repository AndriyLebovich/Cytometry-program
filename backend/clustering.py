"""Clustering on an already preprocessed event matrix."""

import numpy as np
from sklearn.cluster import KMeans, DBSCAN
from sklearn.neighbors import KDTree


# Bound stored neighbor indices before sklearn allocates all neighborhoods.
DBSCAN_MAX_NEIGHBORS = 5_000_000


def cluster_kmeans(data, event_indices, n_clusters):
    if isinstance(n_clusters, bool) or not isinstance(n_clusters, int) or n_clusters < 1:
        raise ValueError("Cluster count must be a positive integer")
    matrix = _validated_matrix(data, event_indices)
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


def _validated_matrix(data, event_indices):
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
    return matrix


def cluster_dbscan(data, event_indices, eps, min_samples):
    if isinstance(eps, bool) or not isinstance(eps, (int, float)) or not np.isfinite(eps) or eps <= 0:
        raise ValueError("eps must be a finite positive number")
    if isinstance(min_samples, bool) or not isinstance(min_samples, int) or min_samples < 1:
        raise ValueError("min_samples must be a positive integer")
    matrix = _validated_matrix(data, event_indices)
    tree = KDTree(matrix)
    neighbor_total = 0
    for start in range(0, len(matrix), 256):
        counts = tree.query_radius(matrix[start:start + 256], r=eps, count_only=True)
        neighbor_total += int(counts.sum())
        if neighbor_total > DBSCAN_MAX_NEIGHBORS:
            labels = _streaming_dbscan(matrix, tree, eps, min_samples)
            break
    else:
        labels = DBSCAN(eps=eps, min_samples=min_samples, algorithm="kd_tree").fit_predict(matrix)
    cluster_labels, sizes = np.unique(labels[labels >= 0], return_counts=True)
    return {
        "algorithm": "dbscan",
        "eps": eps,
        "min_samples": min_samples,
        "n_clusters": len(cluster_labels),
        "labels": labels.tolist(),
        "event_indices": event_indices.copy(),
        "cluster_sizes": sizes.tolist(),
        "noise_count": int(np.count_nonzero(labels == -1)),
    }


def _streaming_dbscan(matrix, tree, eps, min_samples):
    """Exact Euclidean DBSCAN with only one neighborhood in memory at a time."""
    counts = tree.query_radius(matrix, r=eps, count_only=True)
    core = counts >= min_samples
    labels = np.full(len(matrix), -1, dtype=np.intp)
    expanded = np.zeros(len(matrix), dtype=bool)
    cluster = 0
    unassigned = len(matrix)
    for seed in range(len(matrix)):
        if labels[seed] != -1 or not core[seed]:
            continue
        labels[seed] = cluster
        unassigned -= 1
        stack = [seed]
        while stack:
            point = stack.pop()
            if expanded[point]:
                continue
            expanded[point] = True
            neighbors = tree.query_radius(matrix[point:point + 1], r=eps)[0]
            fresh = neighbors[labels[neighbors] == -1]
            labels[fresh] = cluster
            unassigned -= len(fresh)
            # Once every event is assigned, no further expansion can change labels.
            if unassigned == 0:
                return labels
            stack.extend(fresh[core[fresh]].tolist())
        cluster += 1
    return labels
