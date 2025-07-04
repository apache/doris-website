---
{
    "title": "Use arthas to profile fe",
    "language": "en"
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

## Introduce
Starting from Doris version 3.1.0, the Arthas tool (version 4.0.5) is included in the FE deployment directory `${DORIS_FE_HOME}/arthas`. Arthas can be used to generate flame graphs, trace method call paths, output method execution times, observe method parameters and return values, and more. This makes it easier to diagnose various runtime issues in the FE process.
For detailed usage instructions, please refer to the [official Arthas documentation](https://arthas.aliyun.com/en/doc/)

:::note
Note: Currently, only Linux and macOS are supported. Windows is not supported yet.
:::

Example: Generating a Flame Graph
1. Run the `${DORIS_FE_HOME}/arthas/as.sh` script and select the DorisFE process:
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

2. Start profiling:
    ```shell
    [arthas@77285]$ profiler start
    Profiling started
    ```

3. Stop profiling and generate a flame graph file named 20250627-115104.html:
    ```shell
    [arthas@77285]$ profiler stop --format html
    OK
    profiler output file: <DORIS_FE_HOME>/arthas-output/20250627-115104.html
    ```

## Using Arthas in Older FE Versions
For versions prior to 3.1, you need to manually download Arthas:
```shell
wget https://github.com/alibaba/arthas/releases/download/arthas-all-4.0.5/arthas-bin.zip
unzip arthas-bin.zip -o ${DORIS_FE_HOME}/arthas
```