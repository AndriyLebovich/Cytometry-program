import json
import subprocess
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

import numpy as np

from backend.clustering import cluster_kmeans, cluster_dbscan
from backend.preprocessing import preprocess_events


class KMeansTests(unittest.TestCase):
    def test_separated_groups_and_event_mapping(self):
        prepared = preprocess_events([[0, 0], [np.nan, 1], [0, 1], [10, 10], [10, 11]],
                                     ['A', 'B'], ['A', 'B'])
        original = json.dumps(prepared)
        result = cluster_kmeans(prepared['data'], prepared['event_indices'], 2)
        labels = result['labels']
        self.assertEqual(labels[0], labels[1])
        self.assertEqual(labels[2], labels[3])
        self.assertNotEqual(labels[0], labels[2])
        self.assertEqual(result['event_indices'], [0, 2, 3, 4])
        self.assertEqual(sorted(result['cluster_sizes']), [2, 2])
        self.assertEqual(result, cluster_kmeans(prepared['data'], prepared['event_indices'], 2))
        self.assertEqual(original, json.dumps(prepared))
        json.dumps(result, allow_nan=False)

    def test_invalid_and_empty_inputs(self):
        cases = [([], [], 1), ([[1]], [0], 0), ([[1]], [0], 2),
                 ([[1]], [0], True), ([[1]], [0], 1.5), ([[np.inf]], [0], 1),
                 ([[np.nan]], [0], 1), ([[1]], [], 1), ([[1]], [-1], 1),
                 ([[1], [2]], [0, 0], 1), ([[1], [1]], [0, 1], 2)]
        for data, indices, count in cases:
            with self.subTest(data=data, count=count), self.assertRaises(ValueError):
                cluster_kmeans(data, indices, count)
        self.assertEqual(cluster_kmeans([[5]], [10], 1)['labels'], [0])
        self.assertEqual(cluster_kmeans([[5], [5]], [0, 1], 1)['cluster_sizes'], [2])

    def test_stdin_command_handles_large_payload_and_errors(self):
        main = str(Path(__file__).resolve().parents[1] / 'main.py')
        payload = {'data': [[i, i * 2] for i in range(4000)],
                   'event_indices': list(range(4000)), 'n_clusters': 2}
        encoded = json.dumps(payload)
        self.assertGreater(len(encoded), 32768)
        response = subprocess.run([sys.executable, main, 'kmeans', '--stdin'],
                                  input=encoded, text=True, capture_output=True, check=True)
        result = json.loads(response.stdout)
        self.assertTrue(result['success'])
        self.assertEqual(result['event_indices'], payload['event_indices'])
        self.assertEqual(sum(result['cluster_sizes']), 4000)
        response = subprocess.run([sys.executable, main, 'kmeans', '--stdin'],
                                  input='{}', text=True, capture_output=True, check=True)
        self.assertFalse(json.loads(response.stdout)['success'])
        for arguments, input_text in [(['test', '{"value": 7}'], None),
                                      (['test', '--stdin'], '{"value": 7}')]:
            response = subprocess.run([sys.executable, main, *arguments],
                                      input=input_text, text=True, capture_output=True, check=True)
            self.assertEqual(json.loads(response.stdout)['received_data'], {'value': 7})


class DBSCANTests(unittest.TestCase):
    def test_day16_parameter_effects_on_controlled_data(self):
        # Two triplets, a small pair and an isolated event in prepared units.
        data = [[0], [.15], [.3], [.8], [.95], [1.1], [3], [3.15], [9]]
        indices = [2, 4, 6, 8, 10, 12, 14, 16, 18]
        before = json.dumps(data)
        results = {(eps, minimum): cluster_dbscan(data, indices, eps, minimum)
                   for minimum in [2, 3, 5]
                   for eps in [.1, .2, .3, .5, .7]}
        self.assertEqual(results[.1, 2]['noise_count'], 9)
        self.assertEqual(sorted(results[.2, 2]['cluster_sizes']), [2, 3, 3])
        self.assertEqual(results[.2, 3]['cluster_sizes'], [3, 3])
        self.assertEqual(results[.2, 3]['noise_count'], 3)
        self.assertEqual(results[.2, 5]['n_clusters'], 0)
        self.assertEqual(results[.7, 2]['cluster_sizes'], [6, 2])
        self.assertEqual(cluster_dbscan(data, indices, 10, 2)['cluster_sizes'], [9])
        for result in results.values():
            self.assertEqual(result['event_indices'], indices)
            self.assertEqual(sum(result['cluster_sizes']) + result['noise_count'], len(data))
        self.assertEqual(json.dumps(data), before)

    def test_groups_noise_and_original_mapping(self):
        prepared = preprocess_events([[0, 0], [np.nan, 1], [0, .1],
                                     [10, 10], [10, 10.1], [100, 100]],
                                    ['A', 'B'], ['A', 'B'])
        before = json.dumps(prepared)
        result = cluster_dbscan(prepared['data'], prepared['event_indices'], .05, 2)
        self.assertEqual(result['labels'], [0, 0, 1, 1, -1])
        self.assertEqual(result['event_indices'], [0, 2, 3, 4, 5])
        self.assertEqual(result['cluster_sizes'], [2, 2])
        self.assertEqual(result['n_clusters'], 2)
        self.assertEqual(result['noise_count'], 1)
        self.assertEqual(before, json.dumps(prepared))
        json.dumps(result, allow_nan=False)

    def test_all_noise_single_cluster_and_duplicates(self):
        result = cluster_dbscan([[0], [10]], [2, 8], .5, 3)
        self.assertEqual(result['labels'], [-1, -1])
        self.assertEqual(result['cluster_sizes'], [])
        self.assertEqual(result['n_clusters'], 0)
        self.assertEqual(result['noise_count'], 2)
        self.assertEqual(cluster_dbscan([[5], [5]], [0, 1], .5, 2)['labels'], [0, 0])
        self.assertEqual(cluster_dbscan([[5]], [9], .5, 1)['cluster_sizes'], [1])

    def test_validation(self):
        for eps in [None, True, 0, -1, float('nan'), float('inf'), '0.5']:
            with self.subTest(eps=eps), self.assertRaises(ValueError):
                cluster_dbscan([[1]], [0], eps, 2)
        for minimum in [None, True, 0, -1, 1.5, '2']:
            with self.subTest(minimum=minimum), self.assertRaises(ValueError):
                cluster_dbscan([[1]], [0], .5, minimum)
        for data, indices in [([], []), ([[float('inf')]], [0]),
                              ([[1]], []), ([[1]], [-1]), ([[1], [2]], [0, 0])]:
            with self.subTest(data=data), self.assertRaises(ValueError):
                cluster_dbscan(data, indices, .5, 2)

    def test_dense_fallback_matches_sklearn(self):
        from sklearn.cluster import DBSCAN
        rng = np.random.default_rng(42)
        examples = [rng.normal(size=(120, 2)), np.zeros((3000, 2)),
                    np.array([[0], [.1], [.2], [1], [1.1], [1.2], [9]])]
        for matrix in examples:
            for minimum in [1, 3, 10]:
                expected = DBSCAN(eps=.3, min_samples=minimum).fit_predict(matrix)
                with patch('backend.clustering.DBSCAN_MAX_NEIGHBORS', 1), \
                        patch('backend.clustering.DBSCAN') as model:
                    result = cluster_dbscan(matrix, list(range(len(matrix))), .3, minimum)
                    model.assert_not_called()
                np.testing.assert_array_equal(result['labels'], expected)

    def test_stdin_command(self):
        main = str(Path(__file__).resolve().parents[1] / 'main.py')
        for payload, success in [({'data': [[0], [.1], [10]], 'event_indices': [1, 3, 8],
                                  'eps': .5, 'min_samples': 2}, True), ({}, False)]:
            response = subprocess.run([sys.executable, main, 'dbscan', '--stdin'],
                                      input=json.dumps(payload), text=True, capture_output=True, check=True)
            result = json.loads(response.stdout)
            self.assertEqual(result['success'], success)
            if success:
                self.assertEqual(result['labels'], [0, 0, -1])
                self.assertEqual(result['event_indices'], [1, 3, 8])


if __name__ == '__main__':
    unittest.main()
