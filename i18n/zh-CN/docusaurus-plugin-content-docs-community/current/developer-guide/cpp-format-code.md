---
title: C++ 代码格式化规范
language: zh-CN
description: Apache Doris C++ 代码格式化：Clang-format 工具配置与命令行/IDE 使用方式。
keywords:
    - Apache Doris
    - C++ 代码格式化
    - clang-format
    - LDB toolchain
    - Clion
    - VS Code
    - BE 开发
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

# C++ 代码格式化规范

<!-- 知识类型: 代码规范 -->
<!-- 适用场景: BE 开发 / Pull Request 提交 -->

Apache Doris 使用 `clang-format` 进行 C++ 代码格式化，并在 `build-support` 目录下提供了封装脚本，方便开发者在提交代码前统一格式。

## 封装脚本说明

| 脚本 | 作用 |
|------|------|
| `build-support/clang-format.sh` | 格式化 `be/src` 和 `be/test` 目录下的 C/C++ 代码 |
| `build-support/check-format.sh` | 检查 `be/src` 和 `be/test` 的代码格式并输出 diff，不修改文件 |

## 代码风格定制

- Apache Doris 的代码风格基于 Google Style，并做了少量定制，配置文件 `.clang-format` 位于 Doris 根目录。
- `.clang-format` 适配 `clang-format-16.0.0` 及以上版本。
- `.clang-format-ignore` 文件记录了不希望被格式化的代码，通常为第三方代码库，建议保持原有风格。

## 环境准备

需要安装 `clang-format`，或使用 IDE/Editor 提供的 `clang-format` 插件。当前 Doris 采用 `clang-format 16` 进行代码格式化（不同版本的 `clang-format` 可能产生不同结果）。

### 安装 clang-format

| 系统 | 推荐方式 |
|------|---------|
| Linux | 使用 [LDB toolchain](/community/source-install/compilation-with-ldb-toolchain)（已附带对应版本），或自行编译/安装二进制 |
| macOS | `brew install clang-format@16` |

LDB toolchain 说明：最新版本（>= v0.18）已包含预编译的 `clang-format 16.0.0` 二进制文件，下载地址参见 [ldb_toolchain_gen Releases](https://github.com/amosbird/ldb_toolchain_gen/releases)。

### 使用 IDE 插件

| IDE | 插件 | 注意事项 |
|-----|------|---------|
| CLion | `ClangFormat`（`File -> Setting -> Plugins` 搜索下载） | 需确认 `clang-format` 版本为 16 |
| VS Code | `Clang-Format` 扩展 | 需要手动指定 `clang-format` 可执行文件路径 |

## 使用方式

### 命令行运行

1. 进入 Doris 根目录：

    ```bash
    cd ${DORIS_HOME}
    ```

2. 执行格式化脚本：

    ```bash
    build-support/clang-format.sh
    ```

> 注：`clang-format.sh` 脚本要求机器上安装了 Python 3。

### 在 CLion 中使用 clang-format

安装 `ClangFormat` 插件后，点击 `Reformat Code` 即可对当前文件进行格式化。

### 在 VS Code 中使用 clang-format

1. 安装 `Clang-Format` 扩展程序。
2. 打开 VS Code 配置页面，搜索 `clang_format`，并填入以下配置：

    ```json
    {
        "clang_format_path": "$clang-format path$",
        "clang_format_style": "file"
    }
    ```

3. 右键点击 `Format Document` 即可完成格式化。

## FAQ

**Q：不同 `clang-format` 版本会导致格式不一致吗？**

会。请严格使用 `clang-format 16` 系列版本，否则可能与项目期望的格式不一致，导致 CI 失败。

**Q：第三方代码也会被格式化吗？**

不会。`.clang-format-ignore` 中列出的目录会被跳过，确保第三方依赖保持原有代码风格。
