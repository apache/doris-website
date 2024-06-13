---
{
    "title": "Compiling on MacOS",
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

# Compile on MacOS

This guide is about how to compile Doris on MacOS.

## Prerequisites

- MacOS 12 (Monterey) or later (Both **Intel** and **Apple Silicon** are supported.)
- [Homebrew](https://brew.sh/)

## Compile source code

1. **Install dependencies using** **[Homebrew](https://brew.sh/)**

```Shell
brew install automake autoconf libtool pkg-config texinfo coreutils gnu-getopt \
python@3 cmake ninja ccache bison byacc gettext wget pcre maven llvm@16 openjdk@11 npm
```

:::tip 
On MacOS, since Homebrew does not provide an installation package for JDK8, JDK11 is used here instead. Alternatively, you can manually download and install JDK8. 
:::

2. **Compile source code**

```Shell
bash build.sh
```

:::tip 
The first step of compiling Doris is to download and compile third-party libraries. You can download the pre-compiled versions of third-party libraries provided by the Doris community. Please refer to the instructions below for downloading **pre-compiled third-party libraries** to speed up the build process. 
:::

## Start

1. **Increase file descriptors limit**

```Shell
# Increase the file descriptor limit using the ulimit command.
ulimit -n 65536

# Check if the change is effective.
$ ulimit -n

# Add the configuration to your startup script so that you do not have to set it again every time you open a new terminal session.
# If you are using bash, execute the following statement:
echo 'ulimit -n 65536' >>~/.bashrc
# If you are using zsh, execute the following statement:
echo 'ulimit -n 65536' >>~/.zshrc
```

2. **Start BE**

```Shell
cd output/be/bin
./start_be.sh --daemon
```

3. **Start** **FE**

```Shell
cd output/fe/bin
./start_fe.sh --daemon
```

## Speed up by using pre-compiled third-party libraries

Download the pre-compiled third-party libraries from [Apache Doris Third Party Prebuilt](https://github.com/apache/doris-thirdparty/releases/tag/automation). Refer to the command below: 

```Bash
cd thirdparty
rm -rf installed

# Intel chip
curl -L https://github.com/apache/doris-thirdparty/releases/download/automation/doris-thirdparty-prebuilt-darwin-x86_64.tar.xz \
    -o - | tar -Jxf -

# Apple Silicon chip
curl -L https://github.com/apache/doris-thirdparty/releases/download/automation/doris-thirdparty-prebuilt-darwin-arm64.tar.xz \
    -o - | tar -Jxf -

# Check if protoc and thrift functions normally
cd installed/bin

./protoc --version
./thrift --version
```

:::tip 
When running protoc and thrift, you may encounter an issue where the binary cannot be opened due to developer verification. To resolve this, you can go to "Security & Privacy" settings. In the "General" tab, click on the "Open Anyway" button to confirm your intent to open the binary. Refer to: https://support.apple.com/en-us/102445 
:::

## Common Errors
1. When running `protoc` and `thrift`, you may encounter an issue where the binary cannot be opened due to developer verification. To resolve this, you can go to "Security & Privacy" settings. In the "General" tab, click on the "Open Anyway" button to confirm your intent to open the binary. Refer to: https://support.apple.com/en-us/102445.
2. When compiling with a Mac with an M3 chip, the compilation of the proto file fails.
The failure log is as follows:
```Shell
[ERROR] ... [0:0]: --grpc-java_out: protoc-gen-grpc-java: Plugin failed with status code 1.
```
The reason for this error may be that the Apple arm-based chip does not support software on the x86 platform. 
You can download the protoc-gen-grpc-java software used from https://repo.maven.apache.org/maven2/io/grpc/protoc-gen-grpc-java/, and the version information can be viewed from the grpc.java.artifact property under the protoc_rosetta profile in fe/fe-core/pom.xml. If the following error is reported after downloading and executing, it means that the current Mac cannot execute software based on x86 compiled software.
```Shell
zsh: bad CPU type in executable:./protoc-gen-grpc-java-1.34.0-osx-x86_64.exe
```
You can refer to the official documentation https://support.apple.com/en-us/102527 and install `Rosetta` to solve this problem.