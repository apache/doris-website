---
title: 使用 Arthas 分析 FE 性能
language: zh-CN
description: 用 Arthas 在线分析 Apache Doris FE 性能：火焰图、函数追踪与运行时观察。
keywords:
    - Apache Doris
    - Arthas
    - FE 性能分析
    - 火焰图
    - 函数追踪
    - JVM
    - DorisFE
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

# 使用 Arthas 分析 FE 性能

<!-- 知识类型: 工具使用 -->
<!-- 适用场景: 性能调优 / 故障排查 -->

## 介绍

在 Apache Doris 3.1.0 及以上版本中，FE 部署目录 `${DORIS_FE_HOME}/arthas` 内置了 Arthas 工具（4.0.5 版本）。借助 Arthas 可以在线打印火焰图、跟踪函数调用路径、统计函数耗时、观察函数的入参与返回值，方便定位 FE 的运行时问题。

更详细的命令说明可参考 [Arthas 官方文档](https://arthas.aliyun.com/en/doc/)。

### 系统支持

| 系统 | 是否支持 |
|------|---------|
| Linux | 支持 |
| macOS | 支持 |
| Windows | 暂不支持 |

### 低版本 FE 的手动安装

对于 3.1.0 之前的 Doris 版本，需要手动下载 Arthas：

```bash
wget https://github.com/alibaba/arthas/releases/download/arthas-all-4.0.5/arthas-bin.zip
unzip arthas-bin.zip -o ${DORIS_FE_HOME}/arthas
```

## 生成火焰图

1. 运行 `${DORIS_FE_HOME}/arthas/as.sh` 脚本，在进程列表中选择 `DorisFE` 进程对应的序号：

    ```shell
    bash ./as.sh
    Arthas script version: 4.0.5
    Found existing java process, please choose one and input the serial number of the process, eg : 1. Then hit ENTER.
    * [1]: 75123 com.intellij.idea.Main
      [2]: 77285 org.apache.doris.DorisFE
      [3]: 76901 DorisBE
      [4]: 6776 org.jetbrains.jps.cmdline.Launcher
      [5]: 76265 DorisBE
      [6]: 80527 org.jetbrains.jps.cmdline.Launcher
    2
    ```

2. 在 Arthas 命令行中开始 Profiling：

    ```shell
    [arthas@77285]$ profiler start
    Profiling started
    ```

3. 结束 Profiling，生成 HTML 格式火焰图：

    ```shell
    [arthas@77285]$ profiler stop --format html
    OK
    profiler output file: <DORIS_FE_HOME>/arthas-output/20250627-115104.html
    ```

    输出文件位于 `${DORIS_FE_HOME}/arthas-output/` 目录下，用浏览器打开即可分析热点函数。

## 常用 Arthas 命令速查

| 命令 | 用途 |
|------|------|
| `profiler start` / `profiler stop --format html` | 采集 CPU 火焰图 |
| `trace <class> <method>` | 跟踪函数调用路径及耗时 |
| `watch <class> <method>` | 观察函数入参与返回值 |
| `thread` | 查看 JVM 线程状态 |
| `dashboard` | 实时查看 JVM 整体运行指标 |

## FAQ

**Q：执行 `as.sh` 时找不到 `DorisFE` 进程？**

请确认 FE 进程已启动，且 `as.sh` 与 FE 运行在同一台机器上，进程列表来自当前用户可见的 JVM。

**Q：生成的火焰图为空或采样过少？**

请确保 Profiling 期间 FE 上有持续的查询/请求负载；可适当延长 `profiler start` 与 `profiler stop` 之间的时间。
