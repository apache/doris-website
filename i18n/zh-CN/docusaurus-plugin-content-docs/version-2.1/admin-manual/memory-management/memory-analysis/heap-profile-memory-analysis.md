---
{
    "title": "Heap Profile 分析内存",
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

Heap Profile 支持实时查看进程内存使用，并可以看到调用栈，所以这通常需要对代码有一些了解，Doris 使用 Jemalloc 作为默认的 Allocator，有关 Jemalloc Heap Profile 的使用方法参考 [Jemalloc Heap Profile](https://doris.apache.org/community/developer-guide/debug-tool/?_highlight=debug#jemalloc-1)，需要注意的是 Heap Profile 记录的是虚拟内存，需要修改配置后重启 Doris BE 进程，并且现象可以被复现。

如果在 Heap Profile 内存占比大的调用栈中看到 `Segment`，`TabletSchema`、`ColumnReader` 字段，说明元数据占用内存大。

如果集群运行一段时间后静置时 BE 内存不下降，此时在 Heap Profile 内存占比大的调用栈中看到 `Agg`，`Join`，`Filter`，`Sort`，`Scan` 等字段，查看对应时间段的 BE 进程内存监控若呈现持续上升的趋势，那么有理由怀疑存在内存泄漏，依据调用栈对照代码继续分析。

如果集群上任务执行期间在 Heap Profile 内存占比大的调用栈中看到 `Agg`，`Join`，`Filter`，`Sort`，`Scan` 等字段，任务结束后内存正常释放，说明大部分内存被正在运行的任务使用，不存在泄漏，如果此时 `Label=query, Type=overview` Memory Tracker 的值占总内存的比例，小于 Heap Profile 中包含上述字段的内存调用栈占总内存的比例，说明 `Label=query, Type=overview` Memory Tracker 统计的不准确，可以在社区及时反馈。
