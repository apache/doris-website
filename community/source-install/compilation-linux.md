---
{
    "title": "Compiling on Linux",
    "language": "en"
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

This guide is about how to compile Doris on Linux using Ubuntu 24.04 or later versions.

## Install JDK.

```Plain
# Oracle JDK 8 or OpenJDK 8 for Doris 2.1 and earlier versions
sudo apt install openjdk-8-jdk
# For versions later than 3.0 (inclusive), or the master branch, please use JDK 17
sudo apt install openjdk-17-jdk
```

## Make sure you have the following system dependencies installed.

GCC 10+, Python 2.7+, Apache Maven 3.5+, CMake 3.19.2+, Bison 3.0+

```Plain
sudo apt install build-essential maven cmake byacc flex automake libtool-bin bison binutils-dev libiberty-dev zip unzip libncurses5-dev curl git ninja-build python
sudo apt-get install -y software-properties-common
sudo add-apt-repository ppa:ubuntu-toolchain-r/ppa
sudo apt update
sudo apt install gcc-10 g++-10 
sudo apt-get install autoconf automake libtool autopoint
```

## Like compiling with a Docker development image, check if AVX2 instructions are supported first. 

```Plain
$ cat /proc/cpuinfo | grep avx2
```

## If supported, execute the following command for compilation.

```Plain
# By default, it builds AVX2 version.
$ sh build.sh

# If you need the no AVX2 version, add USE_AVX2=0.
$ USE_AVX2=0 sh build.sh

# To compile a debug version of BE, add BUILD_TYPE=Debug.
$ BUILD_TYPE=Debug sh build.sh
```

## After compilation, the output files can be found in the `output/` directory.