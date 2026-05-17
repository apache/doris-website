---
title: C++ Static Code Analysis
language: en
description: "Apache Doris C++ static code analysis: Clang-Tidy and Clangd configuration (including VSCode integration)."
keywords:
    - Apache Doris
    - C++ static analysis
    - Clang-Tidy
    - Clangd
    - VSCode
    - LDB toolchain
    - compile_commands.json
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

# C++ Static Code Analysis

<!-- Knowledge type: Code conventions -->
<!-- Applicable scenarios: BE development / Code quality checks -->

Apache Doris supports static analysis of C++ code with [Clangd](https://clangd.llvm.org/) and [Clang-Tidy](https://clang.llvm.org/extra/clang-tidy/). Both are bundled in the [LDB-toolchain](/community/source-install/compilation-with-ldb-toolchain), and you can also install or build them yourself.

## Tool Comparison

| Tool | Purpose | Configuration file |
|------|---------|--------------------|
| Clangd | Provides IDE capabilities such as code navigation, completion, and hover hints | Passed in via `clangd.arguments` |
| Clang-Tidy | Static analysis and code quality checks (can be invoked by Clangd) | `.clang-tidy` in the Doris root directory |

Compared with `vscode-cpptools`, Clangd offers more accurate code navigation and integrates the diagnostics and quick-fix features of Clang-Tidy.

## Clang-Tidy Configuration

Clang-Tidy check rules are centralized in the `.clang-tidy` file in the Doris root directory. You can enable or disable specific checks by editing this file.

## Configuring Clangd in VSCode

<!-- Knowledge type: Tool usage -->

### Steps

1. Install the `clangd` plugin.
2. Before use, compile `be(RELEASE)` and `be-ut(ASAN)` once to generate the corresponding `compile_commands.json` files.
3. Edit `settings.json` or change the plugin configuration directly in Preferences.

### Configuration Example

```json
{
    "clangd.path": "ldb_toolchain/bin/clangd",
    "clangd.arguments": [
        "--background-index",
        "--clang-tidy",
        "--compile-commands-dir=doris/be/build_Release/",
        "--completion-style=detailed",
        "-j=5",
        "--all-scopes-completion",
        "--pch-storage=memory",
        "--pretty",
        "--query-driver=ldb_toolchain/bin/*"
    ],
    "clangd.trace": "output/clangd-server.log"
}
```

### Key Parameters

| Parameter | Description |
|-----------|-------------|
| `clangd.path` | Path to the Clangd executable |
| `--background-index` | Indexes the entire project in the background to speed up symbol lookup |
| `--clang-tidy` | Enables Clang-Tidy static checks |
| `--compile-commands-dir` | Specifies the directory containing `compile_commands.json` |
| `--completion-style=detailed` | Shows detailed information during completion |
| `-j=5` | Number of parallel jobs Clangd uses to analyze files |
| `--query-driver` | Path to the compiler, used to resolve system header files |

## FAQ

**Q: How do I troubleshoot `clangd` when it reports a missing header file or symbol?**

Confirm that BE has been compiled at least once to generate `compile_commands.json`, and that `--compile-commands-dir` points to the correct directory.
