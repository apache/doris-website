---
{
    "title": "Pipeline Tracing",
    "language": "zh-CN"
}
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

在 Pipeline 执行引擎中，我们会将每个 Instance 的执行计划树拆分成多个小的 Pipeline Task，并在我们自定义的 Pipeline 调度器调度下执行。因此，在拥有大量 Pipeline Task 的执行环境下，这些 Task 如何在线程和 CPU 核间进行调度，是执行性能的一个重要影响因素。我们开发了一个专门的工具用来观察特定查询或时间段上的调度过程，我们将这个工具称为 "Pipeline Tracing"。

## 使用步骤

### 1. 记录数据

首先我们需要对 Pipeline 调度过程进行记录。是否以及如何记录调度过程，可以通过 HTTP 接口设置。这些设置关联到特定 BE：

1. 关闭 Pipeline Tracing 记录

```shell
curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=disable
```

2. 为每个 Query 产生一条记录

```shell
curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=perquery
```

3. 生成固定时间段内的 Tracing 记录

```shell
curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=periodic
```

设置时间周期（单位为秒）：
```shell
curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?dump_interval=60
```

### 2. 格式转换

记录的数据将会生成到对应 BE 的 `log/tracing` 目录下。接下来需要对数据进行格式转换，生成符合可视化工具所需格式的文件。这里我们提供了一个转换工具直接对 BE 生成的 tracing 记录进行转换，可以直接执行：

```shell
cd doris/tools/pipeline-tracing/
python3 origin-to-show.py -s <SOURCE_FILE> -d <DEST>.json
```

生成可以展示的 json 文件。更详细的使用说明，可以参考该目录下的 `README.md` 文件。

### 3. 可视化结果

Pipeline Tracing 的可视化使用 [Perfetto](https://ui.perfetto.dev/)。生成对应格式的文件后，在其页面上选择 "Open trace file" 打开该文件，即可查看结果：

![](/images/tracing1.png)

该工具的功能非常强大，例如可以方便查看同一个 Task 在各个核间的调度情况。

![](/images/tracing2.png)
