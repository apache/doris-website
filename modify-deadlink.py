import os
import sys
import re
from collections import namedtuple

# Define a structure to store information, added the 'sed_str' field
FileInfo = namedtuple('FileInfo', ['target_file', 'url_line', 'url_path', 'url_count', 'relative_url', 'log_error', 'origin_url', 'sed_str'])

def find_file(file_str, search_dir, line_content):
    # Initialize result list
    results = []

    # Extract the second file path (including the line number)
    match = re.search(r"in file '([^']+)'", file_str)
    if match:
        base_file = match.group(1)  # For example: "versioned_docs/version-3.x/sql-manual/sql-data-types/data-type-overview.md:67"
        parts = base_file.split(":")
        base_file_path = parts[0]         # Remove the line number part to get the file path
        line_number = parts[1] if len(parts) > 1 else ""  # The part after the colon

        # Get the root directory of the second file path
        root_dir = os.path.dirname(base_file_path)

        # Extract the first file path based on the 'link' in the log line
        match = re.search(r"link '([^']+)'", file_str)  # Extract the path after 'link'
        if match:
            filename = match.group(1)
            # Get the base file name (remove the path part)
            file_base_name = os.path.basename(filename)
            # Create the target file name, check if it already has a .md extension
            if not file_base_name.endswith(".md"):
                target_filename = f"{file_base_name}.md"
            else:
                target_filename = file_base_name

            # Check if the file exists in the directory and count the number of occurrences
            found_files = []
            for root, dirs, files in os.walk(search_dir):
                if target_filename in files:
                    file_path = os.path.join(root, target_filename)
                    found_files.append(file_path)

            # Store the result in the structure array
            if found_files:
                url_count = 0
                relative_url = ""
                for file in found_files:
                    # Calculate the relative file path
                    url_path = os.path.relpath(file, os.getcwd())
                    url_count += 1

                # If only one URL is found, output the relative path from the file directory
                if url_count == 1:
                    relative_url = os.path.relpath(found_files[0], os.path.dirname(base_file_path))

                    # Handle relative_url, if it doesn't start with '../', prepend './', and remove the .md suffix
                    if not relative_url.startswith("../"):
                        relative_url = "./" + relative_url
                    if relative_url.endswith(".md"):
                        relative_url = relative_url[:-3]

                # Extract the origin_url (from log_error, extracting the path after 'link' in quotes)
                origin_url_match = re.search(r"link '([^']+)'", line_content)  # Find the content following 'link'
                origin_url = origin_url_match.group(1) if origin_url_match else ""

                # Create the sed_str command (valid only when url_count is 1)
                sed_str = ""
                if url_count == 1:
                    sed_str = f"sed -i '{line_number}s|({origin_url})|({relative_url})|' {base_file_path}"

                # Store the result in the structure array
                file_info = FileInfo(
                    target_file=base_file_path,
                    url_line=line_number,
                    url_path=url_path,
                    url_count=url_count,
                    relative_url=relative_url,
                    log_error=line_content,  # Store the current line content
                    origin_url=origin_url,   # Store origin_url
                    sed_str=sed_str          # Store sed command
                )
                results.append(file_info)

            else:
                print(f"[ERR] No file named {target_filename} found in {search_dir}.")
                print(f"[ERR] Error log: {line_content}")  # Output the current error log
                print("-" * 80)  # Print the separator line
        else:
            print(f"No valid file path found in the input string.")
            print(f"Error log: {line_content}")  # Output the current error log
            print("-" * 80)  # Print the separator line
    else:
        print(f"No valid base file path found in the input string.")
        print(f"Error log: {line_content}")  # Output the current error log
        print("-" * 80)  # Print the separator line

    return results

# New function: Read the file and call find_file
def get_deadlink(file_path, search_dir):
    results = []
    if os.path.isfile(file_path):  # Check if it's a valid file
        with open(file_path, 'r') as file:
            for line in file:
                line = line.strip()  # Remove possible spaces and newline characters
                # Call find_file for each line and pass the current line content
                results.extend(find_file(line, search_dir, line))  # Append the result of each line to the results list
    else:
        print(f"{file_path} is not a valid file.")  # Print if the file is invalid

    return results

# Print the results from the structure array
def print_results(results):
    for result in results:
        print(f"[LOG] target_file >> {result.target_file}")
        print(f"[LOG] url_line >> {result.url_line}")
        print(f"[LOG] url_path >> {result.url_path}")
        print(f"[LOG] url_count >> {result.url_count}")
        print(f"[LOG] relative_url >> {result.relative_url}")
        print(f"[LOG] log_error >> {result.log_error}")  # Print log_error
        print(f"[LOG] origin_url >> {result.origin_url}")  # Print origin_url
        print(f"[LOG] sed_str >> {result.sed_str}")  # Print sed_str
        print("----------------------------------------------------------------")

if __name__ == "__main__":
    # Get input arguments
    if len(sys.argv) != 3:
        print("Usage: python find_file.py '<file_with_logs>' <search_dir>")  # Print usage message
        sys.exit(1)

    file_with_logs = sys.argv[1]  # Get the file path
    search_dir = sys.argv[2]  # Get the search directory

    # Process the file and get results
    results = get_deadlink(file_with_logs, search_dir)

    # Print the results from the structure array
    print_results(results)

