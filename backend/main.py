import json
import sys

from core.commands import test_command
from fcs_reader import (
    read_fcs,
    read_scatter_data,
    apply_rectangular_gate,
)


def main():
    command = sys.argv[1] if len(sys.argv) > 1 else "test"

    data = {}

    if len(sys.argv) > 2:
        try:
            data = json.loads(sys.argv[2])
        except json.JSONDecodeError:
            result = {
                "success": False,
                "message": "Invalid JSON data"
            }
            print(json.dumps(result))
            return

    if command == "test":
        result = test_command()

        if data:
            result["received_data"] = data

    elif command == "read_fcs":
        file_path = data.get("file_path")

        if not file_path:
            result = {
                "success": False,
                "message": "Missing file_path"
            }
        else:
            try:
                selected_channel = data.get("selected_channel")

                result = read_fcs(
                    file_path,
                    selected_channel=selected_channel
                )

                result["success"] = True

            except Exception as error:
                result = {
                    "success": False,
                    "message": str(error)
                }

    elif command == "read_scatter":
        file_path = data.get("file_path")
        x_channel = data.get("x_channel")
        y_channel = data.get("y_channel")

        if not file_path:
            result = {
                "success": False,
                "message": "Missing file_path"
            }

        elif not x_channel:
            result = {
                "success": False,
                "message": "Missing x_channel"
            }

        elif not y_channel:
            result = {
                "success": False,
                "message": "Missing y_channel"
            }

        else:
            try:
                result = read_scatter_data(
                    file_path,
                    x_channel,
                    y_channel
                )

                result["success"] = True

            except Exception as error:
                result = {
                    "success": False,
                    "message": str(error)
                }

    elif command == "apply_gate":
        file_path = data.get("file_path")
        x_channel = data.get("x_channel")
        y_channel = data.get("y_channel")

        x_min = data.get("x_min")
        x_max = data.get("x_max")
        y_min = data.get("y_min")
        y_max = data.get("y_max")

        if not file_path:
            result = {
                "success": False,
                "message": "Missing file_path"
            }

        elif not x_channel or not y_channel:
            result = {
                "success": False,
                "message": "Missing channel"
            }

        elif None in (x_min, x_max, y_min, y_max):
            result = {
                "success": False,
                "message": "Missing gate coordinates"
            }

        else:
            try:
                result = apply_rectangular_gate(
                    file_path,
                    x_channel,
                    y_channel,
                    float(x_min),
                    float(x_max),
                    float(y_min),
                    float(y_max),
                )

                result["success"] = True

            except Exception as error:
                result = {
                    "success": False,
                    "message": str(error)
                }

    else:
        result = {
            "success": False,
            "message": f"Unknown command: {command}",
            "data": data
        }

    print(json.dumps(result))


if __name__ == "__main__":
    main()