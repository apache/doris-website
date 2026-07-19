---
title: BE 开发环境搭建 - CLion
language: zh-CN
description: 使用 CLion 搭建 Apache Doris BE 开发环境：远程开发与 macOS 本地两种方式。
keywords:
    - CLion
    - Apache Doris BE
    - BE 开发环境
    - 远程开发
    - macOS BE 调试
    - CMake
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

# 使用 CLion 搭建 BE 开发环境

本文介绍两种典型的 BE（Backend）CLion 开发模式：

- **方式一：远程开发**（推荐）—— 本地 CLion 通过 SSH/SFTP 连接远程 Linux 服务器，代码同步到远程编译运行。这是最常见的 Doris BE 开发方式，因为 BE 依赖完整的 Linux 工具链。
- **方式二：macOS 本地开发** —— 直接在 macOS 上本地编译、调试 BE，无需远程服务器。

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: IDE 配置 / 调试搭建 -->

## 方式一：远程开发（Linux）

### 1. 远程服务器代码下载与编译

在远程 Linux 服务器上下载并编译 Doris：

```bash
git clone https://github.com/apache/doris.git
cd doris
```

修改 `env.sh`，在开头增加 `DORIS_HOME` 配置，例如：

```bash
DORIS_HOME=/mnt/datadisk0/chenqi/doris
```

执行编译（详细过程参考 [LDB Toolchain 编译](../source-install/compilation-with-ldb-toolchain)）：

```bash
./build.sh
```

### 2. 本地 CLion 配置远程开发环境

1. 在本地下载安装 CLion，导入 Doris BE 代码。

2. 在 CLion 中打开 **Preferences → Build, Execution, Deployment → Deployment**，使用 **SFTP** 添加远程开发服务器的登录信息，并设置 **Mappings** 路径，例如：
    - Local Path：`/User/kaka/Programs/doris/be`
    - Deployment Path：`/mnt/datadisk0/chenqi/clion/doris/be`

    ![Deployment1](/images/clion-deployment1.png)

    ![Deployment2](/images/clion-deployment2.png)

3. 将远程服务器上编译完成的 `gensrc` 路径拷贝到 **Deployment Path** 的上一级目录：

    ```bash
    cp -R /mnt/datadisk0/chenqi/doris/gensrc /mnt/datadisk0/chenqi/clion/doris/gensrc
    ```

4. 打开 **Preferences → Build, Execution, Deployment → Toolchains**，添加远程环境的工具链（CMake、GCC、G++、GDB 等）。

    :::caution 关键
    需要在 **Environment file** 中填写远程服务器 Doris 代码中的 `env.sh` 文件路径。
    :::

    ![Toolchains](/images/clion-toolchains.png)

5. 打开 **Preferences → Build, Execution, Deployment → CMake**，在 CMake options 中添加：

    ```bash
    -DDORIS_JAVA_HOME=/path/to/remote/JAVA_HOME
    ```

    将其设置为远程服务器的 `JAVA_HOME` 路径，否则会找不到 `jni.h`。

6. 在 CLion 中右键点击 **Load CMake Project**。此操作会同步代码到远程服务器，并生成 CMake Build Files。

### 3. 本地 CLion 运行与调试远程 BE

1. 在 **Preferences → Build, Execution, Deployment → CMake** 中配置 CMake。可以配置 Debug / Release 等不同的 Target，**ToolChain** 选择刚才配置的远程工具链。

    如需运行调试 Unit Test，需要在 CMake Options 中添加 `-DMAKE_TEST=ON`（默认关闭）。

2. 在远程服务器上将 `output` 目录拷贝到一个单独的路径下：

    ```bash
    cp -R /mnt/datadisk0/chenqi/doris/output /mnt/datadisk0/chenqi/clion/doris/doris_be
    ```

    ![Output Tree](/images/doris-dist-output-tree.png)

3. 在 CLion 中选择 `doris_be` 相关的 Target（Debug 或 Release），进行配置。参照 `be/bin/start_be.sh` 中 export 的环境变量进行配置，其中环境变量的值指向远程服务器对应的路径：

    ![Run Debug Conf1](/images/clion-run-debug-conf1.png)
    ![Run Debug Conf2](/images/clion-run-debug-conf2.png)

4. 点击 **Run** 编译运行 BE，点击 **Debug** 编译并调试 BE。

## 方式二：macOS 本地开发

macOS 上可以完全本地编译、调试 BE，无需远程服务器。开始之前请先完成 [macOS 编译](../source-install/compilation-mac) 中的依赖安装和代码拉取。

### 1. 打开 Doris 代码根目录

![deployment1](/images/mac-clion-deployment1.png)

### 2. 配置 CLion

**配置工具链**：参考下图配置，全部检测通过即可：

![deployment2](/images/mac-clion-deployment2.png)

**配置 CMake**：参考下图配置：

![deployment3](/images/mac-clion-deployment3.png)

配置完成确认后第一次会自动加载 CMake 文件，若没有自动加载，可手动右键点击 `$DORIS_HOME/be/CMakeLists.txt` 选择加载。

### 3. 配置 Debug BE

选择编辑配置：

![deployment4](/images/mac-clion-deployment4.png)

<!-- 知识类型: 配置参数 -->

给 `doris_be` 添加环境变量，参考 `be/bin/start_be.sh` 中 export 的环境变量进行配置。其中环境变量的 Doris 目录值指向你 copy 出来的运行目录。环境变量参考：

| 环境变量           | 示例值                                                                                                                                              | 说明              |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| `JAVA_OPTS`        | `-Xmx1024m -DlogPath=$DORIS_HOME/log/jni.log -Dsun.java.command=DorisBE -XX:-CriticalJNINatives -DJDBC_MIN_POOL=1 -DJDBC_MAX_POOL=100 -DJDBC_MAX_IDLE_TIME=300000` | JVM 启动参数      |
| `LOG_DIR`          | `~/DorisDev/doris-run/be/log`                                                                                                                       | BE 日志目录       |
| `NLS_LANG`         | `AMERICAN_AMERICA.AL32UTF8`                                                                                                                         | Oracle JDBC 编码  |
| `ODBCSYSINI`       | `~/DorisDev/doris-run/be/conf`                                                                                                                      | ODBC 配置目录     |
| `PID_DIR`          | `~/DorisDev/doris-run/be/log`                                                                                                                       | PID 文件目录      |
| `UDF_RUNTIME_DIR`  | `~/DorisDev/doris-run/be/lib/udf-runtime`                                                                                                           | UDF 运行时目录    |
| `DORIS_HOME`       | `~/DorisDev/doris-run/be`                                                                                                                           | BE 运行目录       |

```bash
JAVA_OPTS=-Xmx1024m -DlogPath=$DORIS_HOME/log/jni.log -Dsun.java.command=DorisBE -XX:-CriticalJNINatives -DJDBC_MIN_POOL=1 -DJDBC_MAX_POOL=100 -DJDBC_MAX_IDLE_TIME=300000
LOG_DIR=~/DorisDev/doris-run/be/log
NLS_LANG=AMERICAN_AMERICA.AL32UTF8
ODBCSYSINI=~/DorisDev/doris-run/be/conf
PID_DIR=~/DorisDev/doris-run/be/log
UDF_RUNTIME_DIR=~/DorisDev/doris-run/be/lib/udf-runtime
DORIS_HOME=~/DorisDev/doris-run/be
```

![deployment5](/images/mac-clion-deployment5.png)
![deployment6](/images/mac-clion-deployment6.png)

### 4. 启动 Debug

点击 **Run** 或 **Debug**，CLion 会开始编译，编译完成后 BE 即启动。

![deployment7](/images/mac-clion-deployment7.png)

## 常见问题（FAQ）

<!-- 知识类型: 故障排查 -->

### Q1：远程编译报 `jni.h not found`

未在 CMake options 中正确设置 `-DDORIS_JAVA_HOME` 指向远程 `JAVA_HOME`。参考方式一第 2 步第 5 项。

### Q2：CLion 找不到符号或大量红线

未把 `gensrc` 拷贝到 Deployment Path 的上一级目录，或没有点击 **Load CMake Project** 重新加载。

### Q3：BE 启动后立即退出

环境变量 `DORIS_HOME` / `PID_DIR` / `LOG_DIR` 未配置或路径不存在。检查上方环境变量表，所有路径需提前创建。
