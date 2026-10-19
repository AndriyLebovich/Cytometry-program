# Day 16: DBSCAN parameter experiments

The existing DBSCAN command, complete prepared dataset, event mapping and scatter plots are reused. No new clustering algorithm or small-cluster filtering was introduced.

## Running experiments

1. Load an FCS file and prepare the desired clustering channels. StandardScaler is enabled by default; eps is measured in prepared data units.
2. In DBSCAN parameter experiments, enter comma-separated min_samples values (default: 5, 10, 20; at most five distinct values).
3. Run parameter experiments. Each minimum is tested with eps 0.1, 0.2, 0.3, 0.5 and 0.7, sequentially on all retained events.
4. Compare cluster counts, noise counts/percentages, smallest cluster, clusters below 1% of retained events, and largest cluster percentage. Percentages use all retained events, including noise.
5. Use View to inspect a run with the existing original-versus-cluster scatter plots. The displayed parameters identify the run independently of the single-run input fields.

Completed results remain available if a subsequent run fails. Preparing another dataset clears the experiment results. Unmounting the analysis stops scheduling further runs after the current Python call finishes.

## Controlled experiment observations

Automated tests use nine one-dimensional events in prepared units: 0, 0.15, 0.3, 0.8, 0.95, 1.1, 3, 3.15, 9.

| eps | min_samples | Cluster sizes | Noise |
| --- | --- | --- | --- |
| 0.1 | 2 | none | 9 |
| 0.2 | 2 | 3, 3, 2 | 1 |
| 0.2 | 3 | 3, 3 | 3 |
| 0.2 | 5 | none | 9 |
| 0.7 | 2 | 6, 2 | 1 |
| 10 | 2 | 9 | 0 |

The test runs all five required eps values with minimums 2, 3 and 5. The additional eps 10 case demonstrates a single cluster on this particular dataset. Increasing eps connects the two triplets; increasing min_samples removes the pair and can turn everything into noise. These are mathematical observations on synthetic data, not biological conclusions or recommended FCS parameters.

## Verification and limits

Backend regression tests cover preprocessing, FCS file loading, manual gating, K-Means, DBSCAN, event mapping and the controlled parameter experiment. Frontend tests cover experiment combinations and sequential execution, input validation, partial failure, summaries and existing population analysis. Frontend production build and lint are checked separately.

Manual Electron GUI verification and experiments on a representative user FCS sample remain outstanding; no such sample is stored in this repository. The existing FCS regression uses a generated FCS fixture. Day 16 is partially complete pending those manual checks. Large datasets can make a series of DBSCAN runs slow. No parameter is automatically declared optimal, and cluster identifiers are local to each run.
