import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from unittest.mock import patch

from backend.cli import main


ROOT = Path(__file__).resolve().parents[2]


class CliTests(unittest.TestCase):
    def invoke(self, *arguments):
        return subprocess.run(
            [sys.executable, '-B', '-m', 'backend.cli', *arguments],
            cwd=ROOT, capture_output=True, text=True, timeout=90,
        )

    def test_help_and_argument_errors(self):
        help_result = self.invoke('--help')
        self.assertEqual(help_result.returncode, 0)
        self.assertIn('--channels', help_result.stdout)
        for arguments in [[], ['f'], ['f', '--channels', 'A', '--algorithm', 'bad'],
                          ['f', '--channels', 'A', '--eps', 'bad'],
                          ['f', '--channels', 'A', '--algorithm', 'kmeans', '--eps', '1']]:
            with self.subTest(arguments=arguments):
                result = self.invoke(*arguments)
                self.assertEqual(result.returncode, 2)
                self.assertEqual(result.stdout, '')
                self.assertIn('error:', result.stderr)

    def test_options_forwarded_once_and_stdout_is_json(self):
        stdout, stderr = io.StringIO(), io.StringIO()

        def analyze(*args, **kwargs):
            print('library diagnostic')
            return {'source_file': args[0], 'labels': [0, -1]}

        with patch('backend.analyzer.analyze_fcs', side_effect=analyze) as analyze_mock:
            with redirect_stdout(stdout), redirect_stderr(stderr):
                code = main(['file with spaces.fcs', '--channels', 'B', 'A',
                             '--algorithm', 'hdbscan', '--min-cluster-size', '3',
                             '--min-samples', '2', '--no-standardize',
                             '--minimum-population-size', '4'])
        self.assertEqual(code, 0)
        analyze_mock.assert_called_once_with(
            'file with spaces.fcs', ['B', 'A'], algorithm='hdbscan',
            parameters={'min_samples': 2, 'min_cluster_size': 3},
            standardize=False, minimum_population_size=4,
        )
        self.assertEqual(json.loads(stdout.getvalue())['labels'], [0, -1])
        self.assertEqual(stderr.getvalue(), 'library diagnostic\n')

    def test_runtime_and_serialization_errors(self):
        for options in [{'side_effect': OSError('unreadable file')},
                        {'return_value': {'invalid': float('nan')}}]:
            stdout, stderr = io.StringIO(), io.StringIO()
            with patch('backend.analyzer.analyze_fcs', **options):
                with redirect_stdout(stdout), redirect_stderr(stderr):
                    code = main(['f', '--channels', 'A'])
            self.assertEqual(code, 1)
            self.assertEqual(stdout.getvalue(), '')
            self.assertFalse(json.loads(stderr.getvalue())['success'])

    def test_real_fcs_all_algorithms_and_validation(self):
        import flowio
        from backend.analyzer import analyze_fcs

        with tempfile.TemporaryDirectory() as directory:
            path = str(Path(directory) / 'sample with spaces.fcs')
            with open(path, 'wb') as handle:
                flowio.create_fcs(handle, [10, 100, 11, 101, 30, 300, 31, 301], ['A', 'B'])
            for algorithm, flags, parameters in [
                ('dbscan', ['--eps', '.3', '--min-samples', '2'],
                 {'eps': .3, 'min_samples': 2}),
                ('kmeans', ['--n-clusters', '2'], {'n_clusters': 2}),
                ('hdbscan', ['--min-cluster-size', '2', '--min-samples', '1'],
                 {'min_cluster_size': 2, 'min_samples': 1}),
            ]:
                with self.subTest(algorithm=algorithm):
                    result = self.invoke(path, '--channels', 'B', 'A', '--algorithm',
                                         algorithm, *flags, '--minimum-population-size', '3')
                    self.assertEqual(result.returncode, 0, result.stderr)
                    expected = analyze_fcs(path, ['B', 'A'], algorithm, parameters,
                                           minimum_population_size=3)
                    self.assertEqual(json.loads(result.stdout), expected)
            for flags in [['--channels', 'missing'], ['--channels', 'A', '--eps', '-1'],
                          ['--channels', 'A', '--minimum-population-size', '0']]:
                result = self.invoke(path, *flags)
                self.assertEqual(result.returncode, 1)
                self.assertEqual(result.stdout, '')
                self.assertFalse(json.loads(result.stderr)['success'])
        missing = self.invoke(path, '--channels', 'A')
        self.assertEqual(missing.returncode, 1)
        self.assertEqual(missing.stdout, '')
        self.assertFalse(json.loads(missing.stderr)['success'])
