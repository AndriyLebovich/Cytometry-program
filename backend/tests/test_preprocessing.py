import json
import unittest
import tempfile
from pathlib import Path
from unittest.mock import patch, Mock

import numpy as np

from backend.preprocessing import preprocess_events, preprocess_fcs


class PreprocessingTests(unittest.TestCase):
    def test_filter_scale_and_original_mapping(self):
        events = np.array([[1, 100, np.nan], [np.nan, 200, 0],
                           [3, 300, 0], [5, np.inf, 0], [7, -np.inf, 0]])
        before = events.copy()
        result = preprocess_events(events, ['A', 'B', 'unused'], ['B', 'A'])
        self.assertEqual(result['event_indices'], [0, 2])
        self.assertEqual(result['removed_event_indices'], [1, 3, 4])
        self.assertEqual(result['channels'], ['B', 'A'])
        np.testing.assert_allclose(result['data'], [[-1, -1], [1, 1]])
        self.assertEqual(result['scaler']['mean'], [200, 2])
        np.testing.assert_equal(events, before)
        json.dumps(result, allow_nan=False)

    def test_unscaled_constant_single_and_empty(self):
        result = preprocess_events([[2, 5], [4, 5]], ['A', 'B'], ['B', 'A'], False)
        self.assertEqual(result['data'], [[5, 2], [5, 4]])
        self.assertIsNone(result['scaler'])
        self.assertEqual(preprocess_events([[2, 5]], ['A', 'B'], ['B'])['data'], [[0]])
        for events in [np.empty((0, 1)), [[np.nan], [np.inf]]]:
            result = preprocess_events(events, ['A'], ['A'])
            self.assertEqual(result['data'], [])
            self.assertEqual(result['event_indices'], [])
            self.assertIsNone(result['scaler'])
            json.dumps(result, allow_nan=False)

    def test_invalid_inputs(self):
        for channels in [[], None, ['unknown'], ['A', 'A'], [1]]:
            with self.assertRaises(ValueError):
                preprocess_events([[1]], ['A'], channels)
        with self.assertRaises(ValueError):
            preprocess_events([[1]], ['A'], ['A'], 'yes')
        with self.assertRaises(ValueError):
            preprocess_events([['not numeric']], ['A'], ['A'])

    def test_fcs_uses_complete_raw_events(self):
        sample = Mock(pnn_labels=['A', 'B'])
        sample.get_events.return_value = np.array([[1, 4], [3, 8]])
        with patch('flowkit.Sample', return_value=sample):
            result = preprocess_fcs('sample.fcs', ['A'])
        sample.get_events.assert_called_once_with(source='raw')
        self.assertEqual(result['source_file'], 'sample.fcs')
        self.assertEqual(result['input_count'], 2)

    def test_real_fcs_loading_and_existing_manual_gate(self):
        import flowio
        from backend.fcs_reader import read_fcs, apply_rectangular_gate

        with tempfile.TemporaryDirectory() as directory:
            path = str(Path(directory) / 'sample.fcs')
            with open(path, 'wb') as handle:
                flowio.create_fcs(handle, [1, 10, 3, 30, 5, 50], ['A', 'B'])
            original = read_fcs(path)
            result = preprocess_fcs(path, ['B', 'A'])
            gate = apply_rectangular_gate(path, 'A', 'B', 0, 4, 0, 40)
        self.assertEqual(original['events'], 3)
        self.assertEqual(result['event_indices'], [0, 1, 2])
        np.testing.assert_allclose(np.mean(result['data'], axis=0), [0, 0], atol=1e-12)
        self.assertEqual(gate['count'], 2)
        self.assertEqual(gate['selected_events'], [{'A': 1, 'B': 10}, {'A': 3, 'B': 30}])


if __name__ == '__main__':
    unittest.main()
