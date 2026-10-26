"""Terminal entry point for the unified analyzer: python -m backend.cli."""

import argparse
from contextlib import redirect_stdout
import json
import sys


def main(argv=None):
    parser = argparse.ArgumentParser(description="Analyze an FCS file and return JSON.")
    parser.add_argument("file_path", help="Input .fcs file")
    parser.add_argument("--channels", nargs="+", required=True,
                        help="Clustering channels, in analysis order")
    parser.add_argument("--algorithm", choices=("kmeans", "dbscan", "hdbscan"),
                        default="dbscan")
    parser.add_argument("--standardize", action=argparse.BooleanOptionalAction,
                        default=True, help="Apply StandardScaler (default: enabled)")
    parser.add_argument("--minimum-population-size", type=int, default=1)
    parser.add_argument("--n-clusters", type=int, help="K-Means cluster count")
    parser.add_argument("--eps", type=float, help="DBSCAN neighborhood radius")
    parser.add_argument("--min-samples", type=int, help="DBSCAN/HDBSCAN minimum samples")
    parser.add_argument("--min-cluster-size", type=int, help="HDBSCAN minimum cluster size")
    args = parser.parse_args(argv)
    allowed = {"kmeans": {"n_clusters"}, "dbscan": {"eps", "min_samples"},
               "hdbscan": {"min_cluster_size", "min_samples"}}
    parameters = {}
    for name in ("n_clusters", "eps", "min_samples", "min_cluster_size"):
        value = getattr(args, name)
        if value is not None:
            if name not in allowed[args.algorithm]:
                parser.error(f"--{name.replace('_', '-')} is not supported by {args.algorithm}")
            parameters[name] = value

    try:
        # Keep dependency diagnostics away from the machine-readable stdout stream.
        with redirect_stdout(sys.stderr):
            from .analyzer import analyze_fcs

            result = analyze_fcs(
                args.file_path, args.channels, algorithm=args.algorithm,
                parameters=parameters, standardize=args.standardize,
                minimum_population_size=args.minimum_population_size,
            )
            payload = json.dumps(result, allow_nan=False)
    except Exception as error:
        print(json.dumps({"success": False, "message": str(error)}), file=sys.stderr)
        return 1
    print(payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
