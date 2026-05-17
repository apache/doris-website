---
title: Compiling Apache Doris with Docker Images
language: en
description: Compile Apache Doris source code with the official Docker image, with no need to manually configure thirdparty or toolchain.
keywords:
    - Docker compilation
    - Apache Doris
    - source compilation
    - build-env
    - AVX2
    - JDK 8
    - JDK 17
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
"AS IS" BASIS, WITHOUT WARRANTIES OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: First-time compilation / Environment validation -->

This document describes how to compile Doris source code using the official Apache Doris build image. The image is maintained by the community and updated promptly with dependencies, removing the need to manually install the toolchain and third-party libraries. It is the **most recommended** compilation method.

:::tip
The Docker image method does not yet support compilation and deployment in storage-compute separation mode.
:::

## Target Audience, Pros, and Cons

| Dimension | Description |
| ---- | ---- |
| Target audience | Developers who want to set up a build environment quickly without manually configuring dependencies |
| Pros | The image comes preinstalled with thirdparty, toolchain, and JDK, ready to use out of the box |
| Cons | Requires a working Docker environment on the local machine; the image is relatively large (about 3.3 GB) |

If Docker is not available on the machine, use [LDB Toolchain compilation](./compilation-with-ldb-toolchain) instead.

## 1. Install Docker

On CentOS, install directly through the package manager:

```bash
yum install docker
```

For other distributions, refer to the [official Docker installation guide](https://docs.docker.com/engine/install/).

## 2. Choose and Download the Build Image

<!-- Knowledge type: Configuration parameters -->

Different Doris versions correspond to different build images. `apache/doris:build-env-ldb-toolchain-latest` is used to compile master branch code and is updated continuously along with the trunk.

| Image Tag | Applicable Doris version | Notes |
| -------- | --------------- | ---- |
| `apache/doris:build-env-for-2.0` | 2.0.x | Supports the AVX2 instruction set |
| `apache/doris:build-env-for-2.0-no-avx2` | 2.0.x | Compatible with CPUs that do not support AVX2 |
| `apache/doris:build-env-for-2.1` | 2.1.x | Supports the AVX2 instruction set |
| `apache/doris:build-env-for-2.1-no-avx2` | 2.1.x | Compatible with CPUs that do not support AVX2 |
| `apache/doris:build-env-for-3.0` | 3.0.x | Supports the AVX2 instruction set |
| `apache/doris:build-env-for-3.0-no-avx2` | 3.0.x | Compatible with CPUs that do not support AVX2 |
| `apache/doris:build-env-for-3.1` | 3.1.x | Supports the AVX2 instruction set |
| `apache/doris:build-env-for-3.1-no-avx2` | 3.1.x | Compatible with CPUs that do not support AVX2 |
| `apache/doris:build-env-ldb-toolchain-latest` | master | Tracks the trunk |
| `apache/doris:build-env-ldb-toolchain-no-avx2-latest` | master | Compatible with CPUs that do not support AVX2 |

Taking compilation of Doris 2.0 as an example, download and check the image:

```bash
# You can also use docker.io/apache/doris:build-env-for-2.0
docker pull apache/doris:build-env-for-2.0

# Confirm that the image has been downloaded successfully
docker images
# REPOSITORY      TAG                  IMAGE ID        CREATED       SIZE
# apache/doris    build-env-for-2.0    f29cf1979dba    3 days ago    3.3GB
```

### Notes on Image Selection

- Image tags map one-to-one to Doris versions. Select the image that matches the target branch and avoid cross-version compilation.
- The third-party libraries in `no-avx2` images can run on CPUs that do not support AVX2. They must be compiled together with the `USE_AVX2=0` option.
- For the image change history, refer to the [thirdparty CHANGELOG](https://github.com/apache/doris/blob/master/thirdparty/CHANGELOG.md).
- The latest `apache/doris:build-env-ldb-toolchain-latest` (currently only supports the x86_64 architecture) includes both JDK 8 and JDK 17. Use JDK 8 for versions 2.1 and earlier, and use JDK 17 for versions 3.0 and later or the master branch.
- When compiling with Docker on the ARM64 architecture, first download an ARM64-compatible Linux base image (such as `apache/doris:base-latest`, which corresponds to Ubuntu 22.04.5 LTS), and then refer to the [Linux direct compilation](./compilation-linux) and [ARM platform compilation](./compilation-arm) documents to install dependencies and compile.

Inside the container, switch the JDK through environment variables:

```bash
# Switch to JDK 8
export JAVA_HOME=/usr/lib/jvm/java-1.8.0
export PATH=$JAVA_HOME/bin/:$PATH

# Switch to JDK 17
export JAVA_HOME=/usr/lib/jvm/jdk-17.0.2/
export PATH=$JAVA_HOME/bin/:$PATH
```

## 3. Compile Doris

<!-- Knowledge type: Procedure -->

### 3.1 Download the Doris Source Code

On the host machine, fetch the code for the target branch (using branch-2.0 as an example):

```bash
git clone -b branch-2.0 https://github.com/apache/doris.git
```

Assume the source directory is `~/doris-branch-2.0`.

### 3.2 Start the Build Container

```bash
# Prepare the maven .m2 directory on the host in advance so that Java dependencies can be reused across multiple builds
mkdir ~/.m2

# Mount the source code and the .m2 directory, then start the build image
docker run -it --network=host \
    --name mydocker \
    -v ~/.m2:/root/.m2 \
    -v ~/doris-branch-2.0:/root/doris-branch-2.0/ \
    apache/doris:build-env-for-2.0

# After the command runs successfully, it enters the container automatically
```

Explanation of the key `docker run` parameters:

| Parameter | Purpose |
| ---- | ---- |
| `-v` | Mounts a host directory into the container, used to persist source code and dependencies |
| `--name` | Specifies the container name for easier management later |
| `--network` | Sets the container network mode. `host` shares the network stack with the host and requires no port mapping |

Recommendations:

- Always mount the Doris source directory so that the build artifacts remain on the host and are not lost when the container exits.
- Mount the `.m2` directory to avoid re-downloading Maven dependencies every time the container starts.
- Downloading third-party libraries inside the container requires internet access. The `--network=host` mode is recommended.

### 3.3 Run the Build

After entering the source directory inside the container, run:

```bash
# By default, compile artifacts that support AVX2
sh build.sh

# When the CPU does not support AVX2, append USE_AVX2=0
USE_AVX2=0 sh build.sh

# Compile the Debug version of BE
BUILD_TYPE=Debug sh build.sh
```

When the build finishes, the artifacts are located under `output/` in the source directory.

:::tip
**How do you check whether the machine supports the AVX2 instruction set?**

```bash
cat /proc/cpuinfo | grep avx2
```

Non-empty output means AVX2 is supported.
:::

## 4. Build Your Own Development Image

To customize the base image (for example, to switch to a different base distribution or add debugging tools), refer to `docker/README.md` in the source code.

## FAQ

### Q1: What happens if the image version does not match the Doris version?

The thirdparty libraries and toolchain in the image are tightly coupled with the Doris source code. Cross-version combinations are very likely to throw linker errors such as `undefined reference` or `incompatible library` during compilation. Select strictly according to the table.

### Q2: The build reports `AVX2 not supported`?

The CPU on the host or the target runtime machine does not support the AVX2 instruction set. Switch to an image with the `no-avx2` suffix and set `USE_AVX2=0` at build time.

### Q3: `docker pull` is too slow to pull the image?

Configure a Docker image mirror accelerator, or use the full path `docker.io/apache/doris:...`.

### Q4: Java library downloads fail inside the container?

Verify that the container is started with `--network=host`, and that the `~/.m2` directory is mounted into the container, so that a proxy or network isolation does not make the Maven central repository unreachable.

## Related Documents

- [Compile with LDB Toolchain](./compilation-with-ldb-toolchain)
- [Direct Compilation on Linux](./compilation-linux)
- [Compilation on ARM Platforms](./compilation-arm)
