---
title: Pipeline Tracing
language: zh-CN
description: Apache Doris Pipeline Tracing：记录调度轨迹并通过 Perfetto 可视化。
keywords:
    - Apache Doris
    - Pipeline Tracing
    - Pipeline 执行引擎
    - Perfetto
    - 调度分析
    - BE 性能调优
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

# Pipeline Tracing

<!-- 知识类型: 工具使用 -->
<!-- 适用场景: 性能调优 / 调度分析 -->

## 介绍

在 Apache Doris 的 Pipeline 执行引擎中，每个 Instance 的执行计划树会被拆分为多个 Pipeline Task，并由自定义的 Pipeline 调度器进行调度执行。当 Pipeline Task 数量较多时，这些 Task 如何在线程与 CPU 核间调度，是影响执行性能的重要因素。

Pipeline Tracing 工具用于观察特定查询或时间段内的调度过程，便于性能分析与瓶颈定位。

## 使用步骤

### 1. 记录调度数据

通过 HTTP 接口控制 BE 是否以及如何记录调度过程，相关设置仅作用于目标 BE。

| 操作目的 | HTTP 命令 |
|---------|----------|
| 关闭 Pipeline Tracing 记录 | `curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=disable` |
| 为每个 Query 产生一条记录 | `curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=perquery` |
| 生成固定时间段内的 Tracing 记录 | `curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=periodic` |
| 设置周期时长（单位：秒） | `curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?dump_interval=60` |

命令示例：

```shell
# 关闭 Pipeline Tracing 记录
curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=disable

# 为每个 Query 产生一条记录
curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=perquery

# 生成固定时间段内的 Tracing 记录
curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=periodic

# 设置 60 秒的周期时长
curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?dump_interval=60
```

### 2. 转换数据格式

记录的数据会写入对应 BE 的 `log/tracing` 目录。使用 `doris/tools/pipeline-tracing/` 中的转换脚本，将原始数据转换为 Perfetto 可加载的 JSON 格式：

```shell
cd doris/tools/pipeline-tracing/
python3 origin-to-show.py -s <SOURCE_FILE> -d <DEST>.json
```

参数说明：

| 参数 | 含义 |
|------|------|
| `-s <SOURCE_FILE>` | BE 生成的原始 Tracing 文件路径 |
| `-d <DEST>.json` | 输出的可视化 JSON 文件路径 |

更详细的使用方法可参考该目录下的 `README.md` 文件。

### 3. 在 Perfetto 中可视化

1. 打开 [Perfetto](https://ui.perfetto.dev/)。
2. 点击 `Open trace file`，选择上一步生成的 JSON 文件。
3. 即可查看调度结果：

    ![](/images/tracing1.png)

    Perfetto 支持查看同一个 Task 在各 CPU 核间的调度情况：

    ![](/images/tracing2.png)

## FAQ

**Q：Tracing 文件在哪里？**

在对应 BE 的 `log/tracing` 目录下，文件名包含时间戳与 Query 信息。

**Q：开启 Pipeline Tracing 是否会影响性能？**

会有一定开销。建议仅在调度排查阶段开启，排查完毕后使用 `type=disable` 关闭。
