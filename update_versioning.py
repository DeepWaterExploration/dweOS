import requests
import json
import pathlib

# Github repo information
SCRIPT_DIR = pathlib.Path(__file__).parent.resolve()
GITHUB_API_URL = "https://api.github.com/repos/DeepWaterExploration/DWE_OS_2/tags"
VERSION_FILE_PATH = f"{SCRIPT_DIR}/frontend/package.json"

def get_latest_tag():
    # Fetch the latest tags from GitHub API
    response = requests.get(GITHUB_API_URL)
    
    if response.status_code == 200:
        tags = response.json()
        if tags:
            return tags[0]['name']  # The latest tag is the first one
    return None

def get_new_tag():
    new_tag = input('Enter a new tag name: ')
    if new_tag == "":
        return None
    return new_tag

def update_version_json(new_version):
    # Load the current package.json file
    with open(VERSION_FILE_PATH, 'r') as f:
        data = json.load(f)

    # Update the version string
    data['version'] = new_version

    # Write the new version back to the json file
    with open(VERSION_FILE_PATH, 'w') as f:
        json.dump(data, f, indent=4)

if __name__ == "__main__":
    # Get a new tag
    latest_tag = get_new_tag()

    if latest_tag:
        print(f"Latest tag found: {latest_tag}")

        # Update the package.json file
        update_version_json(latest_tag)
        print("package.json updated successfully.")
    else:
        print("No tags found or failed to fetch the latest tag.")
