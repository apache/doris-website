---
title: BE 多目录共享缓存
language: zh-CN
description: Apache Doris BE 多目录（worktree）开发场景下的 ccache 共享缓存配置与调试方法。
keywords:
    - Apache Doris BE
    - ccache
    - git worktree
    - 多目录开发
    - CCACHE_BASEDIR
    - ffile-prefix-map
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

# BE 多目录共享缓存

在与 AI Agent 协作进行 Doris BE 开发时，一种常见的模式是利用 `git worktree` 等方式同时在不同目录下维护多个开发分支，并行开发。由于 ccache 缓存对全路径名敏感，因此在不同的目录中，即使绝大多数 cpp 文件内容相同，ccache 也无法命中缓存，导致 worktree 目录必须从零开始编译，极大拖慢开发速度。为解决这一问题，我们进行了定制的优化，按以下方式配置即可。

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 多 worktree 并行开发 / 编译加速 -->

## 1. 目录要求

Doris 已经在环境配置文件中设定了 `CCACHE_BASEDIR` 和 `-ffile-prefix-map`，对于绝大多数编译选项已经映射为同一路径，以便缓存命中。**前提是所有 Doris 开发目录必须共享相同的父目录。** 即所有 Doris 开发目录必须满足如下并列关系：

```bash
xxx/doris_main
xxx/doris1
xxx/doris2
```

## 2. 环境配置

<!-- 知识类型: 操作步骤 -->

### 2.1 配置 UBSAN_IGNORELIST 硬编码路径

除上述自动设定外，硬编码路径仍需要手动调整。在 worktree 目录的 `custom_env.sh` 中硬编码主库的 UBSAN IGNORELIST：

```bash
export UBSAN_IGNORELIST=${DORIS_MAIN_REPO}/conf/ubsan_ignorelist.txt
```

其中 `DORIS_MAIN_REPO` 是主库的路径。推荐做法：

1. 将该值直接配置在主库的 `custom_env.sh` 中。
2. 通过 `hooks/setup_worktree.sh` 与 `AGENTS.md` 的配合，由 AI 工作流自动传递给所有 worktree 目录。

### 2.2 扩大 ccache 缓存容量

为保证缓存空间足够，请手动扩大 ccache 缓存容量：

```bash
ccache --set-config=max_size=50G
```

| 配置项     | 推荐值 | 说明                               |
| ---------- | ------ | ---------------------------------- |
| `max_size` | `50G`  | 多 worktree 并行时建议的最低容量   |

## 3. 调试方式

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 故障排查 / 缓存未命中诊断 -->

### 3.1 查看缓存统计

通过 `ccache -s` 查看缓存统计，确认缓存是否生效。重点关注 `cache hit rate` 字段，如果值过低说明缓存未正确命中。每次观测前可以通过 `ccache -z` 清空统计，确保结果准确。

| 命令         | 用途                       |
| ------------ | -------------------------- |
| `ccache -s`  | 查看缓存命中统计           |
| `ccache -z`  | 清空统计信息（不清空缓存） |
| `ccache -C`  | 清空缓存（慎用）           |

### 3.2 开启 ccache Debug 日志

确认缓存命中有问题时，可以开启 ccache Debug 日志：

```bash
export CCACHE_LOGFILE=/path/to/xxx
export CCACHE_DEBUG=1
```

| 环境变量          | 作用                                                              |
| ----------------- | ----------------------------------------------------------------- |
| `CCACHE_LOGFILE`  | 详细日志输出文件，可查看每次缓存命中/未命中的原因                 |
| `CCACHE_DEBUG=1`  | 为每个编译单元生成 `*.ccache-input-text` 文件，记录该单元输入信息 |

### 3.3 定位未命中原因

开启 `CCACHE_DEBUG=1` 后，每一个编译单元都会产生自己的 `*.ccache-input-text` 文件，记录该编译单元的输入信息，包括源文件路径、编译选项等。

理论上两个不同目录的相同文件，**各自的 `ccache-input-text` 内容需要完全一致，才能命中 ccache 缓存。** 对于未命中的文件，可以对比两侧 `ccache-input-text` 文件差异，明确未命中原因。

## 4. 常见问题（FAQ）

<!-- 知识类型: 故障排查 -->

### Q1：cache hit rate 始终为 0

检查所有 worktree 是否在同一父目录下；如果不在，`CCACHE_BASEDIR` 与 `-ffile-prefix-map` 无法将路径映射为一致，缓存必然不命中。

### Q2：缓存空间频繁淘汰

按 2.2 节扩大 `max_size`。多 worktree 并行场景下，建议至少 50 GB。

### Q3：UBSAN_IGNORELIST 路径报错

worktree 目录下未通过 `custom_env.sh` 指向主库的 ignorelist 文件，参考 2.1 节配置。
