---
title: Compiling Apache Doris with LDB Toolchain
language: en
description: Compile Apache Doris on Linux with LDB Toolchain. Detailed toolchain installation and build steps.
keywords:
    - LDB Toolchain
    - Apache Doris
    - source compilation
    - Linux compilation
    - precompiled third-party libraries
    - AVX2
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
<!-- Use case: First-time compilation / No Docker environment -->

This document describes how to compile Apache Doris on Linux with LDB Toolchain. This approach complements [Docker image compilation](./compilation-with-docker) and suits developers who do not have a Docker environment.

:::tip
LDB Toolchain stands for **Linux Distribution Based Toolchain Generator**. It provides a standalone, portable, modern C++ compilation toolchain that can build modern C++ projects on almost any Linux distribution.
:::

Thanks to [Amos Bird](https://github.com/amosbird) for the contribution.

## Version Mapping

<!-- Knowledge type: Configuration parameters -->

| Doris version | Recommended LDB Toolchain version | Included compilers |
| ---------- | ----------------------- | ---------- |
| master | 0.25 | clang-20, gcc-15 |
| 3.1 / 3.0 / 2.1 | 0.19 | clang-17, gcc-13 |

## Target Audience, Pros, and Cons

| Aspect | Description |
| ---- | ---- |
| Target audience | Developers without a Docker environment who want to compile directly on a physical machine or a virtual machine |
| Pros | No Docker dependency; the toolchain is standalone and avoids polluting the system compiler |
| Cons | Java, Maven, Node, and system-level dependencies must be installed manually |

## 1. Prepare the Compilation Environment

<!-- Knowledge type: Procedure -->
<!-- Use case: First-time compilation -->

Applicable to most Linux distributions (CentOS, Ubuntu, and so on).

### 1.1 Download `ldb_toolchain_gen.sh`

Download the matching version from [ldb_toolchain_gen Releases](https://github.com/amosbird/ldb_toolchain_gen/releases):

- x86_64 architecture: download `ldb_toolchain_gen.sh`
- ARM architecture: download `ldb_toolchain_gen.aarch64.sh`

:::tip
Project home page: <https://github.com/amosbird/ldb_toolchain_gen>
:::

### 1.2 Generate the LDB Toolchain

Run the script to generate the toolchain:

```bash
bash ldb_toolchain_gen.sh /path/to/ldb_toolchain/
```

Here, `/path/to/ldb_toolchain/` is the target installation directory. After the script runs successfully, the following structure is generated in that directory:

```text
├── bin
├── include
├── lib
├── share
├── test
└── usr
```

### 1.3 Install Other Compilation Components

| Component | Recommended version | Download URL |
| ---- | -------- | -------- |
| JDK 8 | 1.8.0_391 | [jdk-8u391-linux-x64.tar.gz](https://doris-thirdparty-1308700295.cos.ap-beijing.myqcloud.com/tools/jdk-8u391-linux-x64.tar.gz) |
| JDK 17 | 17.0.10 | [jdk-17.0.10_linux-x64](https://download.oracle.com/java/17/archive/jdk-17.0.10_linux-x64_bin.tar.gz) |
| Maven | 3.9.9 | [apache-maven-3.9.9-bin.tar.gz](https://archive.apache.org/dist/maven/maven-3/3.9.9/binaries/apache-maven-3.9.9-bin.tar.gz) |
| Node | v12.13.0 | [node-v12.13.0-linux-x64.tar.gz](https://doris-thirdparty-repo.bj.bcebos.com/thirdparty/node-v12.13.0-linux-x64.tar.gz) |

JDK version selection rules:

- For Doris 2.1 and earlier: use JDK 8
- For Doris 3.0 and later, or the master branch: use JDK 17
- You can also install OpenJDK 8 or 17 directly through the package manager of your Linux distribution (`yum`, `apt`, and so on)

Different Linux distributions ship with different system components, so additional tools may need to be installed. Using CentOS 6 as an example:

```bash
# Install system dependencies
sudo yum install -y byacc patch automake libtool make which file ncurses-devel gettext-devel unzip bzip2 zip util-linux wget git python2

# Install autoconf-2.69
wget http://ftp.gnu.org/gnu/autoconf/autoconf-2.69.tar.gz && \
    tar zxf autoconf-2.69.tar.gz && \
    cd autoconf-2.69 && \
    ./configure && \
    make && \
    make install

# Install bison-3.8.2
wget http://ftp.gnu.org/gnu/bison/bison-3.8.2.tar.gz && \
    tar xzf bison-3.8.2.tar.gz && \
    cd bison-3.8.2 && \
    ./configure && \
    make && \
    make install
```

### 1.4 Download the Doris Source Code and Configure Environment Variables

```bash
git clone https://github.com/apache/doris.git
```

Enter the source directory and create `custom_env.sh` with the following environment variables:

```bash
export JAVA_HOME=/path/to/java/
export PATH=$JAVA_HOME/bin:$PATH
export PATH=/path/to/maven/bin:$PATH
export PATH=/path/to/node/bin:$PATH
export PATH=/path/to/ldb_toolchain/bin:$PATH
```

## 2. Compile Doris

<!-- Knowledge type: Procedure -->

:::tip
By default, `build.sh` compiles the third-party libraries first. To skip third-party library compilation, see [3. Speed Up with Precompiled Third-Party Libraries](#3-speed-up-with-precompiled-third-party-libraries).
:::

### 2.1 Check Whether AVX2 Is Supported

```bash
cat /proc/cpuinfo | grep avx2
```

A non-empty output indicates that the CPU supports AVX2.

### 2.2 Run the Compilation

```bash
# By default, build artifacts that support AVX2
sh build.sh

# When the CPU does not support AVX2, append USE_AVX2=0
USE_AVX2=0 sh build.sh

# Compile the Debug version of BE
BUILD_TYPE=Debug sh build.sh
```

The script compiles the third-party libraries, FE, BE, and MS in order, and writes the artifacts to the `output/` directory. The MS module is used for the storage-compute separation mode. For details, see the related documentation.

## 3. Speed Up with Precompiled Third-Party Libraries

<!-- Use case: Speed up compilation / Restricted network -->

By default, `build.sh` compiles the third-party libraries from source, which takes a long time. You can also download the community precompiled version directly:

```text
https://github.com/apache/doris-thirdparty/releases
```

The community provides precompiled artifacts for Linux, macOS, and ARM. After you download and extract the package, you get an `installed/` directory. Copy it to the `thirdparty/` directory of the Doris source, then run `build.sh` to skip third-party library compilation.

## FAQ

### Q1: How do I choose an LDB Toolchain version?

Follow the table: use 0.25 for the master branch, and 0.19 for the 3.1, 3.0, and 2.1 branches. A mismatched version may cause ABI inconsistency and link failures.

### Q2: What if `cat /proc/cpuinfo | grep avx2` produces no output?

The CPU does not support AVX2. Add `USE_AVX2=0` when compiling, and use the `-no-avx2` precompiled third-party libraries or compilation images instead.

### Q3: What if I hit `Too many open files` during compilation?

Raise the file handle limit with `ulimit -n 65536`, or write it into `/etc/security/limits.conf` to make it permanent.

### Q4: What should I watch out for when compiling on ARM?

Download `ldb_toolchain_gen.aarch64.sh`, and see [ARM Platform Compilation](./compilation-arm) for how to disable AVX2, libunwind, Azure, and other incompatible third-party libraries.

## Related Documents

- [Compile with Docker Image](./compilation-with-docker)
- [Direct Compilation on Linux](./compilation-linux)
- [ARM Platform Compilation](./compilation-arm)
