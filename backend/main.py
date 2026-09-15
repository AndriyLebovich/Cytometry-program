import json
import sys

from core.commands import test_command


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

    else:
        result = {
            "success": False,
            "message": f"Unknown command: {command}",
            "data": data
        }

    print(json.dumps(result))


if __name__ == "__main__":
    main()