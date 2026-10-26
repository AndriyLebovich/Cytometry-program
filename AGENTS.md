# AGENTS.md

## Project

This is a university practice project called **FCS Analyzer**.

The goal is to build a desktop application for semi-automated analysis of Flow Cytometry `.fcs` files.

The application combines:

- FCS data inspection;
- scatter plot visualization;
- manual rectangular gating;
- selected population analysis;
- later automatic clustering and noise detection.

The project is an MVP and is not intended to replace professional flow cytometry software.

---

## Source of Truth

Use the files in the repository as the primary source of context.

- `Roadmap.md` — long-term development plan.
- Current source code — actual implementation state.
- `AGENTS.md` — development rules and constraints.

Before implementing a roadmap step:

1. Read the relevant section of `Roadmap.md`.
2. Inspect the current implementation.
3. Determine what is already implemented.
4. Implement only the requested step.
5. Preserve existing working functionality.

Do not assume that an item from `Roadmap.md` is already implemented just because it is planned.

---

## Current State

**Day 20 is implemented and verified by automated tests, lint and frontend build. Verification is partial: manual Electron GUI verification and representative user FCS validation remain outstanding.**

Current functionality includes:

- FCS file loading;
- channel listing;
- event count;
- channel statistics;
- scatter plot;
- X/Y channel selection;
- rectangular gating;
- Apply Gate / Clear Gate;
- selected population detection;
- selected event data;
- population percentage;
- Min / Max / Mean / Median statistics;
- selected population histogram;
- automatic gate clearing when X/Y channels change.
- independent selected population datasets;
- session collection of saved populations with identifiers, gates and statistics;
- clustering channel selection, NaN/infinity removal and optional StandardScaler;
- complete preprocessed numerical data with original event indices and a preview.
- K-Means baseline on prepared data with labels, original event indices and cluster sizes;
- original versus colored cluster scatter comparison in original channel units;
- DBSCAN on prepared data with configurable eps/min_samples, original event indices, cluster sizes and gray noise visualization.

- DBSCAN parameter experiments across eps/min_samples with summaries and selectable scatter results;
- HDBSCAN on complete prepared data with configurable min_cluster_size/min_samples, original event indices, cluster sizes and gray noise visualization;
- paired DBSCAN/HDBSCAN comparison on identical complete prepared data, cluster/noise/size summaries and shared-axis scatter plots.
- reversible minimum population size filtering on complete clustering assignments, including a shared comparison threshold, updated noise summaries and gray filtered points; original assignments, event indices and survivor identifiers/colors are preserved.

- independent unified Python analyzer (`backend.analyzer.analyze_fcs`) with one FCS load, reused preprocessing/clustering, original and filtered assignments, preserved event mapping and original-unit cluster/noise statistics; UI integration is not part of Day 20.

Day 20 automated checks: 26 Python tests (including 5 analyzer tests and generated FCS integration), 17 frontend tests (including actual React SVG rendering), lint and build passed. Manual Electron and representative user FCS validation remain outstanding; overall verification is partial.

**Next roadmap step: Day 21 - Python CLI (only when requested).**

The roadmap is currently in README.md; Roadmap.md is absent.

Do not implement future clustering stages unless explicitly requested.

The Current State section is a snapshot, not guaranteed to be up to date. Always verify the actual implementation before relying on it. Update the Current State section only after the requested roadmap day has been implemented and verified.

---

## Architecture

Current architecture:

```text
React + TypeScript
        ↓
Electron
        ↓
Node.js
        ↓
Python
        ↓
FlowKit / Pandas / NumPy
```

Planned architecture additionally includes:

```text
scikit-learn / HDBSCAN
        ↓
automatic clustering
        ↓
JSON
        ↓
React visualization
```

Keep Python analysis sufficiently independent from the UI.

Do not introduce a database, HTTP server, cloud infrastructure, Docker, authentication, or other unnecessary architecture.

---

## Important Project Rules

### 1. Work incrementally

Implement roadmap tasks step by step.

Preferred workflow:

```text
Inspect
  ↓
Implement small change
  ↓
Build / test
  ↓
Verify
  ↓
Continue
```

Do not implement several future roadmap days at once.

### 2. Preserve existing functionality

Avoid unnecessary rewrites or architectural changes.

Reuse existing code when possible.

Do not replace working functionality without a clear reason.

### 3. Manual gating is intentional

Rectangular gating is an important part of the project's semi-automated workflow.

Do not remove or replace manual gating when automatic clustering is introduced.

The long-term application should support both:

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

### 4. Clustering comes later

The planned automatic analysis sequence is:

```text
Preprocessing
    ↓
K-Means
    ↓
DBSCAN
    ↓
DBSCAN experiments
    ↓
HDBSCAN
    ↓
Comparison
    ↓
Small-cluster filtering
```

Do not introduce clustering into the current Day 11 work unless explicitly requested.

### 5. Small-cluster filtering is postponed

Filtering tiny clusters is a planned feature, but it should only be implemented during the later clustering stages.

Do not add it to the current manual-gating workflow.

---

## Code Rules

### TypeScript

- Keep types and interfaces consistent with backend JSON.
- Avoid `any` unless necessary.
- Do not suppress TypeScript errors.
- Preserve existing state and component structure unless a change is required.

After frontend changes, run:

```powershell
npm run build
```

### Python

- Keep the analysis code readable and independently testable.
- Return structured data.
- Handle empty datasets safely.
- Validate important inputs.
- Do not silently hide errors.

When changing Python output structures, update the corresponding TypeScript types and frontend handling.

---

## FCS Data

FCS files are currently processed using **FlowKit**.

Selected populations contain complete event information and should remain available for further analysis.

Keep the distinction between:

- scatter points used for visualization;
- complete selected events used for analysis.

Do not unnecessarily reload or recompute data that is already available.

---

## Scientific Interpretation

Automatically detected clusters are mathematical groups, not automatically biologically validated populations.

Use terminology such as:

- detected cluster;
- detected population;
- selected population;
- noise;
- outlier.

Do not claim that an algorithmically detected cluster is biologically correct without appropriate validation.

---

## Git

Prefer small, focused commits.

Use descriptive commit messages such as:

```text
Complete Day 11 selected population dataset
```

Before committing:

```powershell
git status
```

Do not rewrite Git history unless explicitly requested.

Do not create Git commits, push changes, or modify Git history unless explicitly requested by the user.

---

## Definition of Done

A roadmap day is considered complete only when:

1. All requested tasks are implemented or explicitly identified as already implemented.
2. Relevant tests pass.
3. The frontend build succeeds if frontend code was changed.
4. Existing related functionality remains working.
5. No unrelated roadmap features were introduced.
6. Any limitations or unverified behavior are clearly reported.

If verification is incomplete, report the day as partially completed.

Do not mark a roadmap day as complete solely because the code compiles.

## When Implementing a Roadmap Day

Before coding:

1. Read the relevant section of `Roadmap.md`.
2. Inspect the existing code.
3. Identify what is already implemented.

Then:

1. Explain the current step.
2. Make the smallest necessary change.
3. Run the appropriate build/test.
4. Fix errors.
5. Verify existing functionality.
6. Move to the next step only after the current one works.

Do not skip directly to later roadmap stages.
