---
{
    "title": "在 MacOS 平台上编译",
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


本文介绍如何在 macOS 平台上编译源码。

## 环境要求

-   macOS 12 (Monterey) 及以上（***Intel 和 Apple Silicon 均支持***）

-   [Homebrew](https://brew.sh/)

## 源码编译

**1.  使用 [Homebrew](https://brew.sh/) 安装依赖**

```Shell
brew install automake autoconf libtool pkg-config texinfo coreutils gnu-getopt \
python@3 cmake ninja ccache bison byacc gettext wget pcre maven llvm@16 openjdk@11 npm
```

在 MacOS 上，由于 brew 没有提供 JDK8 的安装包，所以在这里使用了 JDK11。也可以自己手动下载安装 JDK8。

**2.  编译源码**

```Shell
bash build.sh
```

Doris 源码编译时首先会下载三方库源码进行编译，为了节省编译时间，可以下载社区提供的三方库的预编译版本。参见下面的使用**预编译三方库**提速构建过程。

## 启动

**1. 调大 file descriptors limit**

```Shell
# 通过 ulimit 命令调大 file descriptors limit 限制大小
ulimit -n 65536
# 查看是否生效
$ ulimit -n

# 将该配置写到到启动脚本中，以便下次打开终端会话时不需要再次设置
# 如果是 bash，执行下面语句
echo 'ulimit -n 65536' >>~/.bashrc
# 如果是 zsh，执行下面语句
echo 'ulimit -n 65536' >>~/.zshrc
```

**2.  启动 BE**

```Shell
cd output/be/bin
./start_be.sh --daemon
```

**3.  启动 FE**

```Shell
cd output/fe/bin
./start_fe.sh --daemon
```

## 使用预编译三方库进行提速

可以在 [Apache Doris Third Party Prebuilt](https://github.com/apache/doris-thirdparty/releases/tag/automation) 页面直接下载预编译好的第三方库，省去编译第三方库的过程，参考下面的命令。

```Bash
cd thirdparty
rm -rf installed

# Intel 芯片
curl -L https://github.com/apache/doris-thirdparty/releases/download/automation/doris-thirdparty-prebuilt-darwin-x86_64.tar.xz \
    -o - | tar -Jxf -

# Apple Silicon 芯片
curl -L https://github.com/apache/doris-thirdparty/releases/download/automation/doris-thirdparty-prebuilt-darwin-arm64.tar.xz \
    -o - | tar -Jxf -

# 保证 protoc 和 thrift 能够正常运行
cd installed/bin

./protoc --version
./thrift --version
```

## 常见错误

1. 运行`protoc`和`thrift`的时候可能会遇到**无法打开，因为无法验证开发者**的问题，可以到前往`安全性与隐私`。点按`通用`面板中的`仍要打开`按钮，以确认打算打开该二进制。参考 https://support.apple.com/zh-cn/HT202491。

2. 使用M3芯片的Mac编译时报编译proto文件失败
失败日志如下
```Shell
[ERROR] ... [0:0]: --grpc-java_out: protoc-gen-grpc-java: Plugin failed with status code 1.
```
此错误的原因可能是由于Apple基于arm的芯片不支持x86平台的软件导致。
可从https://repo.maven.apache.org/maven2/io/grpc/protoc-gen-grpc-java/下载编译用到的protoc-gen-grpc-java软件验证，版本信息可从fe/fe-core/pom.xml中protoc_rosetta profile下的grpc.java.artifact属性查看。
下载后执行如果报错如下错误则表示当前Mac不能执行基于x86编译的软件：
```Shell
zsh: bad CPU type in executable: ./protoc-gen-grpc-java-1.34.0-osx-x86_64.exe
```
可参考Apple官方文档https://support.apple.com/en-us/102527，安装Rosetta解决该问题。