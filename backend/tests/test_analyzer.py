import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

import numpy as np

from backend.analyzer import analyze_fcs
from backend.clustering import cluster_dbscan, cluster_hdbscan, cluster_kmeans


class AnalyzerTests(unittest.TestCase):
    def sample(self, events):
        return Mock(pnn_labels=['A', 'B'],
                    get_events=Mock(return_value=np.asarray(events, dtype=float)))

    def test_complete_cleaned_data_mapping_statistics_and_reversible_filter(self):
        events = [[10, 100], [12, 102], [np.nan, 0], [14, 104],
                [30, 300], [32, 302], [100, 1000], [np.inf, 0]]
        sample = self.sample(events)
        before = sample.get_events.return_value.copy()
        with patch('flowkit.Sample', return_value=sample) as load:
            result = analyze_fcs('sample.fcs', ['B', 'A'], parameters={
                'eps': 5, 'min_samples': 2}, standardize=False,
                minimum_population_size=3)
        load.assert_called_once_with('sample.fcs')
        sample.get_events.assert_called_once_with(source='raw')
        np.testing.assert_equal(sample.get_events.return_value, before)
        self.assertEqual(result['preprocessing']['removed_event_indices'], [2, 7])
        self.assertEqual(result['clustering']['event_indices'], [0, 1, 3, 4, 5, 6])
        self.assertEqual(result['original_clustering']['cluster_sizes'], [3, 2])
        self.assertEqual(result['clustering']['cluster_sizes'], [3])
        self.assertEqual(result['clustering']['noise_count'], 3)
        self.assertEqual(result['filtering']['reassigned_count'], 2)
        stats = result['statistics']['clusters'][0]
        self.assertEqual(stats['percentage'], 50)
        self.assertEqual(stats['statistics']['A'],
                        {'min': 10, 'max': 14, 'mean': 12, 'median': 12})
        self.assertEqual(result['statistics']['noise']['statistics']['A']['min'], 30)
        json.dumps(result, allow_nan=False)

    def test_algorithms_reuse_standalone_results_and_original_units(self):
        events = [[10, 100], [11, 101], [30, 300], [31, 301], [100, 1000]]
        for name, method, options in [
            ('kmeans', cluster_kmeans, {'n_clusters': 2}),
            ('dbscan', cluster_dbscan, {'eps': .3, 'min_samples': 2}),
            ('hdbscan', cluster_hdbscan, {'min_cluster_size': 2, 'min_samples': 1}),
        ]:
            with self.subTest(algorithm=name), patch('flowkit.Sample', return_value=self.sample(events)):
                result = analyze_fcs('sample.fcs', ['A', 'B'], name, options)
                prepared = result['preprocessing']
                self.assertEqual(result['original_clustering'],
                                 method(prepared['data'], prepared['event_indices'], **options))
                self.assertEqual(result['clustering']['labels'], result['original_clustering']['labels'])
                summaries = result['statistics']['clusters'] + [result['statistics']['noise']]
                self.assertEqual(sum(item['count'] for item in summaries), 5)
                for item in summaries:
                    if item['count']:
                        self.assertGreaterEqual(item['statistics']['A']['min'], 10)
                json.dumps(result, allow_nan=False)

    def test_all_noise_all_filtered_and_empty(self):
        with patch('flowkit.Sample', return_value=self.sample([[1, 2], [2, 3]])):
            noise = analyze_fcs('f', ['A'], parameters={'min_samples': 5})
            filtered = analyze_fcs('f', ['A'], 'kmeans', {'n_clusters': 1},
                                minimum_population_size=3)
        for result in [noise, filtered]:
            self.assertEqual(result['clustering']['labels'], [-1, -1])
            self.assertEqual(result['statistics']['clusters'], [])
            self.assertEqual(result['statistics']['noise']['percentage'], 100)
        with patch('flowkit.Sample', return_value=self.sample([[1, 2], [2, 3]])):
            result = analyze_fcs('f', ['A'], 'kmeans', {'n_clusters': 1})
            self.assertIsNone(result['statistics']['noise']['statistics']['A']['mean'])
        for events in [np.empty((0, 2)), [[np.nan, 0]]]:
            with patch('flowkit.Sample', return_value=self.sample(events)), self.assertRaises(ValueError):
                analyze_fcs('f', ['A'])

    def test_validation_and_load_errors(self):
        for kwargs in [{'file_path': ''}, {'algorithm': 'unknown'},
                        {'parameters': []}, {'parameters': {'typo': 1}},
                       *[{'minimum_population_size': value} for value in [True, 0, -1, 1.5]]]:
            with self.subTest(kwargs=kwargs), self.assertRaises(ValueError):
                analyze_fcs(**{'file_path': 'f', 'channels': ['A'], **kwargs})
        for kwargs in [{'channels': ['missing']}, {'standardize': 'yes'},
                        {'parameters': {'eps': -1}}]:
            with patch('flowkit.Sample', return_value=self.sample([[1, 2]])), self.assertRaises(ValueError):
                analyze_fcs(**{'file_path': 'f', 'channels': ['A'], **kwargs})
        with patch('flowkit.Sample', side_effect=OSError('unreadable')), self.assertRaises(OSError):
            analyze_fcs('missing.fcs', ['A'])

    def test_real_generated_fcs(self):
        import flowio
        with tempfile.TemporaryDirectory() as directory:
            path = str(Path(directory) / 'sample.fcs')
            with open(path, 'wb') as handle:
                flowio.create_fcs(handle, [10, 100, 11, 101, 30, 300, 31, 301], ['A', 'B'])
            result = analyze_fcs(path, ['B', 'A'], parameters={'eps': .3, 'min_samples': 2})
        self.assertEqual(result['clustering']['cluster_sizes'], [2, 2])
        self.assertEqual(result['clustering']['event_indices'], [0, 1, 2, 3])
        self.assertEqual(result['statistics']['noise']['count'], 0)
        json.dumps(result, allow_nan=False)
