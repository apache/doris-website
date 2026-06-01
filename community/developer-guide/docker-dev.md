---
title: Quick Doris Development Environment with Docker
language: en
description: Quickly set up an Apache Doris development environment with Docker, including a Dockerfile example and VSCode Remote configuration.
keywords:
    - Apache Doris
    - Docker
    - development environment
    - Dockerfile
    - VSCode Remote
    - SYS_PTRACE
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

# Quick Doris Development Environment with Docker

This article describes how to use Docker to build a Doris development image, compile and run FE/BE, and combine it with VSCode Remote for development and debugging.

<!-- Knowledge type: Procedure -->
<!-- Use case: IDE configuration / Containerized development environment -->

## Related Detailed Documents

- [Compile with the Docker Development Image](/community/source-install/compilation-with-docker)
- [Deployment](/docs/dev/install/deploy-manually/integrated-storage-compute-deploy-manually)
- [VSCode BE Development and Debugging](./be-vscode-dev)

## 1. Environment Preparation

| Component     | Description                       |
| ------------- | --------------------------------- |
| Docker        | Installed and running             |
| VSCode        | Latest stable version             |
| Remote plugin | VSCode Remote - Containers / SSH  |

## 2. Build the Image

### 2.1 Create the Dockerfile

Create a `Dockerfile` in the working directory. In VSCode, you can use Ctrl+D to replace the following placeholders:

| Placeholder                     | Meaning                       |
| ------------------------------- | ----------------------------- |
| `<!!! your user !!!>`           | Username created in the container |
| `<!!! your user password !!!>`  | Password for that user        |
| `<!!! root password !!!>`       | Password for the root user    |
| `<!!! your git email !!!>`      | Email for git configuration   |
| `<!!! your git username !!!>`   | Username for git configuration |

```dockerfile
FROM apache/incubator-doris:build-env-latest

USER root
WORKDIR /root
RUN echo '<!!! root password !!!>' | passwd root --stdin

RUN yum install -y vim net-tools man wget git mysql lsof bash-completion \
        && cp /var/local/thirdparty/installed/bin/thrift /usr/bin

# For better safety, create a user instead of using root
RUN yum install -y sudo \
        && useradd -ms /bin/bash <!!! your user !!!> && echo <!!! your user password !!!> | passwd <!!! your user !!!> --stdin \
        && usermod -a -G wheel <!!! your user !!!>

USER <!!! your user !!!>
WORKDIR /home/<!!! your user !!!>
RUN git config --global color.ui true \
        && git config --global user.email "<!!! your git email !!!>" \
        && git config --global user.name "<!!! your git username !!!>"

# Optionally install zsh and oh my zsh for easier use; remove if not needed
USER root
RUN yum install -y zsh \
        && chsh -s /bin/zsh <!!! your user !!!>
USER <!!! your user !!!>
RUN wget https://github.com/robbyrussell/oh-my-zsh/raw/master/tools/install.sh -O - | zsh \
        && git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions \
        && git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

### 2.2 Build the Image

```shell
docker build -t doris .
```

### 2.3 Run the Image

<!-- Knowledge type: Configuration parameters -->

For mount options, refer to [Docker Compilation Mount Notes](../source-install/compilation-with-docker). It is recommended to run the image by mounting the local Doris source directory.

:::caution Windows users
On Windows, mounting involves cross-filesystem access issues. Configure at your own discretion.
:::

The `--cap-add SYS_PTRACE` parameter allows the use of ptrace inside Docker, which helps with ptrace and GDB remote debugging:

```shell
docker run -it --cap-add SYS_PTRACE doris:latest /bin/bash
```

| Parameter             | Purpose                                          |
| --------------------- | ------------------------------------------------ |
| `--cap-add SYS_PTRACE` | Allows calling ptrace inside the container (required by GDB) |
| `-it`                 | Interactive TTY                                  |
| `-v <local>:<container>` | Mount a local source directory (as needed)    |

### 2.4 Configure zsh (Optional)

If you chose to install zsh, replace the plugins line in `~/.zshrc`:

```bash
plugins=(git zsh-autosuggestions zsh-syntax-highlighting)
```

### 2.5 Pull the Doris Source Code

```shell
su <your user>
mkdir code && cd code
git clone https://github.com/apache/doris.git
cd doris
git submodule update --init --recursive
```

## 3. Compile

:::caution First-time compilation
For the first compilation, use the following command to force a clean build:

```shell
sh build.sh --clean --be --fe --ui
```

The `build-env-for-0.15.0` image upgraded thrift (0.9 to 0.13), so you must use `--clean` to force the new version of thrift to generate the code files, otherwise incompatible code will appear.
:::

After that, compile Doris normally:

```shell
sh build.sh
```

## 4. Run

### 4.1 Prepare the Metadata Directory

Manually create the `meta_dir` directory for metadata storage. The default value is `${DORIS_HOME}/doris-meta`:

```shell
mkdir meta_dir
```

### 4.2 Start FE

```shell
cd output/fe
sh bin/start_fe.sh --daemon
```

### 4.3 Start BE

```shell
cd output/be
sh bin/start_be.sh --daemon
```

### 4.4 Connect with mysql-client

```shell
mysql -h 127.0.0.1 -P 9030 -u root
```

## 5. FAQ

<!-- Knowledge type: Troubleshooting -->

### Q1: GDB reports `ptrace: Operation not permitted`

The container was not started with `--cap-add SYS_PTRACE`. Restart the container with that parameter added.

### Q2: Compilation reports thrift version mismatch

The first compilation did not include `--clean`. Clean up and recompile using the command in section 3.

### Q3: FE / BE exits immediately after starting

Check whether `meta_dir` and `storage_root_path` have been created, whether the ports are unoccupied, and whether `priority_networks` covers the container IP.

### Q4: VSCode Remote container cannot attach to a process for debugging

The `SYS_PTRACE` capability was not added, or the VSCode C/C++ plugin does not specify a suitable `miDebuggerPath`.
