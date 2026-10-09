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

**Day 10 is complete.**

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

**Next step: Day 11 — Selected Population as a Separate Dataset.**

Do not implement future clustering stages unless explicitly requested.

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

---

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