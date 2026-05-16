---
title: FE Development Environment Setup - Visual Studio Code (VSCode)
language: en
description: Set up an Apache Doris FE development environment with VSCode, covering Java extension configuration, JDK switching, and remote debugging.
keywords:
    - VSCode
    - Apache Doris FE
    - FE development environment
    - Java extension
    - remote debugging
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

# Set Up an FE Development Environment with VSCode

This document describes how to use VSCode to set up a Doris FE development environment on a development machine, in WSL, or in Docker. Developers who prefer VSCode can use the Remote extensions for remote development and debugging.

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: IDE configuration / Debugging setup -->

## 1. Prerequisites

| Component               | Version Requirement                                                                                 | Purpose                                  |
| ----------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| JDK                     | 11+ (required by the Java extension); JDK 8 can be used for compilation                             | Install both and switch via configuration |
| VSCode                  | Latest stable release                                                                               | Editor                                   |
| Extension Pack for Java | Latest version                                                                                      | Java language support                    |
| Remote extensions       | Remote - SSH / Remote - WSL / Remote - Containers                                                   | Remote development                       |

It is recommended to install [JDK 11](https://github.com/adoptium/temurin11-binaries/releases/) and JDK 8 separately under an isolated directory such as `~/lib`, used for the IDE extensions and source compilation respectively.

## 2. Clone and Open the Source Code

1. Download the source code from GitHub:

    ```bash
    git clone https://github.com/apache/doris.git
    ```

2. Open the `fe` directory under the source tree in VSCode (not the entire repository root).

## 3. Configure VSCode

Create `settings.json` under `fe/.vscode/` and configure the Java runtime and Maven path.

<!-- Knowledge type: Configuration parameters -->

| Configuration item              | Description                                                              |
| ------------------------------- | ------------------------------------------------------------------------ |
| `java.configuration.runtimes`   | Registers the list of available JDKs, used by the Java extension per project |
| `java.jdt.ls.java.home`         | Points to the JDK 11+ directory used by the `vscode-java` extension itself |
| `maven.executable.path`         | Points to the local Maven executable, used by the `maven-language-server` extension |

Example:

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

## 4. Compile FE

For the full compilation procedure, refer to:

- [Compile with LDB Toolchain](/docs/install/source-install/compilation-with-ldb-toolchain)
- [Compile with Docker Development Image](/docs/install/source-install/compilation)

## 5. Configure Remote Debugging

<!-- Knowledge type: Configuration parameters -->

To debug FE remotely from VSCode, attach the JDWP parameters when FE starts:

```shell
-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005
```

To do this, edit `doris/output/fe/bin/start_fe.sh` and append the parameters above after `$JAVA $final_java_opt`.

| JDWP parameter   | Value             | Description                                       |
| ---------------- | ----------------- | ------------------------------------------------- |
| `transport`      | `dt_socket`       | Use Socket transport                              |
| `server`         | `y`               | Start as the debug server and wait for a debugger to attach |
| `suspend`        | `n`               | Do not suspend at startup; run normally           |
| `address`        | `5005`            | Listening port; customizable                      |

After starting FE, use the Java Debug extension in VSCode to **Attach** to `host:5005` for breakpoint debugging.

## 6. Frequently Asked Questions (FAQ)

<!-- Knowledge type: Troubleshooting -->

### Q1: The Java extension reports that the JDK version is too low

`java.jdt.ls.java.home` must point to JDK 11+. Even when JDK 8 is used for compilation, the extension itself still requires JDK 11+ to run.

### Q2: Maven tasks fail / `mvn` is not found

Confirm that `maven.executable.path` points to a valid `mvn` executable, or add it to the system `PATH`.

### Q3: Remote debugging cannot connect

- Confirm that the FE process has actually loaded the JDWP parameters (check the command line with `ps -ef | grep java`).
- Confirm that the `address` port is not blocked by a firewall.
- If `suspend=y` is used, FE will block waiting for the debugger to attach. Change it to `suspend=n`, or attach the debugger proactively.
