---
{
"title": "Linux 平台直接编译",
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

这里使用 Ubuntu 24.04 及以上系统来直接编译。

## 1 安装JDK 8+

安装Oracle或OpenJDK 8+版本。对于3.0（含）之后的版本，或 master 分支，需要安装JDK 17

```Plain
# 编译2.1及以下版本，可安装JDK 8
sudo apt install openjdk-8-jdk

# 编译3.0及以上版本，需安装JDK 17
sudo apt install openjdk-17-jdk
```

## 2 安装其他的系统依赖

GCC 10+, Python 2.7+, Apache Maven 3.5+, CMake 3.19.2+ , Bison 3.0+

```Plain
sudo apt install build-essential maven cmake byacc flex automake libtool-bin bison binutils-dev libiberty-dev zip unzip libncurses5-dev curl git ninja-build python
sudo add-apt-repository ppa:ubuntu-toolchain-r/ppa
sudo apt update
sudo apt install gcc-10 g++-10 
sudo apt-get install autoconf automake libtool autopoint
```

## 3 与使用 Docker 开发镜像编译一样，编译之前先检查是否支持 AVX2 指令

```Plain
$ cat /proc/cpuinfo | grep avx2
```

## 4 支持则使用下面命令进行编译

```Plain
# 默认编译出支持 AVX2 的
$ sh build.sh

# 如不支持 AVX2 需要加 USE_AVX2=0
$ USE_AVX2=0 sh build.sh

# 如需编译 Debug 版本的 BE，增加 BUILD_TYPE=Debug
$ BUILD_TYPE=Debug sh build.sh
```

## 5 编译完成后，产出文件在 `output/` 目录中。