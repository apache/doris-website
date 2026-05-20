---
title: Analyzing FE Performance with Arthas
language: en
description: "Analyze Apache Doris FE performance online with Arthas: flame graphs, function tracing, and runtime observation."
keywords:
    - Apache Doris
    - Arthas
    - FE performance analysis
    - flame graph
    - function tracing
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

# Analyzing FE Performance with Arthas

<!-- Knowledge type: Tool usage -->
<!-- Applicable scenarios: Performance tuning / Troubleshooting -->

## Introduction

In Apache Doris 3.1.0 and later, the FE deployment directory `${DORIS_FE_HOME}/arthas` ships with the Arthas tool (version 4.0.5). With Arthas, you can print flame graphs online, trace function call paths, measure function latency, and observe function inputs and return values, which makes it easier to locate runtime issues in the FE.

For more detailed command descriptions, refer to the [Arthas official documentation](https://arthas.aliyun.com/en/doc/).

### System Support

| System | Supported |
|------|---------|
| Linux | Yes |
| macOS | Yes |
| Windows | Not yet supported |

### Manual Installation for Older FE Versions

For Doris versions earlier than 3.1.0, download Arthas manually:

```bash
wget https://github.com/alibaba/arthas/releases/download/arthas-all-4.0.5/arthas-bin.zip
unzip arthas-bin.zip -o ${DORIS_FE_HOME}/arthas
```

## Generating a Flame Graph

1. Run the `${DORIS_FE_HOME}/arthas/as.sh` script and select the serial number of the `DorisFE` process from the process list:

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

2. Start profiling on the Arthas command line:

    ```shell
    [arthas@77285]$ profiler start
    Profiling started
    ```

3. Stop profiling and generate a flame graph in HTML format:

    ```shell
    [arthas@77285]$ profiler stop --format html
    OK
    profiler output file: <DORIS_FE_HOME>/arthas-output/20250627-115104.html
    ```

    The output file is placed under `${DORIS_FE_HOME}/arthas-output/`. Open it in a browser to analyze hot functions.

## Common Arthas Command Cheatsheet

| Command | Purpose |
|------|------|
| `profiler start` / `profiler stop --format html` | Collect a CPU flame graph |
| `trace <class> <method>` | Trace function call paths and latency |
| `watch <class> <method>` | Observe function inputs and return values |
| `thread` | View JVM thread state |
| `dashboard` | View overall JVM runtime metrics in real time |

## FAQ

**Q: The `DorisFE` process is not found when running `as.sh`.**

Make sure the FE process has started and that `as.sh` runs on the same machine as the FE. The process list comes from JVMs visible to the current user.

**Q: The generated flame graph is empty or has too few samples.**

Make sure the FE has a continuous query or request load during profiling. You can extend the interval between `profiler start` and `profiler stop`.
