# Project Roadmap

## Project Goal

The goal of the project is to build a desktop application for semi-automated analysis of Flow Cytometry `.fcs` files.

The application should help a user analyze flow cytometry event data by:

- loading an `.fcs` file;
- reading available channels and events;
- selecting channels for analysis;
- visualizing event distributions using scatter plots and histograms;
- manually selecting cell populations using rectangular gates;
- calculating statistics for selected populations;
- analyzing selected populations as separate datasets;
- preprocessing data for automated analysis;
- detecting dense groups of events using clustering algorithms;
- identifying events that do not belong to sufficiently dense groups as noise/outliers;
- comparing manually selected populations with automatically detected populations;
- displaying statistics for populations and noise;
- exporting analysis results.

The intended workflow is:

```text
FCS file
   ↓
FCS parsing
   ↓
Channel selection
   ↓
Visualization
   ↓
Manual gating
   ↓
Selected population
   ↓
Population analysis
   ↓
Data preprocessing
   ↓
Automatic clustering
   ↓
Population / noise detection
   ↓
Comparison and statistics
   ↓
Visualization
   ↓
Export
```

The application is intended as a realistic MVP rather than a complete replacement for professional flow cytometry software such as FlowJo or FCS Express.

The project follows a semi-automated approach: the user can manually define a population using gating, while automatic clustering will later provide an additional method for population and noise detection.

The application should not claim that every mathematically detected cluster necessarily represents a biologically correct population.

---

# Roadmap

## Day 1 — Python Project Setup

**Goal**

Create the Python environment and install the libraries required for FCS data processing and analysis.

**Tasks**

- Create the Python virtual environment.
- Install the required Python libraries.
- Establish the initial Python project structure.
- Verify that the Python environment works.
- Prepare the project for FCS data processing.

**Expected Result**

A working Python environment capable of processing FCS data.

---

## Day 2 — React + TypeScript Project Setup

**Goal**

Create the frontend application using React and TypeScript.

**Tasks**

- Create the React project using Vite.
- Configure TypeScript.
- Verify that Node.js and npm work correctly.
- Start the React development application.
- Establish the initial frontend structure.

**Expected Result**

A working React + TypeScript application.

---

## Day 3 — Electron Setup

**Goal**

Turn the React application into a desktop application using Electron.

**Tasks**

- Install Electron.
- Create the Electron main process.
- Create the Electron preload script.
- Connect Electron with the React frontend.
- Verify that the application runs as a desktop window.

**Expected Result**

The React application runs inside an Electron desktop application.

---

## Day 4 — FCS File Reader

**Goal**

Make Python capable of reading Flow Cytometry `.fcs` files.

**Tasks**

- Implement FCS file loading using FlowKit.
- Read event data from an `.fcs` file.
- Access available channel information.
- Verify that real FCS data can be loaded.

**Expected Result**

Python can successfully open an `.fcs` file and provide its event data and channel information.

---

## Day 5 — Channel Listing and Statistics

**Goal**

Inspect the contents of an FCS file and obtain basic statistics.

**Tasks**

- List all available channels.
- Access channel names and event values.
- Calculate basic statistics.
- Determine the number of events.
- Prepare the information required for channel selection.

**Expected Result**

The application can report available channels, event count, and basic channel statistics.

---

## Day 6 — Initial Scatter Plot

**Goal**

Visualize FCS events using two selected channels.

**Tasks**

- Select two FCS channels.
- Create a scatter plot.
- Display events as individual points.
- Add basic axis information.
- Allow the user to inspect the distribution of events.

**Expected Result**

A working scatter plot showing the distribution of FCS events.

---

## Day 7 — Interactive Channel Selection

**Goal**

Allow the user to select the channels used for visualization.

**Tasks**

- Add X-axis channel selection.
- Add Y-axis channel selection.
- Reload scatter data when channels change.
- Connect channel selection with the FCS data.
- Prepare the scatter plot for interactive analysis.

**Expected Result**

The user can freely select the X and Y channels used in the scatter plot.

---

## Day 8 — Python FCS Integration

**Goal**

Establish a reliable Python-side interface for retrieving FCS data required by the frontend.

**Tasks**

- Implement structured FCS data responses.
- Return channel information.
- Return event counts.
- Return channel statistics.
- Return scatter plot data.
- Establish JSON-based communication structures.

**Expected Result**

The Python side can provide structured FCS information and scatter data to the application.

---

## Day 9 — Rectangular Gating

**Goal**

Allow the user to manually select a population on the scatter plot.

**Tasks**

- Implement rectangular gate drawing.
- Allow the user to define X and Y boundaries.
- Add an **Apply Gate** action.
- Add a **Clear Gate** action.
- Determine which events are inside the gate.
- Calculate the number and percentage of selected events.

**Expected Result**

The user can manually select a population of events using a rectangular gate.

---

## Day 10 — Selected Population Analysis

**Goal**

Perform an initial quantitative analysis of the population selected with a gate.

**Tasks**

- Highlight events inside the gate.
- Store the selected population.
- Store complete selected event data.
- Display gate boundaries.
- Calculate Min / Max / Mean / Median for selected channels.
- Display population statistics in a table.
- Generate a histogram for the selected population.
- Allow the user to select the histogram channel.
- Automatically clear the gate when X/Y channels are changed.

**Expected Result**

The application can select a population and perform basic quantitative analysis of that population.

---

## Day 11 — Selected Population as a Separate Dataset

**Goal**

Treat the population selected through a gate as an independent dataset for further analysis.

**Tasks**

- Preserve selected events independently from the original scatter data.
- Create a clear data structure for selected populations.
- Allow further analysis to operate on selected events.
- Verify that statistics and distributions are calculated only from the selected population.
- Prepare the data structure for future population comparison.

**Expected Result**

A gated population can be treated as an independent dataset for subsequent analysis.

---

## Day 12 — Population Management and Comparison Foundation

**Goal**

Prepare the application for working with multiple selected populations.

**Tasks**

- Preserve gate information.
- Preserve population statistics.
- Define a structure for multiple populations.
- Prepare population identifiers.
- Prepare the architecture for comparing different selected populations.

**Expected Result**

The application has a foundation for working with and comparing multiple populations.

---

## Day 13 — Data Preprocessing

**Goal**

Prepare FCS data for automated clustering.

**Tasks**

- Select clustering channels.
- Remove invalid `NaN` values.
- Remove infinite values.
- Prepare numerical data.
- Preserve the relationship between processed data and original events.
- Apply `StandardScaler` where appropriate.

**Expected Result**

A clean and normalized dataset ready for automated clustering.

---

## Day 14 — K-Means Baseline

**Goal**

Create an initial automated clustering baseline.

**Tasks**

- Apply K-Means to the preprocessed data.
- Assign cluster labels to events.
- Visualize the resulting clusters.
- Compare the result with the original scatter plot.
- Use K-Means as a baseline for density-based algorithms.

**Expected Result**

The project has a working automated clustering baseline.

---

## Day 15 — DBSCAN

**Goal**

Introduce density-based clustering.

**Tasks**

- Implement DBSCAN using `scikit-learn`.
- Apply DBSCAN to the preprocessed data.
- Obtain cluster labels.
- Identify DBSCAN noise.
- Visualize the resulting populations.

**Expected Result**

DBSCAN can automatically identify dense groups of events and mark events outside those groups as noise.

---

## Day 16 — DBSCAN Parameter Experiments

**Goal**

Understand how DBSCAN parameters affect population detection.

**Tasks**

Test different values of `eps`, including:

```text
0.1
0.2
0.3
0.5
0.7
```

Study:

- excessive noise;
- very small clusters;
- merging of separate populations;
- formation of a single large cluster;
- influence of `min_samples`.

**Expected Result**

A practical understanding of how DBSCAN parameters affect FCS population detection.

---

## Day 17 — HDBSCAN

**Goal**

Test HDBSCAN as an alternative density-based clustering algorithm.

**Tasks**

- Install and configure HDBSCAN.
- Apply HDBSCAN to preprocessed FCS data.
- Obtain cluster labels.
- Identify noise/outlier events.
- Visualize the resulting populations.

**Expected Result**

A working HDBSCAN implementation capable of detecting dense populations and noise.

---

## Day 18 — DBSCAN vs HDBSCAN

**Goal**

Compare the two density-based clustering approaches.

**Tasks**

- Run DBSCAN on the same dataset.
- Run HDBSCAN on the same dataset.
- Compare the number of clusters.
- Compare the amount of noise.
- Compare population sizes.
- Compare visual structures.
- Identify which behavior is more useful for the MVP.

**Expected Result**

A practical understanding of the differences between DBSCAN and HDBSCAN for FCS data.

---

## Day 19 — Small Cluster Filtering

**Goal**

Prevent insignificant small clusters from being treated as meaningful populations.

**Tasks**

- Calculate the number of events in each cluster.
- Define a minimum population size.
- Identify very small clusters.
- Treat sufficiently small groups as noise/outliers where appropriate.
- Verify the effect on the visualization.

**Expected Result**

The clustering result is cleaned from insignificant tiny groups.

---

## Day 20 — Unified Python Analyzer

**Goal**

Combine FCS processing and automated clustering into one analysis pipeline.

**Tasks**

Create a unified analyzer performing:

```text
FCS loading
    ↓
Channel selection
    ↓
Data cleaning
    ↓
Scaling / preprocessing
    ↓
Clustering
    ↓
Noise detection
    ↓
Small-cluster filtering
    ↓
Statistics
```

The analyzer should produce structured results suitable for communication with the application.

**Expected Result**

A single Python analysis pipeline capable of taking FCS data and producing clustering results and statistics.

---

## Day 21 — Python CLI

**Goal**

Make the Python analyzer executable independently.

**Tasks**

- Define command-line input for an `.fcs` file.
- Pass analysis parameters to the analyzer.
- Allow channel selection.
- Allow clustering parameters to be specified.
- Return machine-readable results.
- Prepare the analyzer to be called by Node.js.

**Expected Result**

The Python analyzer can run independently from the terminal and return structured analysis results.

---

## Day 22 — Node.js Launches Python

**Goal**

Connect the Node.js/Electron side with the Python analyzer.

**Tasks**

- Use Node.js `child_process.spawn()`.
- Launch Python from Electron/Node.js.
- Pass the FCS file and analysis parameters.
- Receive Python output.
- Handle Python errors and exit codes.

**Expected Result**

Electron/Node.js can start the Python analyzer and receive its result.

---

## Day 23 — Electron IPC

**Goal**

Create reliable communication between React, Electron, and Python.

**Tasks**

- Configure Electron IPC.
- Expose safe functionality through the preload script.
- Allow React to request an analysis.
- Pass requests from React to Electron.
- Let Electron start Python.
- Return structured results to React.

**Expected Result**

The complete communication chain works:

```text
React
  ↓
Electron IPC
  ↓
Node.js
  ↓
Python
  ↓
JSON
  ↓
React
```

---

## Day 24 — Automatic Cluster Visualization

**Goal**

Visualize automatically detected populations and noise.

**Tasks**

- Display cluster labels.
- Display different populations separately.
- Display noise separately.
- Connect cluster results to the scatter plot.
- Allow the user to inspect the detected populations.

**Expected Result**

The application can visually distinguish automatically detected populations and noise.

---

## Day 25 — Manual Gating + Automatic Clustering

**Goal**

Combine the two population analysis approaches.

**Tasks**

Support both:

```text
Manual Gate
    ↓
Selected Population
```

and:

```text
Automatic Clustering
    ↓
Detected Populations + Noise
```

Allow their results to be examined within the same application.

Prepare the architecture for comparing manually selected populations with automatically detected populations.

**Expected Result**

The application provides both manual and automatic population detection within one analysis workflow.

---

## Day 26 — Statistics Panel

**Goal**

Create a unified statistics interface.

**Tasks**

Display information such as:

- total number of events;
- selected population size;
- percentage of selected population;
- number of automatically detected clusters;
- number of events in each cluster;
- percentage of each cluster;
- number of noise events;
- percentage of noise;
- Min / Max / Mean / Median for populations.

**Expected Result**

The application provides a complete numerical summary of manual and automatic population analysis.

---

## Day 27 — Export CSV / PNG

**Goal**

Allow the user to save analysis results.

**Tasks**

- Add CSV export.
- Export population statistics.
- Export clustering results.
- Add PNG export for scatter plots.
- Preserve cluster and noise information.

**Expected Result**

The user can save analysis data and visualizations outside the application.

---

## Day 28 — Testing on Multiple FCS Files

**Goal**

Test the complete analysis pipeline on real FCS datasets.

**Tasks**

- Test the application on multiple FCS files.
- Use datasets with different event counts.
- Test different channel combinations.
- Test manual gating.
- Test automatic clustering.
- Test different clustering parameters.
- Record unexpected results.

**Expected Result**

A collection of observations about the behavior of the application across different FCS datasets.

---

## Day 29 — Algorithm Inspection and Documentation

**Goal**

Inspect problematic results and document the final architecture.

**Tasks**

Analyze cases involving:

- excessive noise;
- merged populations;
- split populations;
- insignificant small clusters;
- inappropriate clustering parameters;
- differences between manual gates and automatically detected populations.

Document:

- project architecture;
- FCS processing;
- manual gating;
- preprocessing;
- clustering;
- population analysis;
- statistics;
- React/Electron/Python communication;
- important assumptions and limitations.

**Expected Result**

The project has documented architecture and a clear understanding of the strengths and limitations of its analysis methods.

---

## Day 30 — Final Build and Testing

**Goal**

Prepare the complete MVP for final testing.

**Tasks**

- Build the complete application.
- Verify that the frontend builds successfully.
- Verify that Electron starts correctly.
- Verify that Python can be launched from the application.
- Test FCS loading.
- Test channel selection.
- Test scatter visualization.
- Test manual gating.
- Test selected population analysis.
- Test automatic clustering.
- Test noise detection.
- Test statistics.
- Test export.
- Perform a final end-to-end test.

**Expected Result**

A working desktop MVP capable of:

```text
Load FCS
   ↓
Select channels
   ↓
Visualize data
   ↓
Manually select a population
   ↓
Analyze selected population
   ↓
Preprocess data
   ↓
Automatically detect populations
   ↓
Detect noise
   ↓
Filter insignificant clusters
   ↓
Compare / inspect results
   ↓
Display statistics
   ↓
Export results
```

---

# Development Principles

- The project should remain a realistic MVP rather than attempting to reproduce the full functionality of professional flow cytometry software.
- The application follows a semi-automated analysis approach combining manual gating and automatic population detection.
- Manual gating is used to allow the user to explicitly select and analyze a population.
- Automatic clustering is used to explore dense populations and noise without requiring the user to define every population manually.
- Mathematical clusters should not automatically be treated as biologically correct populations.
- DBSCAN and HDBSCAN are the main density-based approaches for automatic population detection.
- K-Means is used as a baseline for comparison.
- Clustering behavior should be tested experimentally on real FCS data.
- Small-cluster filtering should be treated as a separate analysis step rather than assuming every detected cluster is meaningful.
- The Python analysis component should remain sufficiently independent from the Electron/React interface so that it can be tested separately.
- Communication between the desktop interface and the analysis engine should use structured data, represented as JSON.
- The project should avoid unnecessary complexity such as deep learning, 3D analysis, databases, cloud infrastructure, authentication, Docker, or a separate Python HTTP server.

The target architecture is:

```text
Electron
  ├── React + TypeScript frontend
  │
  └── Node.js main process
          ↓
       Python analyzer
          ↓
     FlowKit / NumPy / Pandas /
     SciPy / scikit-learn / HDBSCAN
          ↓
        JSON
          ↓
     React visualization
```

---

# Future Development

The current roadmap focuses on building and testing the semi-automated MVP.

Potential future development may include:

- more advanced gating tools;
- polygonal gates;
- multiple simultaneous gates;
- hierarchical population analysis;
- additional clustering algorithms;
- more advanced preprocessing;
- improved visualization;
- population comparison;
- more advanced filtering techniques.

These features should only be considered after the core manual-gating and automatic-clustering workflows have been implemented and tested.

---

# Accuracy Notes

The roadmap has been adapted from the original project plan to reflect the actual development progress.

The main change is that manual gating and selected-population analysis were implemented before automatic clustering. These features are now considered an intentional part of the project's semi-automated workflow rather than temporary deviations from the roadmap.

The current implementation has completed **Day 10**.

The next development stage is **Day 11 — Selected Population as a Separate Dataset**.

The roadmap preserves the original long-term goal of implementing K-Means, DBSCAN, HDBSCAN, noise detection, small-cluster filtering, statistics, export, and final testing, while reorganizing their position to match the current architecture of the application.

## Day 11 implementation notes

The roadmap is currently maintained in this README; there is no separate Roadmap.md.

`frontend/src/population.ts` defines a selected population as complete event records,
channel names, source file and original event count. Scatter samples are visualization
only. Population statistics and histograms accept this dataset directly and do not
reload the FCS file. The dataset copies the gate response records and channels so later
changes to the response cannot change the population. Clear Gate, axis changes and
opening a file clear the active dataset. Pending gate responses cannot restore a cleared
population. Multiple population management and clustering remain future work.

Run `npm test` and `npm run build` from `frontend`.
Automated coverage includes independent records, all-channel statistics, selected-only
histograms, empty datasets, constant values and 200,000-event populations.
A real FCS regression also verified loading, scatter sampling, full-data gating and an
empty gate (37,395 source events / 10,000 scatter points / 14,274 selected events).
Interactive Electron verification remains pending: open a file, draw/apply a gate,
change the population histogram channel, clear the gate, change X/Y and open another
file. Day 11 is partially completed until this interactive check is performed.


## Day 12 implementation notes

The roadmap remains in this README (Day 12: Population Management and Comparison
Foundation). Existing Day 11 population statistics and histograms are reused.

Use **Save population** after Apply Gate to retain a population in the current
file session. Each snapshot has a UUID, name, complete independent event records,
source file and source event count, X/Y gate channels and numerical boundaries,
percentage and all-channel Min / Max / Mean / Median statistics. The collection
is keyed by population ID and retains source metadata for future comparisons.
Saved populations can be inspected under **Saved populations**. Saving the same
active result twice is disabled; applying another gate permits another save.
Clear Gate and axis changes clear only the active selection. Opening a file
clears the saved collection, including when file selection is cancelled, matching
the existing file-opening reset behavior. Data is held in memory for the current
session; disk persistence, comparison algorithms and clustering are outside Day 12.

Verification: all 6 population tests pass, including independent saved snapshots,
multiple identifiers/gates/statistics, empty populations and invalid gate metadata.
Interactive Electron verification remains pending: open an FCS file, save two
different gates, inspect their statistics, clear the active gate, change axes,
and confirm both snapshots remain; open another file and confirm the collection
clears. Day 12 is partially completed until this interactive workflow is verified.

## Day 13 — Data Preprocessing

Implemented: open an FCS file, choose **Clustering channels** under **Data preprocessing**, optionally disable **Standardize channels**, then click **Prepare dataset**.

Preprocessing uses all raw events, independently of scatter sampling and manual gates. Rows containing NaN or infinity in any chosen channel are removed. The dataset retains the chosen channel order, numerical rows, zero-based original event indices, removed event indices, counts, source file, and scaler mean/scale. StandardScaler is fitted only to retained rows; empty datasets are safe. The UI displays counts and a five-row preview while keeping the complete result in state. Results are cleared when preprocessing settings or the file change. No clustering is performed in Day 13.

Verification: `venv/Scripts/python.exe -m unittest discover -s backend/tests -v`; in `frontend`, run `npm test`, `npm run lint`, and `npm run build`. The Python integration test generates an FCS file and checks preprocessing alongside existing manual gating. Manual Electron GUI verification remains outstanding.

## Day 14 — K-Means Baseline

Implemented: prepare a dataset using Day 13, choose **Number of clusters**, and click **Run K-Means**. K-Means reuses the complete prepared matrix without reloading the FCS file or repeating preprocessing. Results retain labels and original event indices, cluster sizes, centers in preprocessing units, and inertia. Runs use `random_state=42` and `n_init=10` for a reproducible baseline.

The original retained-event scatter and colored cluster scatter use identical events, axis ranges, and original channel units (StandardScaler is inverted for display). Choose either axis from the preprocessing channels. Plots show up to 2,000 evenly sampled retained events; all retained events are clustered. Changing preprocessing settings or preparing a new dataset clears clustering results; changing the cluster count clears the previous result. Manual gating and saved populations remain available.

Empty datasets, invalid cluster counts, non-finite data, and requests for more clusters than distinct rows produce explicit errors. K-Means assigns every retained event and does not detect noise or biologically validate populations. DBSCAN, HDBSCAN, and small-cluster filtering are outside Day 14.

Automated verification passed: 8 Python tests (including known groups, original-event mapping, reproducibility, large JSON via stdin, legacy command compatibility, FCS reading and manual gating), 6 frontend population tests, lint, and frontend/Electron build. Manual Electron GUI verification remains outstanding, so verification of Day 14 is partial.

## Day 15 — DBSCAN

Implemented: after **Prepare dataset**, set **eps** (default 0.5) and **min_samples** (default 5), then click **Run DBSCAN**. scikit-learn DBSCAN uses all prepared rows without reloading FCS or repeating preprocessing. eps uses prepared units (standardized when StandardScaler is enabled). Labels retain original event indices; `-1` denotes noise. A KDTree count-only check selects the execution path: up to 5,000,000 neighbor links use scikit-learn DBSCAN; denser datasets use exact Euclidean DBSCAN expansion with scikit-learn KDTree queries, storing one neighborhood at a time. No events are sampled or discarded. The dense fallback reduces memory use but can still take quadratic time for difficult datasets. Electron reports the exit code if Python terminates without stderr. Results include cluster sizes and noise count/percentage, including the all-noise case.

The existing scatter component is shared with K-Means. Clusters use colors and noise is gray; original and labeled plots use matching events, axes and original channel units. Up to 2,000 retained events are displayed while all retained events are analyzed. Changing parameters or preprocessing clears results. K-Means, manual gating and saved populations remain available. Parameter experiments, HDBSCAN and small-cluster filtering remain outside Day 15. Clusters are mathematical groups, not biologically validated populations.

Verification: 12 Python tests and 6 frontend tests pass; lint and frontend/Electron build pass. Tests cover groups with noise, original-event mapping, all-noise data, duplicate/single events, validation, stdin integration and existing K-Means/FCS/manual gating. Manual Electron GUI verification remains outstanding; Day 15 verification is partial. Manual check: prepare an FCS dataset, run DBSCAN, inspect clusters/noise, change axes and parameters, rerun, and confirm preprocessing changes clear results; also verify K-Means and manual gating.
DBSCAN dense-data regression: 8 clustering tests pass, including forced fallback compared against scikit-learn on random data, duplicate points, separated groups and noise. A synthetic dense dataset of 750,000 events at eps=0.5 completed with one cluster and no noise in about 2.3 seconds (including input construction, excluding Python startup). This replaces the previous memory-budget rejection. The user-reported real FCS dataset remains unverified.

## Day 16: DBSCAN parameter experiments

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

## Day 17 - HDBSCAN

Implemented and automatically verified. Overall verification is partial: manual Electron GUI checks and validation on representative user FCS files remain outstanding.

## Existing functionality reused

Preprocessing, complete retained data/original event indices, optional StandardScaler, K-Means, DBSCAN, Day 16 experiments and scatter/noise rendering already existed. `hdbscan==0.8.44` was already pinned and installed; import was verified. No dependency installation or duplicate analysis pipeline was needed.

## Implementation and usage

Load an FCS file, select clustering channels and prepare data. In the new HDBSCAN panel, set `min_cluster_size` (default 5, minimum 2) and `min_samples` (default 5, minimum 1), then click **Run HDBSCAN**. Inspect cluster sizes, percentages, noise counts and the colored scatter; noise is gray. Choose X/Y channels to inspect other projections.

The backend runs `hdbscan.HDBSCAN` with Euclidean distance, EOM extraction and one core-distance worker. The `hdbscan` command uses the existing stdin JSON bridge and returns labels, original event indices, cluster count, cluster sizes and noise count. Label -1 denotes noise. Invalid parameters, empty/nonfinite matrices and invalid event mappings return structured errors; a singleton safely returns noise.

Clustering uses all retained events without reloading FCS. The shared scatter shows up to 2,000 sampled events in original channel units; counts use complete results. Changing parameters clears the displayed result. Preparing new data removes the previous panels/results through the existing workflow.

`min_cluster_size` controls HDBSCAN extraction. No later-stage post-clustering small-cluster filter or Day 18 algorithm comparison was introduced. Detected clusters are mathematical groups without biological validation.

Parameter semantics: [HDBSCAN API](https://hdbscan.readthedocs.io/en/latest/api.html), [parameter selection](https://hdbscan.readthedocs.io/en/latest/parameter_selection.html).

## Verification

- Python regression suite: 18 tests passed, including four new HDBSCAN tests and existing FCS parsing/manual gating checks.
- Additional generated FCS -> preprocessing -> HDBSCAN integration test passed: 19 Python tests in total across these runs.
- Controlled generated data produced two clusters of 30 events and one noise event, preserving original event indices and input data.
- Coverage includes invalid parameters, NaN/infinity, empty data, invalid indices, singleton, duplicates, all-noise output, JSON serialization and stdin success/errors.
- `npm test`: all 9 frontend regression tests passed.
- `npm run build`: Electron TypeScript, frontend TypeScript and Vite passed.
- Sandbox initially blocked Node child processes and Python temporary-file access; affected checks passed outside the sandbox.

Manual Electron checklist remains: load a representative FCS file, prepare channels, run HDBSCAN, inspect cluster colors/gray noise, change axes and parameters, re-prepare data, and check manual gating plus existing clustering panels. Generated FCS fixtures do not verify biological interpretation or performance on large user datasets.


## Day 18 - DBSCAN vs HDBSCAN

Implemented with automated verification. Overall verification remains partial pending
manual Electron checks and representative user FCS validation.

### Reused implementation

Day 15 DBSCAN, Day 16 experiments, Day 17 HDBSCAN, the stdin JSON bridge and
complete Day 13 prepared data already worked. The new comparison calls those same
commands sequentially; it does not reload FCS, repeat preprocessing or cluster a
scatter sample. The existing clustering component also renders comparison results.
Manual gating, saved populations and standalone clustering panels remain available.
No Day 19 small-cluster filtering was introduced.

### Usage

Prepare a dataset, then use **DBSCAN vs HDBSCAN**. Set DBSCAN eps/min_samples and
HDBSCAN min_cluster_size/min_samples independently. Click **Compare DBSCAN and
HDBSCAN**. The table compares cluster counts, noise counts/percentages and every
cluster size/percentage, using all retained events as denominator. Both successful
results must refer to identical original event indices in identical order before
the pair is displayed. A failure is reported without displaying an incomplete pair.

The two scatter plots share X/Y selectors, event samples and axis ranges, using
original channel units. Up to 2,000 events are shown; all retained events are
clustered. Noise is gray. Cluster identifiers/colors are local to each algorithm,
so matching identifiers do not imply matching populations. Parameter changes clear
the comparison. Preparing new data, changing preprocessing settings or opening
another file removes the comparison through the existing dataset lifecycle.
Unmounting stops scheduling the second command; an already running Python command
is allowed to finish and its stale response is ignored.

### Controlled observations and MVP decision

The regression fixture contains two Gaussian groups of 30 events, one invalid row
and one distant event. StandardScaler is applied after removing the invalid row;
both methods receive the same 61 rows and original event indices.

| Method | Parameters | Cluster sizes | Noise |
| --- | --- | --- | --- |
| DBSCAN | eps=0.1, min_samples=5 | 30, 30 | 1 (1.64%) |
| DBSCAN | eps=0.000001, min_samples=5 | none | 61 (100%) |
| DBSCAN | eps=100, min_samples=5 | 61 | 0 (0%) |
| HDBSCAN | min_cluster_size=10, min_samples=5 | 30, 30 | 1 (1.64%) |

On this fixture both methods recover the separated groups at the listed settings;
DBSCAN also demonstrates excessive noise and merging as eps changes. This is a
synthetic observation, not a recommended parameter set or biological validation.
For the MVP retain both: DBSCAN gives explicit radius control and existing parameter
experiments; HDBSCAN provides an alternative to inspect when radius selection is
problematic. Neither fewer noise events nor more clusters alone establishes better
populations. The fixture does not establish superiority on real FCS data, differing
densities or large datasets; that choice requires representative files and manual
inspection. No automatic winner or biological interpretation is assigned.

### Verification

- Existing Python regression suite: 19 tests passed, covering FCS loading, manual
  gating, preprocessing, K-Means, DBSCAN/experiments and HDBSCAN.
- Two additional Day 18 Python tests passed: same-data comparison, parameter effects,
  event mapping, input preservation and all-noise results (21 Python tests in total).
- Frontend: 12 tests passed, including identical complete payloads, independent
  parameters, sequential calls, failures, mismatched mappings, stale requests,
  validation and all-noise results.
- `npm run lint` and `npm run build` passed, including Electron TypeScript.
- Sandbox blocked Node child processes and Python temporary FCS access; affected
  checks passed with permission outside the sandbox.

Manual checklist: load a representative FCS file, prepare channels, run comparison,
inspect table totals and gray noise, change shared axes, change each algorithm's
parameters and rerun. Re-prepare data and open another file to check reset behavior;
verify manual gating, saved populations and standalone clustering still work.
Manual Electron GUI verification and representative FCS experiments remain pending,
so Day 18 verification is partial. Comparison can be slow on large datasets because
both complete analyses run sequentially.

## Day 19 - Small Cluster Filtering

Implemented as reversible postprocessing of complete clustering assignments.
Overall verification remains partial pending manual Electron checks and
representative user FCS validation.

### Reused implementation and behavior

Existing algorithms already return complete event labels, original event indices
and cluster sizes; scatter plots already render label `-1` as gray noise. Day 16
counts clusters below 1% for experiments but does not filter them. Day 19 reuses
these results and plots without rerunning Python, preprocessing or FCS loading.
The pure TypeScript helper is independent of React; backend JSON is unchanged.

Use **Minimum population size (events)** in a clustering panel or the shared
DBSCAN/HDBSCAN comparison. Default `1` preserves the original result. A cluster
with strictly fewer events than the threshold becomes noise; a cluster exactly
at the threshold survives. Counts use every analyzed event, never the scatter
sample. Existing noise remains noise and all event indices remain in order.
Invalid thresholds show an error and temporarily display the unfiltered result.

The filter applies to K-Means, DBSCAN, selected DBSCAN experiment results and
HDBSCAN. Comparison uses one threshold for both methods and updates its table
and both plots. Surviving cluster identifiers and colors stay stable; gaps in
identifiers are intentional. The summary reports before/after counts and added
noise. K-Means inertia continues to describe the original fit. Day 16 experiment
tables retain original algorithm results; the selected scatter and its summary
reflect the filter. Reset to `1` to restore assignments without recomputation.
Preparing another dataset resets the filter through the existing component lifecycle.

This is an optional size rule, separate from HDBSCAN `min_cluster_size`, not a
biological validity test. Small groups can be relevant; no universally appropriate
minimum is prescribed. Manual gating and saved population datasets are unchanged.
No Day 20 pipeline or later roadmap work was introduced.

### Verification

- Frontend: 17 tests passed, including threshold boundaries, complete assignments,
  unchanged inputs and event mapping, all-noise/empty/all-filtered cases, invalid
  thresholds, reversibility and existing regression tests.
- The actual React SVG renderer was checked for gray reassigned events, stable
  survivor colors and identifiers, preserved points and restored output.
- `npm run lint` and `npm run build` passed, including Electron TypeScript.
- Node test/build child processes required execution outside the sandbox.
- All 21 Python regression tests passed, including FCS loading, manual gating,
  preprocessing, existing clustering and comparison. Temporary FCS access required
  execution outside the sandbox.

Manual checklist: load a representative FCS file and prepare data; run each
algorithm and the paired comparison. Choose a threshold above a small cluster's
size, verify gray points, table totals and added noise; check exact-size equality,
all-filtered results and restoration with `1`. Select different experiment runs,
change axes, prepare data again and open another file. Confirm manual gating,
saved populations and standalone analysis still work. These manual Electron and
representative FCS checks remain outstanding, so Day 19 verification is partial.

## Day 20 - Unified Python Analyzer

Implemented in `backend/analyzer.py` as an independent Python API. Existing
preprocessing and all three clustering functions are reused. The frontend and
its reversible Day 19 filtering remain unchanged. No Day 21 CLI or later UI
integration is introduced.

```python
from backend.analyzer import analyze_fcs

result = analyze_fcs(
    "sample.fcs", ["FSC-A", "SSC-A"],
    algorithm="dbscan", parameters={"eps": 0.5, "min_samples": 5},
    standardize=True, minimum_population_size=10,
)
```

Run/import from the repository root. The file is loaded once; all raw events
are passed to existing channel selection, finite-row cleaning and optional
StandardScaler. Clustering uses every retained row, never a scatter sample.
Supported algorithms and defaults: `kmeans` (`n_clusters=2`), `dbscan`
(`eps=0.5`, `min_samples=5`), `hdbscan` (`min_cluster_size=5`, `min_samples=5`).
These are software defaults, not validated biological parameter recommendations.
Unknown algorithms/parameters and invalid settings raise errors. Empty or entirely
invalid selected data raise ValueError through existing clustering validation.
File and library errors propagate to the caller rather than being hidden.

The result contains:

- `preprocessing`: complete prepared matrix, channels, scaler, counts and retained/
  removed original indices;
- `original_clustering`: unchanged algorithm result, including fit metadata;
- `clustering`: filtered labels, original indices, cluster sizes and noise count;
- `filtering`: threshold, removed cluster identifiers and reassigned count;
- `statistics`: each surviving cluster and noise, with label, count, percentage
  and Min/Max/Mean/Median for selected channels in original units.

Filtering follows Day 19: sizes strictly below the threshold become `-1`; exact
equality survives, existing noise remains noise and survivor identifiers are
preserved. `statistics.clusters` explicitly associates identifiers with counts
(identifiers may have gaps). Percentages use all retained events as denominator.
Invalid rows are removed data, not noise. Empty noise has count/percentage zero
and null channel statistics. Original labels and the complete prepared data remain
available for further analysis. Results support strict JSON serialization;
non-finite statistics raise an error. Detected clusters are mathematical groups,
not biologically validated populations.

Verification: all 26 Python tests (21 existing plus 5 analyzer tests) and all 17
frontend regression tests passed; lint and frontend build passed. Tests include
generated FCS loading, one-load behavior, standalone algorithm equivalence,
cleaning/mapping, original-unit statistics, filtering boundaries, original result
preservation, empty/all-noise/all-filtered cases and invalid inputs. Sandbox blocked
temporary FCS access and Node child processes; affected checks passed outside it.
Manual Electron GUI checks and representative user FCS validation remain pending,
so overall Day 20 verification is partial. The new API is not yet exposed in UI.

## Day 21 - Python CLI

`backend/cli.py` provides a thin terminal interface to the existing Day 20
`analyze_fcs` API. It reuses loading, preprocessing, clustering, filtering and
statistics without duplicating them. Existing Electron commands are preserved.
Run from the repository root with the project's Python environment:

```powershell
.\venv\Scripts\python.exe -m backend.cli "C:\data\sample.fcs" --channels FSC-A SSC-A --algorithm dbscan --eps 0.5 --min-samples 5
.\venv\Scripts\python.exe -m backend.cli "C:\data\sample.fcs" --channels FSC-A SSC-A --algorithm kmeans --n-clusters 2 --no-standardize
.\venv\Scripts\python.exe -m backend.cli "C:\data\sample.fcs" --channels FSC-A SSC-A --algorithm hdbscan --min-cluster-size 5 --min-samples 5 --minimum-population-size 10
.\venv\Scripts\python.exe -m backend.cli --help
```

The file argument and `--channels` are required. Quote file paths and channel
names containing spaces. Channel order is preserved. Defaults are identical to
the Python API: DBSCAN, standardization enabled, minimum population size 1 and
the selected algorithm's existing parameter defaults. `--standardize` and
`--no-standardize` explicitly enable/disable scaling. Parameters belonging to a
different algorithm are rejected. These defaults are not biological guidance.

Process contract for a future Node.js caller:

- Exit `0`: stdout contains exactly one strict JSON result followed by a newline,
  with the unchanged Day 20 result structure (complete data and event mapping).
- Exit `1`: analysis/import/serialization failure; stdout is empty and stderr
  contains a JSON error with `success: false` and `message`. Library diagnostics
  may also appear on stderr; consume results only on exit `0`.
- Exit `2`: invalid command-line syntax or incompatible algorithm flags;
  argparse writes usage and an error to stderr, leaving stdout empty.
- `--help` writes human-readable help to stdout and exits `0`.

Dependency diagnostics are redirected to stderr. JSON is serialized completely
with `allow_nan=False` before stdout is written, preventing partial success
output on serialization failure. Capture stdout/stderr separately and pass
arguments as an array when adding the Node.js caller in Day 22. The CLI returns
the complete analysis and can produce large output; no export or sampling stage
is added here. Node.js/Electron integration is outside Day 21.

Verification: all 30 Python tests passed, including 4 CLI tests covering argument
validation, option forwarding, isolated stdout, strict serialization failure,
missing files, invalid analysis settings and real subprocess analysis of generated
FCS data with all three algorithms, compared with direct API results. All 17
frontend regression tests, lint and frontend build passed. Sandbox restrictions
on temporary FCS access and Node child processes required rerunning checks outside
the sandbox. Representative user FCS validation and manual Electron GUI checks
remain outstanding, so overall verification is partial.
