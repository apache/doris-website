import json
import os
import filecmp

# Define a list of keywords to exclude
exclude_keywords = ["sql-manual", "releasenotes", "ecosystem", "admin-manual", "faq", 
                    "data-operate", "query-data", "table-design", "gettingStarted", 
                    "query-acceleration", "lakehouse", "compute-storage-decoupled", 
                    "benchmark", "db-connect", "deploy-on-kubernetes"]

version_21_prefix_cn = "./ii18n/zh-CN/docusaurus-plugin-content-docs/version-2.1/"
version_30_prefix_cn = "./i18n/zh-CN/docusaurus-plugin-content-docs/version-3.0/"
version_dev_prefix_cn = "./i18n/zh-CN/docusaurus-plugin-content-docs/current/"

version_21_prefix_en = "./versioned_docs/version-2.1/"
version_30_prefix_en = "./versioned_docs/version-3.0/"
version_dev_prefix_en = "./docs/"



def extract_items_from_file(file_path):
    """Read the JSON file, extract 'items', and filter them based on exclusion criteria."""
    result = []  # List to store the filtered items

    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)  # Load the JSON data

            # Recursive function to extract items and filter them
            def extract_items(data):
                """Recursively extract 'items' and store them in result, excluding specified keywords."""
                if isinstance(data, list):
                    for item in data:
                        extract_items(item)  # Process each item in the list

                elif isinstance(data, dict):
                    if "items" in data:
                        # Add valid items (not containing excluded keywords)
                        result.extend([item for item in data["items"] if isinstance(item, str) and not any(keyword in item for keyword in exclude_keywords)])

                    # Recursively process each key in the dictionary
                    for key in data:
                        extract_items(data[key])

            extract_items(data)  # Start extracting items from the loaded JSON data

        return result  # Return the list of filtered items

    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error: {e}")
        return []
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return []


def diff_doc_cn(directories):
    """Generate three paths for each directory using predefined version prefixes and check file existence and content differences."""
    for directory in directories:
        # Construct the paths for each version
        path_v21 = os.path.join(version_21_prefix_cn, directory + ".md")
        path_v30 = os.path.join(version_30_prefix_cn, directory + ".md")
        path_dev = os.path.join(version_dev_prefix_cn, directory + ".md")

        # Check if the file is missing in v21 or v30
        if not os.path.exists(path_v21):
            print(f"Missing in version 2.1: {path_v21}")
        
        if not os.path.exists(path_v30):
            print(f"Missing in version 3.0: {path_v30}")

        if not os.path.exists(path_dev):
            print(f"Missing in current (dev) version: {path_dev}")

        # Compare path_v21 with path_dev if path_v21 exists
        if os.path.exists(path_v21) and os.path.exists(path_dev):
            if not filecmp.cmp(path_v21, path_dev, shallow=False):
                print(f"File mismatch between v21 and dev for: {directory}")
                print("path_dev:  " + path_dev)
                print("path_v21:  " + path_v21)
                print("-" * 50)

        # Compare path_v30 with path_dev if path_v30 exists
        if os.path.exists(path_v30) and os.path.exists(path_dev):
            if not filecmp.cmp(path_v30, path_dev, shallow=False):
                print(f"File mismatch between v30 and dev for: {directory}")
                print("path_dev:  " + path_dev)
                print("path_v30:  " + path_v30)
                print("-" * 50)


def diff_doc_en(directories):
    """Generate three paths for each directory using predefined version prefixes and check file existence and content differences."""
    for directory in directories:
        # Construct the paths for each version
        path_v21 = os.path.join(version_21_prefix_en, directory + ".md")
        path_v30 = os.path.join(version_30_prefix_en, directory + ".md")
        path_dev = os.path.join(version_dev_prefix_en, directory + ".md")

        # Check if the file is missing in v21 or v30
        if not os.path.exists(path_v21):
            print(f"Missing in version 2.1: {path_v21}")

        if not os.path.exists(path_v30):
            print(f"Missing in version 3.0: {path_v30}")

        if not os.path.exists(path_dev):
            print(f"Missing in current (dev) version: {path_dev}")

        # Compare path_v21 with path_dev if path_v21 exists
        if os.path.exists(path_v21) and os.path.exists(path_dev):
            if not filecmp.cmp(path_v21, path_dev, shallow=False):
                print(f"File mismatch between v21 and dev for: {directory}")
                print("path_dev:  " + path_dev)
                print("path_v21:  " + path_v21)
                print("-" * 50)

        # Compare path_v30 with path_dev if path_v30 exists
        if os.path.exists(path_v30) and os.path.exists(path_dev):
            if not filecmp.cmp(path_v30, path_dev, shallow=False):
                print(f"File mismatch between v30 and dev for: {directory}")
                print("path_dev:  " + path_dev)
                print("path_v30:  " + path_v30)
                print("-" * 50)





if __name__ == "__main__":
    # Fixed file path to sidebars.json
    file_path = "./sidebars.json"  # Fixed file path

    file_list = extract_items_from_file(file_path)  # Extract items and get the result

    # Call diff_doc to check for mismatched documents
    print("Checking CN Doc >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
    diff_doc_cn(file_list)
    print("Checking EN Doc >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
    diff_doc_en(file_list)
