---
{
    "title": "Arm 平台上编译",
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

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

本文档介绍如何在 ARM64 平台上编译 Doris。

注意，该文档仅作为指导性文档。在不同环境中编译可能出现其他错误。如遇问题，欢迎向 Doris [提出 Issue](https://github.com/apache/doris/issues) 或解决方案。

## 硬件/操作系统环境

-   系统版本：CentOS 7.9、Ubuntu 20.04

-   系统架构：ARM64

-   内存：16 GB +

## 软件环境配置

### 软件环境对照表

| 组件名称                                                     | 组件版本                |
| ------------------------------------------------------------ | ----------------------- |
| Git                                                          | 2.0+                    |
| JDK                                                          | 1.8.0                   |
| Maven                                                        | 3.6.3                   |
| NodeJS                                                       | 16.3.0                  |
| LDB-Toolchain                                                | 0.9.1                   |
| 常备环境：byacc patch automake libtool make which file ncurses-devel gettext-devel unzip bzip2 zip util-linux wget git python2 | yum 或 apt 自动安装即可 |
| autoconf                                                     | 2.69                    |
| bison                                                        | 3.0.4                   |

### CentOS 7.9 软件环境安装

**1.  创建软件下载安装包根目录和软件安装根目录**

```shell
# 创建软件下载安装包根目录
mkdir /opt/tools

# 创建软件安装根目录
mkdir /opt/software
```

**2.  安装依赖项**

```shell
### Git ###
# 省去编译麻烦，直接使用 yum 安装
yum install -y git

### JDK8 两种方式，任选一种 ###
# 第一种是省去额外下载和配置，直接使用 yum 安装，安装 devel 包是为了获取一些工具，如 jps 命令
yum install -y java-1.8.0-openjdk java-1.8.0-openjdk-devel        
# 第二种是下载 ARM64 架构的安装包，解压配置环境变量后使用
cd /opt/tools
wget https://doris-thirdparty-repo.bj.bcebos.com/thirdparty/jdk-8u291-linux-aarch64.tar.gz && tar -zxvf jdk-8u291-linux-aarch64.tar.gz && \
mv jdk1.8.0_291 /opt/software/jdk8

### Maven ###
cd /opt/tools
# wget 工具下载后，直接解压缩配置环境变量使用
wget https://archive.apache.org/dist/maven/maven-3/3.6.3/binaries/apache-maven-3.6.3-bin.tar.gz && tar -zxvf apache-maven-3.6.3-bin.tar.gz && \
mv apache-maven-3.6.3 /opt/software/maven

### NodeJS ###
cd /opt/tools
# 下载 ARM64 架构的安装包
wget https://doris-thirdparty-repo.bj.bcebos.com/thirdparty/node-v16.3.0-linux-arm64.tar.xz && tar -xvf node-v16.3.0-linux-arm64.tar.xz && \
mv node-v16.3.0-linux-arm64 /opt/software/nodejs

### LDB-Toolchain ###
cd /opt/tools
# 下载 LDB-Toolchain ARM 版本
wget https://github.com/amosbird/ldb_toolchain_gen/releases/download/v0.9.1/ldb_toolchain_gen.aarch64.sh && sh ldb_toolchain_gen.aarch64.sh /opt/software/ldb_toolchain/

### 其他 ###
# install required system packages
sudo yum install -y byacc patch automake libtool make which file ncurses-devel gettext-devel unzip bzip2 bison zip util-linux wget git python2

# install autoconf-2.69
cd /opt/tools
wget http://ftp.gnu.org/gnu/autoconf/autoconf-2.69.tar.gz && \
    tar zxf autoconf-2.69.tar.gz && \
    mv autoconf-2.69 /opt/software/autoconf && \
    cd /opt/software/autoconf && \
    ./configure && \
    make && \
    make install
```

**3.  配置环境变量**

```shell
# 配置环境变量
vim /etc/profile.d/doris.sh
export JAVA_HOME=/opt/software/jdk8
export MAVEN_HOME=/opt/software/maven
export NODE_JS_HOME=/opt/software/nodejs
export LDB_HOME=/opt/software/ldb_toolchain
export PATH=$JAVA_HOME/bin:$MAVEN_HOME/bin:$NODE_JS_HOME/bin:$LDB_HOME/bin:$PATH

# 保存退出并刷新环境变量
source /etc/profile.d/doris.sh

# 测试是否成功
java -version
> java version "1.8.0_291"
mvn -version
> Apache Maven 3.6.3
node --version
> v16.3.0
gcc --version
> gcc-11
```

### Ubuntu 20.04 软件环境安装

**1.  更新 apt-get 软件库**

```shell
apt-get update
```

**2.  重新配置 shell**

```shell
# Ubuntu 的 shell 默认安装的是 dash，而不是 bash，要切换成 bash 才能执行，运行以下命令查看 sh 的详细信息，确认 shell 对应的程序是哪个：
ls -al /bin/sh

# 通过以下方式可以使 shell 切换回 bash
sudo dpkg-reconfigure dash
# 然后选择 no 或者 否 ，并确认。这样做将重新配置 dash，并使其不作为默认的 shell 工具
```

**3.  创建软件下载安装包根目录和软件安装根目录**

```shell
# 创建软件下载安装包根目录
mkdir /opt/tools

# 创建软件安装根目录
mkdir /opt/software
```

**4.  安装依赖项**

```shell
### Git ###
# 省去编译麻烦，直接使用 apt-get 安装
apt-get -y install git

### JDK8 ###      
# 下载 ARM64 架构的安装包，解压配置环境变量后使用
cd /opt/tools
wget https://doris-thirdparty-repo.bj.bcebos.com/thirdparty/jdk-8u291-linux-aarch64.tar.gz && tar -zxvf jdk-8u291-linux-aarch64.tar.gz && \
mv jdk1.8.0_291 /opt/software/jdk8

### Maven ###
cd /opt/tools
# wget 工具下载后，直接解压缩配置环境变量使用
wget https://dlcdn.apache.org/maven/maven-3/3.6.3/binaries/apache-maven-3.6.3-bin.tar.gz && tar -zxvf apache-maven-3.6.3-bin.tar.gz && \
mv apache-maven-3.6.3 /opt/software/maven

### NodeJS ###
cd /opt/tools
# 下载 ARM64 架构的安装包
wget https://doris-thirdparty-repo.bj.bcebos.com/thirdparty/node-v16.3.0-linux-arm64.tar.xz && tar -xvf node-v16.3.0-linux-arm64.tar.xz && \
mv node-v16.3.0-linux-arm64 /opt/software/nodejs

### LDB-Toolchain ###
cd /opt/tools
# 下载 LDB-Toolchain ARM 版本
wget https://github.com/amosbird/ldb_toolchain_gen/releases/download/v0.9.1/ldb_toolchain_gen.aarch64.sh && sh ldb_toolchain_gen.aarch64.sh /opt/software/ldb_toolchain/

### 其他 ###
# install required system packages
sudo apt install -y build-essential cmake flex automake bison binutils-dev libiberty-dev zip libncurses5-dev curl ninja-build
sudo apt-get install -y make
sudo apt-get install -y unzip
sudo apt-get install -y python2
sudo apt-get install -y byacc
sudo apt-get install -y automake
sudo apt-get install -y libtool
sudo apt-get install -y bzip2
sudo add-apt-repository ppa:ubuntu-toolchain-r/ppa 
sudo apt update
sudo apt install gcc-11 g++-11 
sudo apt-get -y install autoconf autopoint

# install autoconf-2.69
cd /opt/tools
wget http://ftp.gnu.org/gnu/autoconf/autoconf-2.69.tar.gz && \
    tar zxf autoconf-2.69.tar.gz && \
    mv autoconf-2.69 /opt/software/autoconf && \
    cd /opt/software/autoconf && \
    ./configure && \
    make && \
    make install
```

**5.  配置环境变量**

```shell
# 配置环境变量
vim /etc/profile.d/doris.sh
export JAVA_HOME=/opt/software/jdk8
export MAVEN_HOME=/opt/software/maven
export NODE_JS_HOME=/opt/software/nodejs
export LDB_HOME=/opt/software/ldb_toolchain
export PATH=$JAVA_HOME/bin:$MAVEN_HOME/bin:$NODE_JS_HOME/bin:$LDB_HOME/bin:$PATH

# 保存退出并刷新环境变量
source /etc/profile.d/doris.sh

# 测试是否成功
java -version
> java version "1.8.0_291"
mvn -version
> Apache Maven 3.6.3
node --version
> v16.3.0
gcc --version
> gcc-11
```

## 编译

目前 ARM 环境仅推荐使用 LDB Toolchain 进行编译。

在 ARM 平台编译 Doris 时，请关闭 AVX2 和 LIBUNWIND 三方库：

```shell
export USE_AVX2=OFF
export USE_UNWIND=OFF
```

然后参考 使用 LDB Toolchain 编译文档，进行编译。

## 常见问题

**1.  编译第三方库 libhdfs3.a，找不到文件夹**

在执行编译安装过程中，出现了如下报错 `not found lib/libhdfs3.a file or directory`。

问题原因：第三方库的依赖下载有问题。

解决方案：使用第三方库下载仓库    

```shell
export REPOSITORY_URL=https://doris-thirdparty-repo.bj.bcebos.com/thirdparty
sh /opt/doris/thirdparty/build-thirdparty.sh
```

REPOSITORY_URL 中包含所有第三方库源码包和他们的历史版本。

**2.  Python 命令未找到**

执行 build.sh 时抛出异常：

```
/opt/doris/env.sh: line 46: python: command not found
```

问题可能原因：系统默认使用 `python2.7`、 `python3.6`、`python2`、`python3` 这几个命令来执行 python 命令，Doris 安装依赖需要 python 2.7+ 版本即可，故只需要添加名为 `python` 的命令连接即可，使用版本 2 和版本 3 的都可以。

解决方案：建立 `\usr\bin` 中 `python` 命令的软连接，比如：

```Shell
sudo ln -s /usr/bin/python2.7 /usr/bin/python
```

**3.  编译结束后没有 output 目录**

build.sh 执行结束后，目录中未发现 output 文件夹。

问题原因：未成功编译，需重新编译。

解决方案如下：

```Shell
sh build.sh --clean
```

**4.  剩余空间不足，编译失败**

编译过程中报“构建 CXX 对象失败，提示剩余空间不足”。

`fatal error: error writing to /tmp/ccKn4nPK.s: No space left on device 1112 | } // namespace doris::vectorized compilation terminated.`

解决方案：扩大设备剩余空间，如删除不需要的文件等。

**5. 在 pkg.config 中找不到 pkg.m4 文件**

编译过程中出现了找不到文件错误，报错如下：

`Couldn't find pkg.m4 from pkg-config. Install the appropriate package for your distribution or set ACLOCAL_PATH to the directory containing pkg.m4.`

通过查找上面的日志，发现是 `libxml2` 这个三方库在编译的时候出现了问题。

问题原因：`libxml2` 三方库编译错误，找不到 pkg.m4 文件。很有可能是：

- Ubuntu 系统加载环境变量时有异常，导致 ldb 目录下的索引未被成功加载；

- 在 libxml2 编译时检索环境变量失效，导致编译过程没有检索到 ldb/aclocal 目录。

解决方案是：将 ldb/aclocal 目录下的 `pkg.m4` 文件拷贝至 libxml2/m4 目录下，重新编译第三方库

```Shell
 cp /opt/software/ldb_toolchain/share/aclocal/pkg.m4 /opt/doris/thirdparty/src/libxml2-v2.9.10/m4
 sh /opt/doris/thirdparty/build-thirdparty.sh
```

**6. 执行测试 CURL_HAS_TLS_PROXY 失败**

三方包编译过程报错，错误如下：

`-- Performing Test CURL_HAS_TLS_PROXY - Failed CMake Error at cmake/dependencies.cmake:15 (get_property): INTERFACE_LIBRARY targets may only have whitelisted properties. The property "LINK_LIBRARIES_ALL" is not allowed.`

查看日志以后，发现内部是由于 curl `No such file or directory`

`fa``tal error: curl/curl.h: No such file or directory 2 | #include <curl/curl.h> compilation terminated. ninja: build stopped: subcommand failed.`

问题原因：编译环境有错误，查看 gcc 版本后发现是系统自带的 9.3.0 版本，故而没有走 ldb 编译，需设置 ldb 环境变量。

解决方案：配置 ldb 环境变量：

```Shell
 # 配置环境变量
 vim /etc/profile.d/ldb.sh
 export LDB_HOME=/opt/software/ldb_toolchain
 export PATH=$LDB_HOME/bin:$PATH
 # 保存退出并刷新环境变量
 source /etc/profile.d/ldb.sh
 # 测试
 gcc --version
 # 显示 gcc-11
```

**7. 其他组件问题**

如有以下组件的错误提示，则统一以该方案解决：

-   bison 相关：安装 bison-3.0.4 时报 fseterr.c 错误

-   flex 相关：flex 命令未找到

-   cmake 相关

    -   cmake 命令未找到

    -   cmake 找不到依赖库

    -   cmake 找不到 CMAKE_ROOT

    -   cmake 环境变量 CXX 中找不到编译器集

-   boost 相关：Boost.Build 构建引擎失败

-   mysql 相关：找不到 mysql 的客户端依赖 a 文件

-   gcc 相关：GCC 版本需要 11+

问题原因：都是未使用正确的 ldb-toolchain 进行编译。

解决方案如下：

-   检查 ldb-toolchain 环境变量是否配置

-   查看 gcc 版本是否与[使用 LDB-Toolchain 编译](../../install/source-install/compilation-with-ldb-toolchain)文档中推荐一致

-   删除 `ldb_toolchain_gen.aarch64.sh` 脚本执行后的 ldb 目录，重新执行并配置环境变量，验证 gcc 版本