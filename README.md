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