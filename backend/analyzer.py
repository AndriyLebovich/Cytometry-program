"""Unified, UI-independent FCS analysis. No file I/O except the single FCS load."""

import numpy as np

from .clustering import cluster_dbscan, cluster_hdbscan, cluster_kmeans
from .preprocessing import preprocess_events


def analyze_fcs(file_path, channels, algorithm="dbscan", parameters=None,
                standardize=True, minimum_population_size=1):
    """Analyze all retained events; raise validation/library errors to the caller.

    Statistics use selected channels in original units, after cleaning. Removed
    invalid rows are distinct from noise. Original assignments remain available
    for reversible filtering; surviving cluster identifiers are never renumbered.
    An empty cleaned dataset raises ValueError, as in standalone clustering.
    """
    import flowkit

    methods = {
        "kmeans": (cluster_kmeans, {"n_clusters": 2}),
        "dbscan": (cluster_dbscan, {"eps": 0.5, "min_samples": 5}),
        "hdbscan": (cluster_hdbscan, {"min_cluster_size": 5, "min_samples": 5}),
    }
    if not isinstance(file_path, str) or not file_path:
        raise ValueError("Missing file_path")
    if not isinstance(algorithm, str) or algorithm not in methods:
        raise ValueError("algorithm must be kmeans, dbscan or hdbscan")
    if (isinstance(minimum_population_size, bool)
            or not isinstance(minimum_population_size, int)
            or minimum_population_size < 1):
        raise ValueError("Minimum population size must be a positive integer")
    method, defaults = methods[algorithm]
    if parameters is None:
        parameters = {}
    if not isinstance(parameters, dict) or parameters.keys() - defaults.keys():
        raise ValueError("Unknown or invalid algorithm parameters")
    options = {**defaults, **parameters}

    sample = flowkit.Sample(file_path)
    events = sample.get_events(source="raw")
    available = list(sample.pnn_labels)
    prepared = preprocess_events(events, available, channels, standardize)
    original = method(prepared["data"], prepared["event_indices"], **options)
    labels = np.asarray(original["labels"], dtype=int)
    identifiers, sizes = np.unique(labels[labels >= 0], return_counts=True)
    removed = identifiers[sizes < minimum_population_size]
    filtered = labels.copy()
    filtered[np.isin(labels, removed)] = -1
    retained = np.asarray(events, dtype=float)[prepared["event_indices"]]
    raw = retained[:, [available.index(channel) for channel in channels]]

    def population(label):
        mask = filtered == label
        values = raw[mask]
        count = int(mask.sum())
        statistics = {}
        for column, channel in enumerate(channels):
            series = values[:, column]
            statistics[channel] = {
                name: float(operation(series)) if count else None
                for name, operation in [("min", np.min), ("max", np.max),
                                        ("mean", np.mean), ("median", np.median)]
            }
        if any(value is not None and not np.isfinite(value)
                for stats in statistics.values() for value in stats.values()):
            raise ValueError("Statistics produced non-finite values")
        return {"label": int(label), "count": count,
                "percentage": count / prepared["retained_count"] * 100,
                "statistics": statistics}

    clusters = [population(label) for label in identifiers if label not in removed]
    noise = population(-1)
    return {
        "source_file": file_path,
        "preprocessing": prepared,
        "original_clustering": original,
        "clustering": {
            "algorithm": algorithm, "labels": filtered.tolist(),
            "event_indices": prepared["event_indices"].copy(),
            "n_clusters": len(clusters),
            "cluster_sizes": [cluster["count"] for cluster in clusters],
            "noise_count": noise["count"],
        },
        "filtering": {
            "minimum_population_size": minimum_population_size,
            "removed_cluster_labels": removed.tolist(),
            "reassigned_count": int(np.count_nonzero(filtered != labels)),
        },
        "statistics": {"units": "original", "channels": channels.copy(),
                        "clusters": clusters, "noise": noise},
    }
