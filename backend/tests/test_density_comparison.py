"""Controlled Day 18 observations; no biological interpretation."""
import json
import unittest

import numpy as np
from backend.clustering import cluster_dbscan, cluster_hdbscan
from backend.preprocessing import preprocess_events


class DensityComparisonTests(unittest.TestCase):
    def test_same_prepared_events_and_parameter_dependent_behavior(self):
        rng = np.random.default_rng(42)
        events = np.vstack([rng.normal(0, .03, (30, 2)), [[np.nan, 0]],
                            rng.normal(5, .03, (30, 2)), [[100, 100]]]).tolist()
        prepared = preprocess_events(events, ['A', 'B'], ['A', 'B'])
        before = json.dumps(prepared)
        data, indices = prepared['data'], prepared['event_indices']
        results = [cluster_dbscan(data, indices, .1, 5),
                   cluster_dbscan(data, indices, .000001, 5),
                   cluster_dbscan(data, indices, 100, 5),
                   cluster_hdbscan(data, indices, 10, 5)]
        self.assertEqual([(r['n_clusters'], r['noise_count']) for r in results],
                         [(2, 1), (0, 61), (1, 0), (2, 1)])
        for result in results:
            self.assertEqual(result['event_indices'], indices)
            self.assertEqual(len(result['labels']), 61)
            self.assertEqual(sum(result['cluster_sizes']) + result['noise_count'], 61)
        self.assertEqual(sorted(results[0]['cluster_sizes']), [30, 30])
        self.assertEqual(sorted(results[3]['cluster_sizes']), [30, 30])
        self.assertEqual(before, json.dumps(prepared))

    def test_both_algorithms_safely_report_all_noise(self):
        for result in [cluster_dbscan([[0], [10]], [3, 8], .1, 5),
                       cluster_hdbscan([[0], [10]], [3, 8], 5, 5)]:
            self.assertEqual(result['labels'], [-1, -1])
            self.assertEqual(result['cluster_sizes'], [])
            self.assertEqual(result['noise_count'], 2)
