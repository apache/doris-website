---
{
    "title": 使用 LDB Toolchain 编译（推荐）,
    "language": "zh-CN"
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

本文档主要介绍如何使用 LDB Toolchain 编译 Doris。该方式目前作为 Docker 编译方式的补充，方便没有 Docker 环境的开发者和用户编译 Doris 源码。Doris 目前推荐的 LDB Toolchain 版本为 0.17, 其中含有 clang-16 和 gcc-11。

:::tip
LDB Toolchain 全称 Linux Distribution Based Toolchain Generator，它有助于在几乎所有 Linux 发行版上编译现代 C++ 项目。
:::

感谢 [Amos Bird](https://github.com/amosbird) 的贡献。

## 准备编译环境

该方式适用于绝大多数 Linux 发行版（CentOS，Ubuntu 等）。

**1. 下载`ldb_toolchain_gen.sh`**

可以从[这里](https://github.com/amosbird/ldb_toolchain_gen/releases)下载最新的 `ldb_toolchain_gen.sh`。该脚本用于生成 LDB Toolchain

:::tip
更多信息，可访问 https://github.com/amosbird/ldb_toolchain_gen
:::

**2. 执行以下命令生成 ldb toolchain**

```Plain
sh ldb_toolchain_gen.sh /path/to/ldb_toolchain/
```

其中 `/path/to/ldb_toolchain/` 为安装 Toolchain 目录。执行成功后，会在 `/path/to/ldb_toolchain/` 下生成如下目录结构：

```Plain
├── bin
├── include
├── lib
├── share
├── test
└── usr
```

**3. 下载并安装其他编译组件**

-   下载 [Java8](https://doris-thirdparty-1308700295.cos.ap-beijing.myqcloud.com/tools/jdk-8u391-linux-x64.tar.gz)，安装到 /path/to/java

    > 3.0（含）之后的版本，或 master 分支，请使用 [Java 17](https://download.oracle.com/java/17/archive/jdk-17.0.10_linux-x64_bin.tar.gz)。

-   下载 [Apache Maven 3.6.3](https://doris-thirdparty-repo.bj.bcebos.com/thirdparty/apache-maven-3.6.3-bin.tar.gz)，安装到 /path/to/maven

-   下载 [Node v12.13.0](https://doris-thirdparty-repo.bj.bcebos.com/thirdparty/node-v12.13.0-linux-x64.tar.gz)，安装到 /path/to/node

-   对于不同的 Linux 发行版，可能默认包含的组件不同。因此可能需要安装一些额外的组件。下面以 CentOS6 为例，其他发行版类似：

```Plain
install required system packages
sudo yum install -y byacc patch automake libtool make which file ncurses-devel gettext-devel unzip bzip2 zip util-linux wget git python2

install autoconf-2.69
wget http://ftp.gnu.org/gnu/autoconf/autoconf-2.69.tar.gz && \
    tar zxf autoconf-2.69.tar.gz && \
    cd autoconf-2.69 && \
    ./configure && \
    make && \
    make install

install bison-3.0.4
wget http://ftp.gnu.org/gnu/bison/bison-3.0.4.tar.gz && \
    tar xzf bison-3.0.4.tar.gz && \
    cd bison-3.0.4 && \
    ./configure && \
    make && \
    make install
```

**4. 下载 Doris 源码**

```Plain
git clone https://github.com/apache/doris.git
```

下载完成后，进入到 Doris 源码目录，创建 `custom_env.sh`文件，并设置 PATH 环境变量，如：

```Plain
export JAVA_HOME=/path/to/java/
export PATH=$JAVA_HOME/bin:$PATH
export PATH=/path/to/maven/bin:$PATH
export PATH=/path/to/node/bin:$PATH
export PATH=/path/to/ldb_toolchain/bin:$PATH
```

## 编译 Doris

:::tip
Doris 源码编译时首先会下载三方库进行编译，可以参考下文下载预编译版本的三方库，省去三方库编译
:::

**1.  进入 Doris 源码目录，执行如下命令查看编译机器是否支持 AVX2 指令集**

```Bash
$ cat /proc/cpuinfo | grep avx2
```

**2.  执行编译**

```Plain
# 默认编译出支持 AVX2 的
$ sh build.sh

# 如不支持 AVX2 需要加 USE_AVX2=0
$ USE_AVX2=0 sh build.sh

# 如需编译 Debug 版本的 BE，增加 BUILD_TYPE=Debug
$ BUILD_TYPE=Debug sh build.sh
```

该脚本会先编译第三方库，之后再编译 Doris 组件（FE、BE、MS）。编译产出在 `output/` 目录下。
MS模块是doris存算分离模式依赖的模块, 详细说明请参考[此连接](../compute-storage-decoupled/compilation-and-deployment.md)

## 预编译三方库

`build.sh` 脚本会先编译第三方库。你也可以直接下载预编译好的三方库：

```
https://github.com/apache/doris-thirdparty/releases
```

这里我们提供了 Linux 和 MacOS 的预编译三方库。如果和你的编译运行环境一致，可以直接下载使用。

下载好后，解压会得到一个 `installed/` 目录，将这个目录拷贝到 `thirdparty/` 目录下，之后运行 `build.sh` 即可。

