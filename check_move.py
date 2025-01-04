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


move_pairs = []
deletes = []

change_detected = False


def is_same_file(path1, path2):
    return os.path.normpath(path1) == os.path.normpath(path2)


def remove_suffix(text: str, suffix: str):
    return text.rsplit(suffix, 1)[0]


def process_md_file(file_path):
    link_pattern = re.compile(r"\[.*?\]\((.*?)\)")
    global change_detected

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

        links = link_pattern.findall(content)

        for link in links:
            if not urlparse(link).scheme and not os.path.isabs(link):
                full_path: str = os.path.normpath(
                    os.path.join(os.path.dirname(file_path), link)
                )
                if not full_path.endswith(".md") and not full_path.endswith(".mdx"):
                    full_path += ".md"

                for [from_path, to_path] in move_pairs:
                    # Skip change of suffix
                    from_base, from_ext = os.path.splitext(from_path)
                    to_base, to_ext = os.path.splitext(to_path)
                    if (
                        from_ext in [".md", ".mdx", ""] or to_ext in [".md", ".mdx", ""]
                    ) and (from_base == to_base):
                        continue
                    # In md, the link relative path starts from the directory where the document is located, not the document
                    relative_to_path = os.path.relpath(
                        to_path, os.path.dirname(file_path)
                    )
                    relative_to_path = remove_suffix(relative_to_path, ".md")
                    relative_to_path = remove_suffix(relative_to_path, ".mdx")

                    if is_same_file(full_path, from_path):
                        print(
                            f"{file_path} has a link moved by this commit: from {link} to {relative_to_path}"
                        )
                        change_detected = True

                for deleted_path in deletes:
                    if is_same_file(full_path, deleted_path):
                        print(f"{file_path} has a link removed by this commit: {link}")
                        change_detected = True


def extract_file_changes(git_show_output: List[AnyStr]):
    print(f"commit lines: {len(git_show_output)}")
    content = b"".join(git_show_output).decode()
    # print(content)

    move_pattern = r"rename from (.+?)\nrename to (.+?)\n"
    move_matches = re.findall(move_pattern, content, re.DOTALL | re.MULTILINE)
    print(f"moved files: {len(move_matches)}")

    delete_pattern = r"diff --git a/(\S+) b/\1\ndeleted file mode \d+\nindex .+"
    delete_matches = re.findall(delete_pattern, content, re.DOTALL | re.MULTILINE)
    print(f"deleted files: {len(delete_matches)}")

    global move_pairs
    global deletes
    move_pairs = move_matches
    deletes = delete_matches


def travel(root_path: str):
    for root, dirs, files in os.walk(root_path):
        for file in files:
            if file.endswith(".md") or file.endswith(".mdx"):
                md_file_path = os.path.join(root, file)
                process_md_file(md_file_path)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Add commit id as arguments to check")
    parser.add_argument("commit_id", type=str, help="id of the commit to check")
    args = parser.parse_args()

    # extract all move/delete files
    p = subprocess.Popen(
        "git show " + args.commit_id,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    extract_file_changes(p.stdout.readlines())

    # check docs directories
    travel("docs")
    travel("i18n")
    travel("versioned_docs")

    if change_detected:
        print("Failed!")
        sys.exit(1)
