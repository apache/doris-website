---
title: C++ 代码静态分析
language: zh-CN
description: Apache Doris C++ 代码静态分析：Clang-Tidy 与 Clangd 配置（含 VSCode 集成）。
keywords:
    - Apache Doris
    - C++ 静态分析
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

# C++ 代码静态分析

<!-- 知识类型: 代码规范 -->
<!-- 适用场景: BE 开发 / 代码质量检查 -->

Apache Doris 支持使用 [Clangd](https://clangd.llvm.org/) 和 [Clang-Tidy](https://clang.llvm.org/extra/clang-tidy/) 对 C++ 代码进行静态分析。两者均已内置在 [LDB-toolchain](/community/source-install/compilation-with-ldb-toolchain) 中，开发者也可自行安装或编译。

## 工具对比

| 工具 | 作用 | 配置文件 |
|------|------|---------|
| Clangd | 提供代码跳转、补全、悬停提示等 IDE 能力 | 通过 `clangd.arguments` 传入 |
| Clang-Tidy | 静态分析与代码质量检查（可由 Clangd 调用） | Doris 根目录下的 `.clang-tidy` |

相比 `vscode-cpptools`，Clangd 能提供更精准的代码跳转能力，并集成 Clang-Tidy 的诊断与快速修复功能。

## Clang-Tidy 配置

Clang-Tidy 的检查规则集中在 Doris 根目录下的 `.clang-tidy` 文件中。可通过修改该文件来开启/关闭特定的检查项。

## 在 VSCode 中配置 Clangd

<!-- 知识类型: 工具使用 -->

### 操作步骤

1. 安装 `clangd` 插件。
2. 在使用前先编译一次 `be(RELEASE)` 和 `be-ut(ASAN)`，以生成对应的 `compile_commands.json` 文件。
3. 在 `settings.json` 中编辑或直接在首选项中更改插件配置。

### 配置示例

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

### 关键参数说明

| 参数 | 说明 |
|------|------|
| `clangd.path` | Clangd 可执行文件的路径 |
| `--background-index` | 后台索引整个项目，加速符号查找 |
| `--clang-tidy` | 开启 Clang-Tidy 静态检查 |
| `--compile-commands-dir` | 指定 `compile_commands.json` 所在目录 |
| `--completion-style=detailed` | 补全时展示详细信息 |
| `-j=5` | Clangd 分析文件的并行数 |
| `--query-driver` | 编译器路径，用于解析系统头文件 |

## FAQ

**Q：`clangd` 报找不到头文件或符号该如何排查？**

请确认已经先编译一次 BE 生成 `compile_commands.json`，并将 `--compile-commands-dir` 指向正确目录。
