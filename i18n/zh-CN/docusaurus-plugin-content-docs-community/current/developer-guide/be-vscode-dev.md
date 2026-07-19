---
title: BE 开发环境搭建 - Visual Studio Code (VSCode)
language: zh-CN
description: 使用 VSCode 搭建 Apache Doris BE 开发环境：编译、GDB/LLDB 调试与 core dump 分析。
keywords:
    - VSCode
    - Apache Doris BE
    - BE 开发环境
    - GDB 调试
    - LLDB 调试
    - core dump
    - doris_be
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

# 使用 VSCode 搭建 BE 开发与调试环境

本文介绍如何在 Ubuntu 20.04 下使用 VSCode 编译、启动并调试 Apache Doris BE，覆盖 GDB / LLDB / core dump 三种调试方式。

> BE 二进制文件名称为 `doris_be`，旧版本中曾命名为 `palo_be`。

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: IDE 配置 / 调试搭建 -->

## 1. 前期准备

1. 下载 Doris 源代码：[apache/doris on GitHub](https://github.com/apache/doris)

2. 安装基础工具链：GCC 8.3.1+，Oracle JDK 1.8+，Python 2.7+。确认 `gcc`、`java`、`python` 指向正确版本，并设置 `JAVA_HOME` 环境变量。

3. 安装其他依赖包：

    ```bash
    sudo apt install build-essential openjdk-8-jdk maven cmake byacc flex automake libtool-bin bison binutils-dev libiberty-dev zip unzip libncurses5-dev curl git ninja-build python brotli
    sudo add-apt-repository ppa:ubuntu-toolchain-r/ppa
    sudo apt update
    sudo apt install gcc-10 g++-10
    sudo apt-get install autoconf automake libtool autopoint
    ```

4. 安装 OpenSSL：

    ```bash
    sudo apt install -y openssl libssl-dev
    ```

## 2. 编译

以下步骤在 `/home/workspace` 目录下进行。

### 2.1 下载源码

```bash
git clone https://github.com/apache/doris.git
cd doris
git submodule update --init --recursive
```

### 2.2 编译第三方依赖

```bash
cd /home/workspace/doris/thirdparty
./build-thirdparty.sh
```

### 2.3 编译 Doris

```bash
cd /home/workspace/doris
./build.sh
```

`build.sh` 支持下列组合：

| 命令                                | 说明                       |
| ----------------------------------- | -------------------------- |
| `./build.sh`                        | 同时编译 BE 和 FE          |
| `./build.sh --be`                   | 只编译 BE                  |
| `./build.sh --fe`                   | 只编译 FE                  |
| `./build.sh --fe --be`              | 同时编译 BE 和 FE          |
| `./build.sh --fe --be --clean`      | 清理后同时编译 BE 和 FE    |
| `./build.sh --fe --clean`           | 清理后编译 FE              |
| `./build.sh --be --clean`           | 清理后编译 BE              |

编译产物输出到 `/home/workspace/doris/output/` 目录下。如遇问题可参考 [Doris 官方文档](http://doris.apache.org)。

:::tip 私有 Maven 仓库
编译 FE 时如需指定私有 Maven 仓库，可通过环境变量 `USER_SETTINGS_MVN_REPO` 指定 `settings.xml` 路径：

```bash
export USER_SETTINGS_MVN_REPO="/xxx/xxx/settings.xml"
```
:::

## 3. 部署调试（GDB）

### 3.1 给 BE 执行文件授权

```bash
chmod +x /home/workspace/doris/output/be/lib/doris_be
```

`/home/workspace/doris/output/be/lib/doris_be` 为 BE 的执行文件。

### 3.2 创建数据存放目录

查看 `/home/workspace/doris/output/be/conf/be.conf`：

```bash
# INFO, WARNING, ERROR, FATAL
sys_log_level = INFO
be_port = 9060
be_rpc_port = 9070
webserver_port = 8040
heartbeat_service_port = 9050
brpc_port = 8060
arrow_flight_sql_port = -1

# Note that there should at most one ip match this list.
# If no ip match this rule, will choose one randomly.
# use CIDR format, e.g. 10.10.10.0/
# Default value is empty.
priority_networks = 192.168.59.0/24 # data root path, separate by ';'
storage_root_path = /soft/be/storage
```

根据 `storage_root_path` 创建数据目录：

```bash
mkdir -p /soft/be/storage
```

### 3.3 打开源码并安装调试插件

1. 使用 VSCode 打开 BE 源码所在目录（本例中为 `/home/workspace/doris/`）。
2. 安装 VSCode 的 **C/C++**（ms-vscode.cpptools）调试插件。

    ![](/images/image-20210618104004956.png)

### 3.4 创建 launch.json

<!-- 知识类型: 配置参数 -->

在 `.vscode/launch.json` 中创建 Launch 模式配置：

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "(gdb) Launch",
            "type": "cppdbg",
            "request": "launch",
            "program": "/home/workspace/doris/output/be/lib/doris_be",
            "args": [],
            "stopAtEntry": false,
            "cwd": "/home/workspace/doris/",
            "environment": [
                {"name": "DORIS_HOME", "value": "/home/workspace/doris/output/be/"},
                {"name": "UDF_RUNTIME_DIR", "value": "/home/workspace/doris/output/be/lib/udf-runtime"},
                {"name": "LOG_DIR", "value": "/home/workspace/doris/output/be/log"},
                {"name": "PID_DIR", "value": "/home/workspace/doris/output/be/bin"}
            ],
            "externalConsole": true,
            "MIMode": "gdb",
            "miDebuggerPath": "/path/to/gdb",
            "setupCommands": [
                {
                    "description": "Enable pretty-printing for gdb",
                    "text": "-enable-pretty-printing",
                    "ignoreFailures": true
                }
            ]
        }
    ]
}
```

`environment` 定义了 `doris_be` 运行时需要的环境变量，未设置启动会失败：

| 环境变量          | 用途                       |
| ----------------- | -------------------------- |
| `DORIS_HOME`      | BE 运行根目录              |
| `UDF_RUNTIME_DIR` | UDF 运行时目录             |
| `LOG_DIR`         | 日志目录                   |
| `PID_DIR`         | PID 文件目录               |

`miDebuggerPath` 指定调试器路径（如 `gdb`）。如果不指定则会在系统 `PATH` 中搜索；系统自带 GDB 版本可能过低，需要手动指定新版本路径。

### 3.5 Attach 模式调试

如需 attach 到已运行的 BE 进程，配置如下：

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "(gdb) Launch",
            "type": "cppdbg",
            "request": "attach",
            "program": "/home/workspace/doris/output/lib/doris_be",
            "processId": "${command:pickProcess}",
            "MIMode": "gdb",
            "miDebuggerPath": "/path/to/gdb",
            "internalConsoleOptions": "openOnSessionStart",
            "setupCommands": [
                {
                    "description": "Enable pretty-printing for gdb",
                    "text": "-enable-pretty-printing",
                    "ignoreFailures": true
                }
            ]
        }
    ]
}
```

要点：

- `"request": "attach"` —— 调试模式设置为 attach。
- `"processId"` —— 附加进程的 PID，可设为具体数字、`"${command:pickProcess}"`（启动时手动选择）或通过下列命令提取：

    ```bash
    lsof -i | grep -m 1 doris_be | awk "{print $2}"
    ```

    ![](/images/image-20210618095240216.png)

    上图中的 `15200` 即为当前 BE 的进程 ID。

### 3.6 完整 launch.json 示例

下面是同时包含 **Launch** 与 **Attach** 两种模式的完整配置：

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "(gdb) Attach",
            "type": "cppdbg",
            "request": "attach",
            "program": "/home/workspace/doris/output/be/lib/doris_be",
            "processId": 17016,
            "MIMode": "gdb",
            "miDebuggerPath": "/path/to/gdb",
            "setupCommands": [
                {
                    "description": "Enable pretty-printing for gdb",
                    "text": "-enable-pretty-printing",
                    "ignoreFailures": true
                }
            ]
        },
        {
            "name": "(gdb) Launch",
            "type": "cppdbg",
            "request": "launch",
            "program": "/home/workspace/doris/output/be/lib/doris_be",
            "args": [],
            "stopAtEntry": false,
            "cwd": "/home/workspace/doris/output/be",
            "environment": [
                {"name": "DORIS_HOME", "value": "/home/workspace/doris/output/be"},
                {"name": "UDF_RUNTIME_DIR", "value": "/home/workspace/doris/output/be/lib/udf-runtime"},
                {"name": "LOG_DIR", "value": "/home/workspace/doris/output/be/log"},
                {"name": "PID_DIR", "value": "/home/workspace/doris/output/be/bin"}
            ],
            "externalConsole": false,
            "MIMode": "gdb",
            "miDebuggerPath": "/path/to/gdb",
            "setupCommands": [
                {
                    "description": "Enable pretty-printing for gdb",
                    "text": "-enable-pretty-printing",
                    "ignoreFailures": true
                }
            ]
        }
    ]
}
```

### 3.7 启动调试

点击 VSCode 调试按钮即可开始 Doris BE 的 DEBUG 之旅。

![](/images/image-20210618091006146.png)

## 4. 调试（LLDB）

LLDB 的 attach 比 GDB 更快，使用方式类似。VSCode 需要安装的插件改为 `CodeLLDB`，然后在 launch.json 加入以下配置：

```json
{
    "name": "CodeLLDB attach",
    "type": "lldb",
    "request": "attach",
    "program": "${workspaceFolder}/output/be/lib/doris_be",
    "pid": "${command:pickMyProcess}"
}
```

:::caution glibc 版本要求
此方式要求系统 `glibc` 版本为 `2.18+`。如未满足，可参考 [如何使 CodeLLDB 在 CentOS7 下工作](https://gist.github.com/JaySon-Huang/63dcc6c011feb5bd6deb1ef0cf1a9b96) 安装高版本 glibc 并链接到插件。
:::

## 5. 调试 core dump 文件

调试 BE 崩溃产生的 core 文件，在对应 configuration 项中添加：

```json
"coreDumpPath": "/PATH/TO/CORE/DUMP/FILE"
```

## 6. 常用调试技巧

### 6.1 函数执行路径

当对 BE 的执行细节不熟悉时，可以使用 `perf` 等工具追踪函数调用，找出调用链。`perf` 的使用见 [调试工具](./debug-tool)。

在较大的表上执行需要追踪的 SQL，然后增大采样频率（例如 `perf -F 999`），观察结果可大致得到 SQL 在 BE 执行的关键路径。

### 6.2 调试 CRTP 对象

BE 代码为了提高运行效率，在基础类型中大量采用了 CRTP（奇异递归模板模式），导致 debugger 无法按照派生类型调试对象。可以使用 GDB 这样解决：

假设需要调试 `IColumn` 类型的对象 `col`，但不知道其实际类型：

```bash
set print object on   # 按派生类型输出对象
p *col.t              # 使用 col.t 即可得到 col 的具体类型
p col.t->size()       # 可按派生类型使用它，例如 ColumnString 可调用 size()
```

:::caution
具有多态效果的是指针 `COW::t` 而非 `IColumn` 类对象，所以需要在 GDB 中将所有对 `col` 的使用替换为 `col.t` 才能真正得到派生类型对象。
:::

## 7. 常见问题（FAQ）

<!-- 知识类型: 故障排查 -->

### Q1：启动 BE 立即退出

环境变量未设置或路径不存在。检查 `DORIS_HOME` / `LOG_DIR` / `PID_DIR` / `UDF_RUNTIME_DIR` 全部已设置，对应目录已创建。

### Q2：GDB 报版本过低 / 不支持的特性

系统自带 GDB 版本陈旧，需手动安装新版 GDB 并在 `miDebuggerPath` 中指定。

### Q3：CodeLLDB 加载失败

系统 `glibc` 版本低于 `2.18`，参考 4 节中链接处理。

### Q4：编译 FE 时 Maven 走外网失败

设置 `USER_SETTINGS_MVN_REPO` 环境变量，指向私有 Maven 仓库的 `settings.xml`，见 2.3 节提示。
