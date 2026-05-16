---
title: macOS 平台编译 Apache Doris
language: zh-CN
description: 在 macOS（Intel / Apple Silicon）平台编译 Apache Doris 与本地调试准备。
keywords:
    - macOS 编译
    - Apple Silicon
    - Intel Mac
    - Apache Doris
    - 源码编译
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

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 本地开发 / macOS 调试 -->

# 在 macOS 平台上编译

本文介绍如何在 macOS（Intel 与 Apple Silicon）平台上完成 Apache Doris 的依赖安装、源码编译、运行与本地调试准备。

:::tip
目前还不支持在 macOS 上进行存算分离模式的编译部署。
:::

## 1. 环境要求

- macOS 12 (Monterey) 及以上（Intel 与 Apple Silicon 均支持）
- [Homebrew](https://brew.sh/)
- JDK 8 或 JDK 17（Doris 目前仅支持这两个版本）

## 2. 安装依赖

使用 Homebrew 安装基础依赖：

```Shell
brew install automake autoconf libtool pkg-config texinfo coreutils gnu-getopt \
python@3 cmake ninja ccache bison byacc gettext wget pcre maven llvm@20 openjdk@17 npm
```

> macOS 上 arm64 版本的 brew 默认没有 JDK 8，因此推荐使用 `openjdk@17`。如需 JDK 8，可手动安装 [Zulu JDK 8](https://www.azul.com/downloads/?version=java-8-lts&os=macos&package=jdk#zulu)；Maven 也可从 [Maven 官网](https://maven.apache.org/download.cgi) 单独下载并配置环境变量。

部分依赖在 Apple Silicon 上还需要手动配置环境变量：

```Shell
export PATH="/opt/homebrew/opt/llvm/bin:$PATH"
export PATH="/opt/homebrew/opt/bison/bin:$PATH"
export PATH="/opt/homebrew/opt/texinfo/bin:$PATH"
ln -s -f /opt/homebrew/bin/python3 /opt/homebrew/bin/python
```

## 3. 拉取源码并设置 DORIS_HOME

```Shell
cd ~
mkdir DorisDev && cd DorisDev
git clone https://github.com/apache/doris.git

export DORIS_HOME=~/DorisDev/doris
export PATH=$DORIS_HOME/bin:$PATH
```

## 4. （可选）单独安装 Thrift

只在仅调试 FE 时才需要单独安装 Thrift；同时调试 BE 和 FE 时，BE 的三方库已包含 Thrift。

```Shell
brew install thrift@0.16.0

mkdir -p ./thirdparty/installed/bin

# Apple Silicon
ln -s /opt/homebrew/Cellar/thrift@0.16.0/0.16.0/bin/thrift ./thirdparty/installed/bin/thrift

# Intel
ln -s /usr/local/Cellar/thrift@0.16.0/0.16.0/bin/thrift ./thirdparty/installed/bin/thrift
```

如果 `brew install thrift@0.16.0` 报找不到版本的错误，按以下方式处理：

```Shell
brew tap homebrew/core --force
brew tap-new $USER/local-tap
brew extract --version='0.16.0' thrift $USER/local-tap
brew install thrift@0.16.0
```

参考：<https://gist.github.com/tonydeng/02e571f273d6cce4230dc8d5f394493c>

## 5. 使用预编译三方库加速（推荐）

可以直接下载社区提供的预编译三方库，省去编译第三方库的过程：

```Shell
cd thirdparty
rm -rf installed

# Intel 芯片
curl -L https://github.com/apache/doris-thirdparty/releases/download/automation/doris-thirdparty-prebuilt-darwin-x86_64.tar.xz \
    -o - | tar -Jxf -

# Apple Silicon 芯片
curl -L https://github.com/apache/doris-thirdparty/releases/download/automation/doris-thirdparty-prebuilt-darwin-arm64.tar.xz \
    -o - | tar -Jxf -

# 验证 protoc 与 thrift 可正常运行
cd installed/bin
./protoc --version
./thrift --version
```

> 运行 `protoc` 和 `thrift` 时如果遇到 **无法打开，因为无法验证开发者** 的提示，前往 `安全性与隐私 → 通用`，点击 `仍要打开` 即可。参考：<https://support.apple.com/zh-cn/HT202491>

也可以从 [Apache Doris Third Party Prebuilt](https://github.com/apache/doris-thirdparty/releases/tag/automation) 页面下载三方库源码 [doris-thirdparty-source.tgz](https://github.com/apache/doris-thirdparty/releases/download/automation/doris-thirdparty-source.tgz) 自行编译。

## 6. 调整文件句柄数限制

```Shell
ulimit -n 65536

# 写入启动脚本，下次打开终端自动生效
# bash
echo 'ulimit -n 65536' >>~/.bashrc
# zsh
echo 'ulimit -n 65536' >>~/.zshrc
```

## 7. 编译

```Shell
cd $DORIS_HOME
bash build.sh
```

## 8. 启动 BE / FE

```Shell
cd output/be/bin && ./start_be.sh --daemon
cd output/fe/bin && ./start_fe.sh --daemon
```

## 9. 配置本地调试环境

```Shell
# 将编译产物 copy 出来作为运行目录
cp -r output ../doris-run
```

之后修改 FE / BE 的 `conf` 中：

1. IP 与目录配置
2. BE 中额外配置 `min_file_descriptor_number = 10000`

接下来按 IDE 配置调试：

- [FE 开发环境搭建 - IntelliJ IDEA](../developer-guide/fe-idea-dev)
- [BE 开发环境搭建 - CLion](../developer-guide/be-clion-dev)（参见「方式二：macOS 本地开发」）

## 常见问题

### Node.js 版本过高导致编译失败

错误信息：

```
opensslErrorStack: ['error:03000086:digital envelope routines::initialization error']
library: 'digital envelope routines'
reason: 'unsupported'
code: 'ERR_OSSL_EVP_UNSUPPORTED'
```

解决方法：

```Shell
export NODE_OPTIONS=--openssl-legacy-provider
```

参考：<https://stackoverflow.com/questions/74726224/opensslerrorstack-error03000086digital-envelope-routinesinitialization-e>
