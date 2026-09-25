import flowkit


def read_fcs(file_path, selected_channel=None):
    sample = flowkit.Sample(file_path)

    dataframe = sample.as_dataframe(source="raw")

    numeric_columns = dataframe.select_dtypes(include="number")

    statistics = {}

    for column in numeric_columns.columns:
        series = numeric_columns[column]

        channel_name = (
            column[0]
            if isinstance(column, tuple)
            else column
        )

        statistics[channel_name] = {
            "min": float(series.min()),
            "max": float(series.max()),
            "mean": float(series.mean()),
            "median": float(series.median()),
        }

    result = {
        "file": file_path,
        "events": sample.event_count,
        "channels": sample.pnn_labels,
        "statistics": statistics,
    }

    if selected_channel:
        channel_events = sample.get_channel_events(
            selected_channel,
            source="raw",
            subsample=True,
        )

        result["plot_data"] = [
            float(value)
            for value in channel_events
        ]

    return result


def read_scatter_data(file_path, x_channel, y_channel):
    sample = flowkit.Sample(file_path)

    dataframe = sample.as_dataframe(
        source="raw",
        subsample=True,
    )

    x_values = dataframe[x_channel]
    y_values = dataframe[y_channel]

    points = []

    for x, y in zip(x_values, y_values):
        points.append({
            "x": float(x),
            "y": float(y),
        })

    return {
        "x_channel": x_channel,
        "y_channel": y_channel,
        "points": points,
    }


def apply_rectangular_gate(
    file_path,
    x_channel,
    y_channel,
    x_min,
    x_max,
    y_min,
    y_max,
):
    sample = flowkit.Sample(file_path)

    dataframe = sample.as_dataframe(source="raw")

    x_values = dataframe[x_channel]
    y_values = dataframe[y_channel]

    mask = (
        (x_values >= x_min)
        & (x_values <= x_max)
        & (y_values >= y_min)
        & (y_values <= y_max)
    )

    selected_dataframe = dataframe.loc[mask]

    count = int(mask.sum())
    total = int(len(dataframe))

    percentage = (
        (count / total) * 100
        if total > 0
        else 0
    )

    selected_points = [
        {
            "x": float(x),
            "y": float(y),
        }
        for x, y in zip(
            selected_dataframe[x_channel],
            selected_dataframe[y_channel],
        )
    ]

    selected_events = []

    for _, row in selected_dataframe.iterrows():
        event = {}

        for column in selected_dataframe.columns:
            channel_name = (
                column[0]
                if isinstance(column, tuple)
                else column
            )

            event[channel_name] = float(row[column])

        selected_events.append(event)

    return {
        "count": count,
        "total": total,
        "percentage": percentage,
        "selected_points": selected_points,
        "selected_events": selected_events,
    }


if __name__ == "__main__":
    result = read_fcs("test.fcs")
    print(result)