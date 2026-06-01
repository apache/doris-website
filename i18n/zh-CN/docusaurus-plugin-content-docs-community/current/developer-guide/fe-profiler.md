---
title: 使用 FE Profiler 生成火焰图
language: zh-CN
description: 用 async-profiler 为 Apache Doris FE 生成火焰图，定位性能瓶颈。
keywords:
    - Apache Doris
    - FE Profiler
    - async-profiler
    - 火焰图
    - profile_fe.sh
    - FE 性能瓶颈
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

# 使用 FE Profiler 生成火焰图

<!-- 知识类型: 工具使用 -->
<!-- 适用场景: 性能调优 / 故障排查 -->

## 介绍

在 Apache Doris 2.1.4 及以上版本中，FE 部署目录 `${DORIS_FE_HOME}/bin` 下提供了 `profile_fe.sh` 脚本。该脚本基于 [async-profiler](https://github.com/async-profiler/async-profiler) 生成 FE 的火焰图，用于定位 FE 的性能瓶颈。

### 系统支持

| 系统 | 是否支持 |
|------|---------|
| Linux | 支持 |
| macOS | 支持 |
| Windows | 暂不支持 |

## 使用步骤

### 1. 运行 profile_fe.sh

```shell
# 默认监听 fe 10 秒，生成火焰图
${DORIS_FE_HOME}/bin/profile_fe.sh

# 设置监听 fe 30 秒，生成火焰图
PROFILE_SECONDS=30 ${DORIS_FE_HOME}/bin/profile_fe.sh
```

| 环境变量 | 含义 | 默认值 |
|---------|------|--------|
| `PROFILE_SECONDS` | async-profiler 的采样时长（秒） | `10` |

### 2. 触发负载

运行命令后，async-profiler 会在指定时间内持续采样。在这段时间内需要将关键查询重复发送给该 FE，使 async-profiler 能采集到目标代码路径的栈帧信息。

### 3. 查看火焰图

采样完成后，脚本会在 `${DORIS_FE_HOME}/log` 目录下生成一个 HTML 格式的火焰图文件。FE 的性能瓶颈通常呈现为"平顶山"（又矮又宽）形态，针对这些栈帧对应的代码进行优化即可。

火焰图示例：

![](/images/fe-profiler.png)

## 在低版本 FE 中使用 async-profiler

对于 Doris 2.1.4 以下的版本，需要手动下载两个文件：

1. 下载 [ap-loader-all-3.0-8.jar](https://repo1.maven.org/maven2/me/bechberger/ap-loader-all/3.0-8/ap-loader-all-3.0-8.jar) 至 `${DORIS_FE_HOME}/lib` 目录。
2. 下载 [profile_fe.sh](https://raw.githubusercontent.com/apache/doris/master/bin/profile_fe.sh) 至 `${DORIS_FE_HOME}/bin` 目录。
3. 运行 `profile_fe.sh` 即可生成火焰图。

## FAQ

**Q：火焰图采样区间内没有目标函数栈帧？**

通常是采样期间未触发对应查询路径。请在执行 `profile_fe.sh` 期间手动或脚本化重复发送目标 SQL，或通过 `PROFILE_SECONDS=30` 延长采样时间。

**Q：FE Profiler 与 [Arthas](./arthas) 如何选择？**

- `profile_fe.sh`：脚本化、采样固定时长，适合一次性快速生成火焰图。
- Arthas：交互式终端，支持 `trace`、`watch` 等更细粒度的运行时观察，适合深入排查。
