---
title: Compiling Apache Doris on Windows (WSL2)
language: en
description: Steps to compile Apache Doris on Windows using WSL2.
keywords:
    - Windows compilation
    - WSL2
    - WSL
    - Apache Doris
    - source compilation
    - Linux subsystem
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

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Windows development machine / WSL2 compilation -->

This document describes how to compile Apache Doris source code on the Windows platform. Doris does not support native compilation on Windows directly, but you can use WSL2 (Windows Subsystem for Linux 2) to run a Linux subsystem on Windows and then complete the build using the Linux compilation process.

:::tip
The Windows + WSL2 approach does not currently support compilation and deployment for the storage-compute separation mode.
:::

## Target users, pros, and cons

| Dimension | Description |
| ---- | ---- |
| Target users | Developers whose development machine is Windows but who need to compile and debug Doris |
| Pros | No dual-boot system or extra Linux server required; compilation can be done locally |
| Cons | Requires Windows 10 2004+ or Windows 11, and uses a certain amount of disk space |

## 1. Environment requirements

<!-- Knowledge type: Hardware requirements -->

| Item | Requirement |
| ---- | ---- |
| Windows version | Windows 10 2004 (build 19041) or later, or Windows 11 |
| WSL version | WSL2 (Ubuntu 22.04 or Ubuntu 24.04 distribution recommended) |
| Disk space | At least 50 GB of free space recommended (for source code, third-party libraries, and build artifacts) |

## 2. Compilation steps

### 2.1 Install WSL2

Refer to the Microsoft official documentation [WSL installation guide](https://learn.microsoft.com/en-us/windows/wsl/install) and run the following in PowerShell:

```powershell
wsl --install
```

After installation completes, restart the system and follow the prompts to initialize the Linux subsystem (set the username and password).

### 2.2 Compile Doris in WSL2

Enter the Linux subsystem started by WSL2 and choose one of the following compilation methods:

- [Compile with LDB Toolchain (recommended)](./compilation-with-ldb-toolchain)
- [Compile with Docker image (recommended)](./compilation-with-docker)
- [Compile directly on Linux](./compilation-linux)

## 3. Notes

- **Storage drive**: WSL2 distribution data is stored on the C drive by default. If the C drive is running low on space, migrate the WSL2 data to another drive before installation to avoid filling up the system drive. See the [WSL export and import](https://learn.microsoft.com/en-us/windows/wsl/basic-commands#export-a-distribution-to-a-tar-file) commands for migration.
- **Resource limits**: WSL2 uses host memory by default. If the compilation process is frequently killed due to insufficient memory, increase the `memory` and `processors` limits in `%UserProfile%\.wslconfig`.
- **File system**: Place the source code on the ext4 file system inside WSL2 (such as `~/doris`) rather than on a mounted `/mnt/c/...` path. Cross-file-system access makes compilation extremely slow.

## FAQ

### Q1: WSL2 installation fails with "Windows needs to be updated"?

Upgrade Windows to 10 2004 (build 19041) or later, or use Windows 11 directly.

### Q2: WSL2 compilation is extremely slow?

Make sure the source code is on the WSL2 internal file system (such as `~/doris`) and not under `/mnt/c/...`. Cross-file-system access significantly slows down compilation.

### Q3: WSL2 uses up all the host memory?

Limit WSL2 resource usage in `%UserProfile%\.wslconfig`:

```ini
[wsl2]
memory=12GB
processors=8
```

After changing the file, run `wsl --shutdown` to restart WSL2 for the changes to take effect.

## Related documents

- [Compile with LDB Toolchain](./compilation-with-ldb-toolchain)
- [Compile with Docker image](./compilation-with-docker)
- [Compile directly on Linux](./compilation-linux)
