import requests
import json
import re

# Github repo information
GITHUB_API_URL = "https://api.github.com/repos/DeepWaterExploration/DWE_OS_2/tags"
VERSION_FILE_PATH = "frontend/version.json"

def get_latest_tag():
    # Fetch the latest tags from GitHub API
    response = requests.get(GITHUB_API_URL)
    
    if response.status_code == 200:
        tags = response.json()
        if tags:
            return tags[0]['name']  # The latest tag is the first one
    return None

def update_version_json(new_version):
    # Load the current version.json file
    with open(VERSION_FILE_PATH, 'r') as f:
        data = json.load(f)

    # Update the version string
    data['version'] = new_version

    # Write the new version back to the json file
    with open(VERSION_FILE_PATH, 'w') as f:
        json.dump(data, f, indent=4)

if __name__ == "__main__":
    # Get the latest tag from GitHub
    latest_tag = get_latest_tag()

    if latest_tag:
        print(f"Latest tag found: {latest_tag}")

        # Update the version.json file
        update_version_json(latest_tag)
        print("version.json updated successfully.")
    else:
        print("No tags found or failed to fetch the latest tag.")
