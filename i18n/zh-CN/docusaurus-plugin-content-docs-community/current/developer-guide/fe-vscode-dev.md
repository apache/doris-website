---
title: FE 开发环境搭建 - Visual Studio Code (VSCode)
language: zh-CN
description: 使用 VSCode 搭建 Apache Doris FE 开发环境，含 Java 插件配置、JDK 切换与远程调试。
keywords:
    - VSCode
    - Apache Doris FE
    - FE 开发环境
    - Java 插件
    - 远程调试
    - JDWP
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

# 使用 VSCode 搭建 FE 开发环境

本文介绍如何使用 VSCode 在开发机、WSL 或 Docker 中搭建 Doris FE 开发环境。习惯使用 VSCode 的开发者可以通过 Remote 插件进行远程开发和调试。

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: IDE 配置 / 调试搭建 -->

## 1. 环境准备

| 组件               | 版本要求                                                                                            | 用途                          |
| ------------------ | --------------------------------------------------------------------------------------------------- | ----------------------------- |
| JDK                | 11+（Java 插件需要）；编译时可用 JDK 8                                                              | 同时安装两套并通过配置切换    |
| VSCode             | 最新稳定版                                                                                          | 编辑器                        |
| Extension Pack for Java | 最新版本                                                                                       | Java 语言支持                 |
| Remote 系列插件    | Remote - SSH / Remote - WSL / Remote - Containers                                                   | 远程开发                      |

建议在 `~/lib` 等独立目录下分别安装 [JDK 11](https://github.com/adoptium/temurin11-binaries/releases/) 与 JDK 8，分别用于 IDE 插件和源码编译。

## 2. 拉取并打开源码

1. 从 GitHub 下载源码：

    ```bash
    git clone https://github.com/apache/doris.git
    ```

2. 使用 VSCode 打开源码下的 `fe` 目录（而非整个仓库根目录）。

## 3. 配置 VSCode

在 `fe/.vscode/` 下创建 `settings.json`，配置 Java 运行时与 Maven 路径。

<!-- 知识类型: 配置参数 -->

| 配置项                          | 说明                                                       |
| ------------------------------- | ---------------------------------------------------------- |
| `java.configuration.runtimes`   | 注册可用 JDK 列表，供 Java 插件按项目选择                  |
| `java.jdt.ls.java.home`         | 指向 JDK 11+ 目录，用于 `vscode-java` 插件本身的运行       |
| `maven.executable.path`         | 指向本地 Maven 可执行文件，用于 `maven-language-server` 插件 |

参考示例：

```json
{
    "java.configuration.runtimes": [
        {
            "name": "JavaSE-1.8",
            "path": "/!!!path!!!/jdk-1.8.0_191"
        },
        {
            "name": "JavaSE-11",
            "path": "/!!!path!!!/jdk-11.0.14.1+1",
            "default": true
        }
    ],
    "java.jdt.ls.java.home": "/!!!path!!!/jdk-11.0.14.1+1",
    "maven.executable.path": "/!!!path!!!/maven/bin/mvn"
}
```

## 4. 编译 FE

完整编译过程可参考：

- [使用 LDB Toolchain 编译](/community/source-install/compilation-with-ldb-toolchain)
- [使用 Docker 开发镜像编译](/community/source-install/compilation-with-docker)

## 5. 配置远程调试

<!-- 知识类型: 配置参数 -->

如需通过 VSCode 远程调试 FE，需要在 FE 启动时附加 JDWP 参数：

```shell
-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005
```

具体做法：编辑 `doris/output/fe/bin/start_fe.sh`，在 `$JAVA $final_java_opt` 后面追加上述参数。

| JDWP 参数        | 值                | 说明                                       |
| ---------------- | ----------------- | ------------------------------------------ |
| `transport`      | `dt_socket`       | 使用 Socket 传输                           |
| `server`         | `y`               | 启动为调试服务端，等待调试器接入           |
| `suspend`        | `n`               | 启动时不挂起，正常运行                     |
| `address`        | `5005`            | 监听端口，可自定义                         |

启动 FE 后，在 VSCode 中通过 Java Debug 插件以 **Attach** 方式连接到 `host:5005` 即可进行断点调试。

## 6. 常见问题（FAQ）

<!-- 知识类型: 故障排查 -->

### Q1：Java 插件提示 JDK 版本过低

`java.jdt.ls.java.home` 必须指向 JDK 11+。即使编译用 JDK 8，插件自身也需要 JDK 11+ 运行。

### Q2：Maven 任务失败 / 找不到 mvn

确认 `maven.executable.path` 指向有效的 `mvn` 可执行文件，或将其加入系统 `PATH`。

### Q3：远程调试无法连接

- 确认 FE 进程实际加载了 JDWP 参数（`ps -ef | grep java` 查看命令行）。
- 确认 `address` 端口未被防火墙拦截。
- 若使用 `suspend=y`，则 FE 会卡住等待调试器接入，请改为 `suspend=n` 或主动接入。
