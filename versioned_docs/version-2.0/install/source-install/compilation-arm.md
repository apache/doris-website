---
{
"title": "Compilation with Arm",
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

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Compile with ARM

This document describes how to compile Doris on the ARM64 platform.

Please note that this document is provided as a guide only. Compiling in different environments may result in different errors. If you encounter any problems, feel free to raise an [issue](https://github.com/apache/doris/issues) or propose a solution to Doris.

## Hardware/OS environment

- System version: CentOS 8.4, Ubuntu 20.04
- System architecture: ARM64
- Memory: 16 GB +

## Software Environment

### Software Environment List

| Component Name                                               | Component Version              |
| ------------------------------------------------------------ | ------------------------------ |
| Git                                                          | 2.0+                           |
| JDK                                                          | 1.8.0                          |
| Maven                                                        | 3.6.3                          |
| NodeJS                                                       | 16.3.0                         |
| LDB-Toolchain                                                | 0.9.1                          |
| Commonly Used Components: byacc patch automake libtool make which file ncurses-devel gettext-devel unzip bzip2 zip util-linux wget git python2 | yum install or apt-get install |
| autoconf                                                     | 2.69                           |
| bison                                                        | 3.0.4                          |

### Install with CentOS 8.4

1. **Create a root directory for software package and a root directory for software installation.**

```Bash
# Create a root directory for software package.
mkdir /opt/tools

# Create a root directory for software installation.
mkdir /opt/software
```

2. **Install dependencies.**

```Bash
### Git ###
# Use yum install to save the trouble of compilation.
yum install -y git

### You can choose either one of the two methods to install JDK8. ###
# The first one is yum install. It eliminates the need for additional downloads and configurations. Install the devel package to obtain certain tools, such as the jps command.
yum install -y java-1.8.0-openjdk java-1.8.0-openjdk-devel        
# The second once is to download the installation package for ARM64, extract it, and configure the environment variables.
cd /opt/tools
wget https://doris-thirdparty-repo.bj.bcebos.com/thirdparty/jdk-8u291-linux-aarch64.tar.gz && tar -zxvf jdk-8u291-linux-aarch64.tar.gz && \
mv jdk1.8.0_291 /opt/software/jdk8

### Maven ###
cd /opt/tools
# After downloading with wget, extract the package, and configure the environment variables.
wget https://dlcdn.apache.org/maven/maven-3/3.6.3/binaries/apache-maven-3.6.3-bin.tar.gz && tar -zxvf apache-maven-3.6.3-bin.tar.gz && \
mv apache-maven-3.6.3 /opt/software/maven

### NodeJS ###
cd /opt/tools
# Download package for ARM64
wget https://doris-thirdparty-repo.bj.bcebos.com/thirdparty/node-v16.3.0-linux-arm64.tar.xz && tar -xvf node-v16.3.0-linux-arm64.tar.xz && \
mv node-v16.3.0-linux-arm64 /opt/software/nodejs

### LDB-Toolchain ###
cd /opt/tools
# Download LDB-Toolchain for ARM
wget https://github.com/amosbird/ldb_toolchain_gen/releases/download/v0.9.1/ldb_toolchain_gen.aarch64.sh && sh ldb_toolchain_gen.aarch64.sh /opt/software/ldb_toolchain/

### Others ###
# Install required system packages
sudo yum install -y byacc patch automake libtool make which file ncurses-devel gettext-devel unzip bzip2 bison zip util-linux wget git python2

# Install autoconf-2.69
cd /opt/tools
wget http://ftp.gnu.org/gnu/autoconf/autoconf-2.69.tar.gz && \
    tar zxf autoconf-2.69.tar.gz && \
    mv autoconf-2.69 /opt/software/autoconf && \
    cd /opt/software/autoconf && \
    ./configure && \
    make && \
    make install
```

3. **Configure environment variables**

```Bash
# Configure the environment variables.
vim /etc/profile.d/doris.sh
export JAVA_HOME=/opt/software/jdk8
export MAVEN_HOME=/opt/software/maven
export NODE_JS_HOME=/opt/software/nodejs
export LDB_HOME=/opt/software/ldb_toolchain
export PATH=$JAVA_HOME/bin:$MAVEN_HOME/bin:$NODE_JS_HOME/bin:$LDB_HOME/bin:$PATH

# Save, exit, and refresh the environment variables.
source /etc/profile.d/doris.sh

# Check if the configuration succeeds.
java -version
> java version "1.8.0_291"
mvn -version
> Apache Maven 3.6.3
node --version
> v16.3.0
gcc --version
> gcc-11
```

### Install with Ubuntu 20.04

1. **Update apt-get software library**

```Bash
apt-get update
```

2. **Reconfigure shell**

```Bash
# By default, Ubuntu's shell is set to dash instead of bash, so please switch to bash before continuing. Run the following command to view detailed information about shell and confirm which program it corresponds to.
ls -al /bin/sh

# Switch the shell to bash.
sudo dpkg-reconfigure dash
# Select no and confirm. This will reconfigure dash and make it no longer the default shell tool.
```

3. **Create a root directory for software package and a root directory for software installation.**

```Bash
# Create a root directory for software package.
mkdir /opt/tools

# Create a root directory for software installation.
mkdir /opt/software
```

4. **Install dependencies.**

```Bash
### Git ###
# Use apt-get install to save the trouble of compilation.
apt-get -y install git

### JDK8 ###      
# Download the installation package for ARM64, extract it, and configure the environment variables.
cd /opt/tools
wget https://doris-thirdparty-repo.bj.bcebos.com/thirdparty/jdk-8u291-linux-aarch64.tar.gz && tar -zxvf jdk-8u291-linux-aarch64.tar.gz && \
mv jdk1.8.0_291 /opt/software/jdk8

### Maven ###
cd /opt/tools
# After downloading with wget, extract the package, and configure the environment variables.
wget https://dlcdn.apache.org/maven/maven-3/3.6.3/binaries/apache-maven-3.6.3-bin.tar.gz && tar -zxvf apache-maven-3.6.3-bin.tar.gz && \
mv apache-maven-3.6.3 /opt/software/maven

### NodeJS ###
cd /opt/tools
# Download package for ARM64
wget https://doris-thirdparty-repo.bj.bcebos.com/thirdparty/node-v16.3.0-linux-arm64.tar.xz && tar -xvf node-v16.3.0-linux-arm64.tar.xz && \
mv node-v16.3.0-linux-arm64 /opt/software/nodejs

### LDB-Toolchain ###
cd /opt/tools
# Download LDB-Toolchain for ARM
wget https://github.com/amosbird/ldb_toolchain_gen/releases/download/v0.9.1/ldb_toolchain_gen.aarch64.sh && sh ldb_toolchain_gen.aarch64.sh /opt/software/ldb_toolchain/

### Others ###
# Install required system packages
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

5. **Configure environment variables**

```Bash
# Configure the environment variables.
vim /etc/profile.d/doris.sh
export JAVA_HOME=/opt/software/jdk8
export MAVEN_HOME=/opt/software/maven
export NODE_JS_HOME=/opt/software/nodejs
export LDB_HOME=/opt/software/ldb_toolchain
export PATH=$JAVA_HOME/bin:$MAVEN_HOME/bin:$NODE_JS_HOME/bin:$LDB_HOME/bin:$PATH

# Save, exit, and refresh the environment variables.
source /etc/profile.d/doris.sh

# Check if the configuration succeeds.
java -version
> java version "1.8.0_291"
mvn -version
> Apache Maven 3.6.3
node --version
> v16.3.0
gcc --version
> gcc-11
```

## Compile

:::tip 
It is recommended to use LDB Toolchain for compilation with ARM environment. 
:::

When compiling Doris on an ARM platform, please disable the AVX2 and LIBUNWIND third-party libraries.

```Bash
export USE_AVX2=OFF
export USE_UNWIND=OFF
```

Then, continue the compilation by referring to the "Compile with LDB Toolchain" documentation.

## FAQ

1. **Cannot find the libhdfs3.a file when compiling when compiling third-party libraries**

Encounter the error message as: `not found lib/libhdfs3.a file or directory` during compilation

Cause: Something wrong with dependency download for the third-party library

Solution: Use a third-party library download repository.

```Bash
export REPOSITORY_URL=https://doris-thirdparty-repo.bj.bcebos.com/thirdparty
sh /opt/doris/thirdparty/build-thirdparty.sh
```

The REPOSITORY_URL contains source code packages for all third-party libraries and their historical versions.

2. **Cannot find python command**

An exception is thrown when executing build.sh:

```
/opt/doris/env.sh: line 46: python: command not found
```

Possible cause: The system typically uses `python2.7`, `python3.6`, `python2`, and `python3` to execute Python commands. However, Doris installation dependencies only require Python 2.7+, so you just need to create a symbolic link for the `python` command, which can be linked to either Python version 2 or version 3.

Solution: Create a symbolic link for the `python` command in the `\usr\bin` directory, for example:

```Shell
sudo ln -s /usr/bin/python2.7 /usr/bin/python
```

3. **No "output" directory after compilation**

After executing build.sh, the "output" folder is not found in the directory.

Cause: The compilation was not successful and needs to be recompiled.

Solution.

```Shell
sh build.sh --clean
```

4. **Compilation failure due to insufficient remaining space**

An error is thrown like the following during compilation:

`fatal error: error writing to /tmp/ccKn4nPK.s: No space left on device 1112 | } // namespace doris::vectorized compilation terminated.`

Solution: Increase the available space on the device by deleting unnecessary files or freeing up storage.

5. **Cannot find** **`pkg.m4`** **file in** **`pkg.config`**

An error is thrown like the following during compilation:

`Couldn't find pkg.m4 from pkg-config. Install the appropriate package for your distribution or set ACLOCAL_PATH to the directory containing pkg.m4.`

After examining the logs, it is found that the issue is related to the compilation of the `libxml2` third-party library.

Cause: Possible causes of compilation error of `libxml2` include: 

- 1）Exceptions in loading environment variables in the Ubuntu system, resulting in the ldb directory's index not being successfully loaded.
- 2）Failure to retrieve environment variables during libxml2 compilation, causing the compilation process to not find the ldb/aclocal directory.

Solution: Copy the `pkg.m4` file from the ldb/aclocal directory to the libxml2/m4 directory and recompile the third-party library.

```Shell
 cp /opt/software/ldb_toolchain/share/aclocal/pkg.m4 /opt/doris/thirdparty/src/libxml2-v2.9.10/m4
 sh /opt/doris/thirdparty/build-thirdparty.sh
```

6. **Failure in executing the CURL_HAS_TLS_PROXY test**

An error is thrown like the following during the compilation of third-party package:

`-- Performing Test CURL_HAS_TLS_PROXY - Failed CMake Error at cmake/dependencies.cmake:15 (get_property): INTERFACE_LIBRARY targets may only have whitelisted properties. The property "LINK_LIBRARIES_ALL" is not allowed.`

After reviewing the logs, it is found that the error is caused by `No such file or directory`

`fatal error: curl/curl.h: No such file or directory 2 | #include <curl/curl.h> compilation terminated. ninja: build stopped: subcommand failed.`

Cause: There is an error in the compilation environment. Check the gcc version and it can be found that the system comes with version 9.3.0. That's why it does not use the ldb compilation. Hence, you should configure the ldb environment variables.

Solution: Configure the ldb environment variables:

```Shell
 # Configure the environment variables
 vim /etc/profile.d/ldb.sh
 export LDB_HOME=/opt/software/ldb_toolchain
 export PATH=$LDB_HOME/bin:$PATH
 # Save, exit, and refresh the environment variables
 source /etc/profile.d/ldb.sh
 # Test
 gcc --version
 # Show gcc-11
```

7. **Other component issues**

If you encounter error messages related to the following components, you can solve them by one solution.

- bison: fseterr.c error reported when installing bison-3.0.4
- flex: "flex" command not found
- cmake:
  - cmake command not found
  - cannot find the required dependencies for cmake
  - cannot find CMAKE_ROOT
  - The CXX environment variable in cmake does not contain a compiler set
- boost: Boost.Build engine failure.
- mysql: missing client dependency file for MySQL (a file ending in .a).
- gcc: gcc version needs to be 11+.

Cause: All these issues arise from not using the correct ldb-toolchain for compilation.

Solution:

- Check if the ldb-toolchain environment variable is properly configured.
- Verify if the GCC version matches the recommended version in the [Compile with LDB Toolchain](https://doris.apache.org/docs/2.0/install/source-install/compilation-with-ldb-toolchain) documentation.
- Delete the ldb directory generated after executing the `ldb_toolchain_gen.aarch64.sh` script. Re-run the script, configure the environment variables, and verify the GCC version.
