# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

import argparse
import subprocess
import re
import os
import sys
from typing import AnyStr, List
from urllib.parse import urlparse

# List of renamed files, each element is [from_path, to_path]
move_pairs = []

# List of deleted files
deletes = []

# Flag indicating whether any link changes were detected
change_detected = False

def is_same_file(path1, path2):
    """
    Compare two paths after normalizing, return True if they are the same file.
    """
    return os.path.normpath(path1) == os.path.normpath(path2)

def remove_suffix(text: str, suffix: str):
    """
    Remove a suffix from a string, if it exists.
    """
    return text.rsplit(suffix, 1)[0]

def process_md_file(file_path):
    """
    Process a markdown (.md or .mdx) file, check all links inside the file.
    If a link points to a file that has been renamed or deleted, mark change_detected as True.
    Also update the links in the file to the new paths if necessary.
    """
    link_pattern = re.compile(r"\[.*?\]\((.*?)\)")
    global change_detected

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    links = link_pattern.findall(content)
    new_content = content

    for link in links:
        # Skip external links and absolute paths
        if not urlparse(link).scheme and not os.path.isabs(link):
            full_path = os.path.normpath(os.path.join(os.path.dirname(file_path), link))
            if not full_path.endswith(".md") and not full_path.endswith(".mdx"):
                full_path += ".md"

            for [from_path, to_path] in move_pairs:
                from_base, from_ext = os.path.splitext(from_path)
                to_base, to_ext = os.path.splitext(to_path)

                # Ignore changes that only change the suffix (e.g., .md -> .mdx) but keep the filename
                if from_base.split("/")[-1] == to_base.split("/")[-1]:
                    continue

                # Compute relative path from current file to the renamed file
                relative_to_path = os.path.relpath(to_path, os.path.dirname(file_path))
                relative_to_path = remove_suffix(relative_to_path, ".md")
                relative_to_path = remove_suffix(relative_to_path, ".mdx")

                if is_same_file(full_path, from_path):
                    print(f"{file_path} has a link moved by this commit: from {link} to {relative_to_path}")
                    change_detected = True
                    new_content = new_content.replace(f"({link})", f"({relative_to_path})")

            # Check if the linked file was deleted
            for deleted_path in deletes:
                if is_same_file(full_path, deleted_path):
                    print(f"{file_path} has a link removed by this commit: {link}")
                    change_detected = True

    # Write updated content back to the file
    if new_content != content:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)

def extract_file_changes(git_show_output: List[AnyStr]):
    """
    Extract renamed and deleted files from git diff output.
    """
    content = b"".join(git_show_output).decode()

    # Extract renamed files
    move_pattern = r"rename from (.+?)\nrename to (.+?)\n"
    move_matches = re.findall(move_pattern, content, re.DOTALL | re.MULTILINE)

    # Extract deleted files
    delete_pattern = r"diff --git a/(\S+) b/\1\ndeleted file mode \d+\nindex .+"
    delete_matches = re.findall(delete_pattern, content, re.DOTALL | re.MULTILINE)

    global move_pairs
    global deletes
    move_pairs = move_matches
    deletes = delete_matches

    print(f"commit lines: {len(git_show_output)}")
    print(f"moved files: {len(move_pairs)}")
    print(f"deleted files: {len(deletes)}")

def travel(root_path: str):
    """
    Recursively traverse a directory and process all markdown files.
    """
    for root, dirs, files in os.walk(root_path):
        for file in files:
            if file.endswith(".md") or file.endswith(".mdx"):
                process_md_file(os.path.join(root, file))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Check moved/deleted links in commit(s)")
    parser.add_argument("commit_id", type=str, help="id of the commit to check")
    args = parser.parse_args()

    # Use git diff to get file changes for the commit, supports multi-file and multi-directory changes
    p = subprocess.Popen(
        f"git diff --name-status {args.commit_id}~1 {args.commit_id}",
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    extract_file_changes(p.stdout.readlines())

    # Traverse all relevant documentation directories
    for doc_root in ["docs", "i18n", "versioned_docs"]:
        if os.path.exists(doc_root):
            travel(doc_root)

    # Exit with failure code if any link changes were detected
    if change_detected:
        print("Failed!")
        sys.exit(1)
