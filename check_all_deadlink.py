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

import re
import os
from urllib.parse import urlparse


def process_md_file(file_path):
    link_pattern = re.compile(r"\[.*?\]\((.*?)\)")
    code_block_pattern = re.compile(r"^```.*$")

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    lines = content.splitlines()
    in_code_block = False

    for line_number, line in enumerate(lines, start=1):
        # Skip codeblocks
        if code_block_pattern.match(line):
            in_code_block = not in_code_block
            continue

        if in_code_block:
            continue

        links = link_pattern.findall(line)

        for link in links:
            # Skip urls
            if (
                not urlparse(link).scheme
                and not os.path.isabs(link)
                and not (link[0] == "#")
            ):
                full_path = os.path.normpath(
                    os.path.join(os.path.dirname(file_path), link)
                )

                # Skip section headers
                if "#" in full_path:
                    full_path = full_path.split("#", 1)[0]

                if not full_path.endswith(".md") and not full_path.endswith(".mdx"):
                    full_path += ".md"
                md_exists = os.path.exists(full_path)
                mdx_exists = (
                    os.path.exists(full_path[:-3] + ".mdx")
                    if full_path.endswith(".md")
                    else False
                )

                if not md_exists and not mdx_exists:
                    print(
                        f"Error: File not found for link '{link}' in file '{file_path}:{line_number}'"
                    )


def travel(root_path: str):
    for root, dirs, files in os.walk(root_path):
        for file in files:
            if file.endswith(".md") or file.endswith(".mdx"):
                md_file_path = os.path.join(root, file)
                process_md_file(md_file_path)


if __name__ == "__main__":
    # check docs directories
    travel("docs")
    travel("i18n")
    travel("versioned_docs")
