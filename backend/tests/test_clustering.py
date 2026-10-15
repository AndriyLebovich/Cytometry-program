import json
import subprocess
import sys
import unittest
from pathlib import Path

import numpy as np

from backend.clustering import cluster_kmeans
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


if __name__ == '__main__':
    unittest.main()
