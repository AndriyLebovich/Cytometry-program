import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np
from backend.clustering import cluster_hdbscan
from backend.preprocessing import preprocess_events, preprocess_fcs


class HDBSCANTests(unittest.TestCase):
    def test_preprocessed_groups_noise_mapping_and_immutability(self):
        rng = np.random.default_rng(42)
        events = np.vstack([rng.normal(0, .03, (30, 2)),
                            [[np.nan, 0]], rng.normal(5, .03, (30, 2)),
                            [[100, 100]]]).tolist()
        prepared = preprocess_events(events, ['A', 'B'], ['A', 'B'])
        before = json.dumps(prepared)
        result = cluster_hdbscan(prepared['data'], prepared['event_indices'], 10, 5)
        self.assertEqual(result['algorithm'], 'hdbscan')
        self.assertEqual(result['n_clusters'], 2)
        self.assertEqual(sorted(result['cluster_sizes']), [30, 30])
        self.assertEqual(result['noise_count'], 1)
        self.assertEqual(result['labels'][-1], -1)
        self.assertEqual(len(set(result['labels'][:30])), 1)
        self.assertNotEqual(result['labels'][0], result['labels'][30])
        self.assertEqual(result['event_indices'], prepared['event_indices'])
        self.assertNotIn(30, result['event_indices'])
        self.assertEqual(sum(result['cluster_sizes']) + result['noise_count'], 61)
        self.assertEqual(before, json.dumps(prepared))
        json.dumps(result, allow_nan=False)

    def test_fcs_file_to_preprocessing_to_hdbscan(self):
        import flowio
        rng = np.random.default_rng(42)
        events = np.vstack([rng.normal(10, .03, (30, 2)),
                            rng.normal(15, .03, (30, 2)), [[100, 100]]])
        with tempfile.TemporaryDirectory() as directory:
            path = str(Path(directory) / 'sample.fcs')
            with open(path, 'wb') as handle:
                flowio.create_fcs(handle, events.ravel().tolist(), ['A', 'B'])
            prepared = preprocess_fcs(path, ['A', 'B'])
        result = cluster_hdbscan(prepared['data'], prepared['event_indices'], 10, 5)
        self.assertEqual(result['n_clusters'], 2)
        self.assertEqual(sorted(result['cluster_sizes']), [30, 30])
        self.assertEqual(result['labels'][-1], -1)
        self.assertEqual(result['event_indices'], list(range(61)))

    def test_small_all_noise_and_duplicate_data(self):
        for data in [[[1]], [[0], [10]], [[1], [1], [1], [1]]]:
            with self.subTest(data=data):
                result = cluster_hdbscan(data, list(range(len(data))), 5, 5)
                self.assertEqual(result['labels'], [-1] * len(data))
                self.assertEqual(result['cluster_sizes'], [])
                self.assertEqual(result['noise_count'], len(data))

    def test_validation(self):
        for size in [None, True, 0, 1, -1, 2.5, '5']:
            with self.subTest(size=size), self.assertRaises(ValueError):
                cluster_hdbscan([[1], [2]], [0, 1], size, 1)
        for minimum in [None, True, 0, -1, 1.5, '2']:
            with self.subTest(minimum=minimum), self.assertRaises(ValueError):
                cluster_hdbscan([[1], [2]], [0, 1], 2, minimum)
        for data, indices in [([], []), ([[np.nan]], [0]), ([[np.inf]], [0]),
                              ([[1]], []), ([[1]], [-1]), ([[1], [2]], [0, 0])]:
            with self.subTest(data=data), self.assertRaises(ValueError):
                cluster_hdbscan(data, indices, 2, 1)

    def test_stdin_command_success_and_structured_errors(self):
        main = str(Path(__file__).resolve().parents[1] / 'main.py')
        for payload, success in [({'data': [[0], [.01], [10], [10.01], [100]],
                                  'event_indices': [2, 4, 6, 8, 10],
                                  'min_cluster_size': 2, 'min_samples': 1}, True), ({}, False)]:
            response = subprocess.run([sys.executable, '-B', main, 'hdbscan', '--stdin'],
                                      input=json.dumps(payload), text=True, capture_output=True, check=True)
            result = json.loads(response.stdout)
            self.assertEqual(result['success'], success)
            if success:
                self.assertEqual(result['event_indices'], payload['event_indices'])
                self.assertEqual(len(result['labels']), 5)
            else:
                self.assertIn('message', result)
