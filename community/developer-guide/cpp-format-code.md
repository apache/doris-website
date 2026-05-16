---
title: C++ Code Formatting Specification
language: en
description: "Apache Doris C++ code formatting: clang-format tool configuration and usage from the command line and IDE."
keywords:
    - Apache Doris
    - C++ code formatting
    - clang-format
    - LDB toolchain
    - Clion
    - VS Code
    - BE development
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

# C++ Code Formatting Specification

<!-- Knowledge type: Code specification -->
<!-- Applicable scenario: BE development / Pull Request submission -->

Apache Doris uses `clang-format` to format C++ code, and provides wrapper scripts under the `build-support` directory so that developers can unify the format before submitting code.

## Wrapper Scripts

| Script | Purpose |
|------|------|
| `build-support/clang-format.sh` | Formats C/C++ code under `be/src` and `be/test` |
| `build-support/check-format.sh` | Checks the code format of `be/src` and `be/test` and prints the diff without modifying any files |

## Code Style Customization

- The Apache Doris code style is based on Google Style with minor customizations. The configuration file `.clang-format` is located at the Doris root directory.
- `.clang-format` is compatible with `clang-format-16.0.0` and later.
- The `.clang-format-ignore` file lists code that should not be formatted, typically third-party libraries that should keep their original style.

## Environment Setup

You need to install `clang-format`, or use a `clang-format` plugin provided by your IDE/editor. Doris currently uses `clang-format 16` for code formatting (different versions of `clang-format` may produce different results).

### Install clang-format

| System | Recommended approach |
|------|---------|
| Linux | Use the [LDB toolchain](/docs/install/source-install/compilation-with-ldb-toolchain) (which already includes the matching version), or build/install the binary yourself |
| macOS | `brew install clang-format@16` |

LDB toolchain notes: the latest version (>= v0.18) already includes a prebuilt `clang-format 16.0.0` binary. For downloads, see [ldb_toolchain_gen Releases](https://github.com/amosbird/ldb_toolchain_gen/releases).

### Use an IDE Plugin

| IDE | Plugin | Notes |
|-----|------|---------|
| CLion | `ClangFormat` (search and download under `File -> Setting -> Plugins`) | Make sure the `clang-format` version is 16 |
| VS Code | `Clang-Format` extension | You need to manually specify the path to the `clang-format` executable |

## Usage

### Run from the Command Line

1. Enter the Doris root directory:

    ```bash
    cd ${DORIS_HOME}
    ```

2. Run the formatting script:

    ```bash
    build-support/clang-format.sh
    ```

> Note: the `clang-format.sh` script requires Python 3 to be installed on the machine.

### Use clang-format in CLion

After installing the `ClangFormat` plugin, click `Reformat Code` to format the current file.

### Use clang-format in VS Code

1. Install the `Clang-Format` extension.
2. Open the VS Code settings page, search for `clang_format`, and fill in the following configuration:

    ```json
    {
        "clang_format_path": "$clang-format path$",
        "clang_format_style": "file"
    }
    ```

3. Right-click and select `Format Document` to format the file.

## FAQ

**Q: Will different `clang-format` versions cause inconsistent formatting?**

Yes. Use the `clang-format 16` series strictly, otherwise the format may not match what the project expects and CI may fail.

**Q: Will third-party code also be formatted?**

No. Directories listed in `.clang-format-ignore` are skipped, so that third-party dependencies keep their original code style.
