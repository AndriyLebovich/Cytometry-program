"""Numerical preprocessing independent of FCS loading and the UI."""

import numpy as np
from sklearn.preprocessing import StandardScaler


def preprocess_events(events, available_channels, channels, standardize=True):
    """Keep finite rows in chosen channel order, retaining original row positions."""
    if not isinstance(channels, list) or not channels:
        raise ValueError("Select at least one clustering channel")
    if any(not isinstance(channel, str) for channel in channels):
        raise ValueError("Channel names must be strings")
    if len(set(channels)) != len(channels):
        raise ValueError("Clustering channels must be unique")
    if any(channel not in available_channels for channel in channels):
        raise ValueError("Unknown clustering channel")
    if not isinstance(standardize, bool):
        raise ValueError("standardize must be a boolean")
    matrix = np.asarray(events, dtype=float)
    if matrix.ndim != 2 or matrix.shape[1] != len(available_channels):
        raise ValueError("Event matrix does not match available channels")
    selected = matrix[:, [available_channels.index(channel) for channel in channels]]
    valid = np.isfinite(selected).all(axis=1)
    clean = selected[valid].copy()
    scaler = None
    if standardize and len(clean):
        fitted = StandardScaler()
        clean = fitted.fit_transform(clean)
        scaler = {"mean": fitted.mean_.tolist(), "scale": fitted.scale_.tolist()}
    if not np.isfinite(clean).all():
        raise ValueError("Preprocessing produced non-finite values")
    return {
        "channels": channels.copy(),
        "data": clean.tolist(),
        "event_indices": np.flatnonzero(valid).tolist(),
        "removed_event_indices": np.flatnonzero(~valid).tolist(),
        "input_count": len(matrix),
        "retained_count": len(clean),
        "removed_count": int((~valid).sum()),
        "standardized": standardize,
        "scaler": scaler,
    }


def preprocess_fcs(file_path, channels, standardize=True):
    import flowkit

    if not isinstance(file_path, str) or not file_path:
        raise ValueError("Missing file_path")
    sample = flowkit.Sample(file_path)
    result = preprocess_events(
        sample.get_events(source="raw"), list(sample.pnn_labels), channels, standardize,
    )
    result["source_file"] = file_path
    return result
