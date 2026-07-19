---
title: Compile Apache Doris Directly on Linux
language: en
description: "Compile Apache Doris directly on Linux: JDK, dependencies, AVX2 instruction set check, and build commands."
keywords:
    - Linux compilation
    - Apache Doris
    - source compilation
    - Ubuntu
    - JDK 17
    - AVX2
    - build.sh
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
<!-- Applicable scenario: First-time compilation / compiling directly on a physical machine -->

This document describes how to compile Apache Doris directly on Linux (using Ubuntu 24.04 or later as the example), without using a Docker image or the LDB Toolchain.

## Target Audience, Pros, and Cons

| Dimension | Description |
| ---- | ---- |
| Target audience | Developers on a newer distribution (such as Ubuntu 24.04+) who want to use the system's bundled GCC |
| Pros | Fewest steps; install dependencies directly through the system package manager |
| Cons | Older distributions may fail to compile because GCC or glibc is too old. In that case, use the [LDB Toolchain](./compilation-with-ldb-toolchain) instead |

## Environment Requirements

<!-- Knowledge type: Hardware requirements -->

| Component | Version requirement |
| ---- | -------- |
| Operating system | Ubuntu 24.04+ (or an equivalent version of another distribution) |
| JDK | 8+ (for version 2.1 and earlier); 17 (for version 3.0 and later, or the master branch) |
| GCC | 10+ |
| Python | 2.7+ |
| Apache Maven | 3.5+ |
| CMake | 3.19.2+ |
| Bison | 3.0+ |

## 1. Install JDK

<!-- Knowledge type: Procedure -->

Choose the JDK based on the target Doris version:

```bash
# To compile Doris 2.1 or earlier, install JDK 8
sudo apt install openjdk-8-jdk

# To compile Doris 3.0 or later, or the master branch, install JDK 17
sudo apt install openjdk-17-jdk
```

## 2. Install System Dependencies

```bash
sudo apt install build-essential maven cmake byacc flex automake libtool-bin bison binutils-dev libiberty-dev zip unzip libncurses5-dev curl git ninja-build python
sudo add-apt-repository ppa:ubuntu-toolchain-r/ppa
sudo apt update
sudo apt install gcc-10 g++-10
sudo apt-get install autoconf automake libtool autopoint
```

## 3. Check Whether the CPU Supports AVX2

```bash
cat /proc/cpuinfo | grep avx2
```

A non-empty output means the CPU supports AVX2, and you can use the default compile options. Otherwise, append `USE_AVX2=0` to the build command.

## 4. Run the Build

```bash
# Default build, producing AVX2-enabled artifacts
sh build.sh

# When the CPU does not support AVX2, append USE_AVX2=0
USE_AVX2=0 sh build.sh

# Build a Debug version of BE
BUILD_TYPE=Debug sh build.sh
```

## 5. Locate the Build Artifacts

After the build completes, the artifacts are located under `output/` in the source root directory.

## FAQ

### Q1: Can older versions of Ubuntu or CentOS compile directly?

Older distributions usually ship with versions of GCC and glibc that are too old. Use the [LDB Toolchain](./compilation-with-ldb-toolchain) or the [Docker image](./compilation-with-docker) instead.

### Q2: The build reports `AVX2 not supported`.

The CPU does not support the AVX2 instruction set. Rerun with `USE_AVX2=0 sh build.sh`, and download the `no-avx2` series of prebuilt third-party libraries.

### Q3: The build fails with `Too many open files`.

Raise the per-process file handle limit with `ulimit -n 65536`, or configure it permanently in `/etc/security/limits.conf`.

### Q4: The build is killed midway due to insufficient memory.

The message `ninja failed with: signal: killed` usually indicates OOM. Use a machine with at least 16 GB of memory, or reduce the parallelism (the `-j` parameter).

## Related Documents

- [Compile with LDB Toolchain](./compilation-with-ldb-toolchain)
- [Compile with the Docker Image](./compilation-with-docker)
- [Compile on ARM](./compilation-arm)
