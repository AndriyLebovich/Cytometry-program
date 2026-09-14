import json
import sys

from core.commands import test_command

def main():
	command = sys.argv[1] if len(sys.argv) > 1 else "test"

	if command == "test":
		result = test_command()
	else: 
		result = {
			"success": False,
			"message": f"Unknown command: {command}"
		}

	print(json.dumps(result))

if __name__ == "__main__":
	main()

