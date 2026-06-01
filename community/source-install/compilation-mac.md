---
title: Compiling Apache Doris on macOS
language: en
description: Compile Apache Doris on macOS (Intel / Apple Silicon) and prepare for local debugging.
keywords:
    - macOS compilation
    - Apple Silicon
    - Intel Mac
    - Apache Doris
    - source compilation
    - Homebrew
    - Thrift
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
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Local development / macOS debugging -->

# Compiling on macOS

This document describes how to install dependencies, compile from source, run, and prepare for local debugging of Apache Doris on macOS (Intel and Apple Silicon).

:::tip
Compute-storage decoupled mode compilation and deployment is not yet supported on macOS.
:::

## 1. Environment Requirements

- macOS 12 (Monterey) or later (both Intel and Apple Silicon are supported)
- [Homebrew](https://brew.sh/)
- JDK 8 or JDK 17 (Doris currently supports only these two versions)

## 2. Install Dependencies

Install the base dependencies with Homebrew:

```Shell
brew install automake autoconf libtool pkg-config texinfo coreutils gnu-getopt \
python@3 cmake ninja ccache bison byacc gettext wget pcre maven llvm@20 openjdk@17 npm
```

> The arm64 version of brew on macOS does not include JDK 8 by default, so `openjdk@17` is recommended. If you need JDK 8, install [Zulu JDK 8](https://www.azul.com/downloads/?version=java-8-lts&os=macos&package=jdk#zulu) manually. Maven can also be downloaded separately from the [Maven website](https://maven.apache.org/download.cgi) and configured via environment variables.

Some dependencies on Apple Silicon also require manual environment variable configuration:

```Shell
export PATH="/opt/homebrew/opt/llvm/bin:$PATH"
export PATH="/opt/homebrew/opt/bison/bin:$PATH"
export PATH="/opt/homebrew/opt/texinfo/bin:$PATH"
ln -s -f /opt/homebrew/bin/python3 /opt/homebrew/bin/python
```

## 3. Pull the Source Code and Set DORIS_HOME

```Shell
cd ~
mkdir DorisDev && cd DorisDev
git clone https://github.com/apache/doris.git

export DORIS_HOME=~/DorisDev/doris
export PATH=$DORIS_HOME/bin:$PATH
```

## 4. (Optional) Install Thrift Separately

Thrift only needs to be installed separately when debugging FE alone. When debugging both BE and FE, the BE third-party libraries already include Thrift.

```Shell
brew install thrift@0.16.0

mkdir -p ./thirdparty/installed/bin

# Apple Silicon
ln -s /opt/homebrew/Cellar/thrift@0.16.0/0.16.0/bin/thrift ./thirdparty/installed/bin/thrift

# Intel
ln -s /usr/local/Cellar/thrift@0.16.0/0.16.0/bin/thrift ./thirdparty/installed/bin/thrift
```

If `brew install thrift@0.16.0` reports that the version cannot be found, handle it as follows:

```Shell
brew tap homebrew/core --force
brew tap-new $USER/local-tap
brew extract --version='0.16.0' thrift $USER/local-tap
brew install thrift@0.16.0
```

Reference: <https://gist.github.com/tonydeng/02e571f273d6cce4230dc8d5f394493c>

## 5. Speed Up the Build with Prebuilt Third-Party Libraries (Recommended)

You can directly download the prebuilt third-party libraries provided by the community, which skips the process of compiling the third-party libraries:

```Shell
cd thirdparty
rm -rf installed

# Intel chip
curl -L https://github.com/apache/doris-thirdparty/releases/download/automation/doris-thirdparty-prebuilt-darwin-x86_64.tar.xz \
    -o - | tar -Jxf -

# Apple Silicon chip
curl -L https://github.com/apache/doris-thirdparty/releases/download/automation/doris-thirdparty-prebuilt-darwin-arm64.tar.xz \
    -o - | tar -Jxf -

# Verify that protoc and thrift run correctly
cd installed/bin
./protoc --version
./thrift --version
```

> When running `protoc` and `thrift`, if you see a prompt **cannot be opened because the developer cannot be verified**, go to `Security & Privacy → General` and click `Open Anyway`. Reference: <https://support.apple.com/zh-cn/HT202491>

You can also download the third-party library source [doris-thirdparty-source.tgz](https://github.com/apache/doris-thirdparty/releases/download/automation/doris-thirdparty-source.tgz) from the [Apache Doris Third Party Prebuilt](https://github.com/apache/doris-thirdparty/releases/tag/automation) page and compile it yourself.

## 6. Adjust the File Handle Limit

```Shell
ulimit -n 65536

# Write to the startup script so it takes effect automatically next time the terminal opens
# bash
echo 'ulimit -n 65536' >>~/.bashrc
# zsh
echo 'ulimit -n 65536' >>~/.zshrc
```

## 7. Compile

```Shell
cd $DORIS_HOME
bash build.sh
```

## 8. Start BE / FE

```Shell
cd output/be/bin && ./start_be.sh --daemon
cd output/fe/bin && ./start_fe.sh --daemon
```

## 9. Configure the Local Debugging Environment

```Shell
# Copy the build output to use as the runtime directory
cp -r output ../doris-run
```

Then modify the following in the FE / BE `conf`:

1. IP and directory settings
2. Additionally set `min_file_descriptor_number = 10000` in BE

Next, configure debugging in your IDE:

- [FE Development Environment Setup - IntelliJ IDEA](../developer-guide/fe-idea-dev)
- [BE Development Environment Setup - CLion](../developer-guide/be-clion-dev) (see "Option 2: Local Development on macOS")

## FAQ

### Compilation Fails Due to Node.js Version Too High

Error message:

```
opensslErrorStack: ['error:03000086:digital envelope routines::initialization error']
library: 'digital envelope routines'
reason: 'unsupported'
code: 'ERR_OSSL_EVP_UNSUPPORTED'
```

Solution:

```Shell
export NODE_OPTIONS=--openssl-legacy-provider
```

Reference: <https://stackoverflow.com/questions/74726224/opensslerrorstack-error03000086digital-envelope-routinesinitialization-e>
