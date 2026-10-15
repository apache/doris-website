---
title: macOS で Apache Doris をコンパイルする
language: ja
description: macOS（Intel / Apple Silicon）で Apache Doris をコンパイルし、ローカルデバッグの準備をします。
keywords:
    - macOS でのコンパイル
    - Apple Silicon
    - Intel Mac
    - Apache Doris
    - ソースコードからのコンパイル
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

# macOS でのコンパイル

このドキュメントでは、macOS（Intel と Apple Silicon）で Apache Doris の依存関係をインストールし、ソースコードからコンパイルして起動し、ローカルデバッグの準備をする方法を説明します。

:::tip
macOS では、コンピュートとストレージを分離したモードのコンパイルとデプロイはまだサポートされていません。
:::

## 1. 環境要件

- macOS 12（Monterey）以降（Intel と Apple Silicon の両方をサポート）
- [Homebrew](https://brew.sh/)
- JDK 8 または JDK 17（Doris が現在サポートしているのはこの両バージョンのみ）

## 2. 依存関係のインストール

Homebrew で基本的な依存関係をインストールします。

```Shell
brew install automake autoconf libtool pkg-config texinfo coreutils gnu-getopt \
python@3 cmake ninja ccache bison byacc gettext wget pcre maven llvm@22 llvm@20 openjdk@17 npm
```

> LLVM は両方のバージョンが必要です。`llvm@22` は BE のコンパイルに使用します（LLVM 22.1.8 は、macOS 26.4 以降で AddressSanitizer ランタイムが起動する最初のリリースです）。`llvm@20` は、サードパーティライブラリをソースコードからビルドするときに使用します。これがない場合、`thirdparty/build-thirdparty.sh` は停止します。また、`build.sh` は、`thirdparty/installed` に必要なライブラリがない場合、サードパーティライブラリのビルドを自動的に開始します。ビルドスクリプトは Homebrew を通じて両方のバージョンを見つけるため、どちらも `PATH` に追加する必要はありません。

> macOS の arm64 版 Homebrew にはデフォルトで JDK 8 が含まれていないため、`openjdk@17` を推奨します。JDK 8 が必要な場合は、[Zulu JDK 8](https://www.azul.com/downloads/?version=java-8-lts&os=macos&package=jdk#zulu) を手動でインストールしてください。Maven は [Maven の Web サイト](https://maven.apache.org/download.cgi) から別途ダウンロードし、環境変数で設定することもできます。

Apple Silicon では、一部の依存関係について環境変数を手動で設定する必要もあります。

```Shell
export PATH="/opt/homebrew/opt/bison/bin:$PATH"
export PATH="/opt/homebrew/opt/texinfo/bin:$PATH"
ln -s -f /opt/homebrew/bin/python3 /opt/homebrew/bin/python
```

## 3. ソースコードの取得と DORIS_HOME の設定

```Shell
cd ~
mkdir DorisDev && cd DorisDev
git clone https://github.com/apache/doris.git

export DORIS_HOME=~/DorisDev/doris
export PATH=$DORIS_HOME/bin:$PATH
```

## 4. （任意）Thrift の個別インストール

Thrift を個別にインストールする必要があるのは、FE だけをデバッグする場合です。BE と FE の両方をデバッグする場合、BE のサードパーティライブラリに Thrift がすでに含まれています。

```Shell
brew install thrift@0.16.0

mkdir -p ./thirdparty/installed/bin

# Apple Silicon
ln -s /opt/homebrew/Cellar/thrift@0.16.0/0.16.0/bin/thrift ./thirdparty/installed/bin/thrift

# Intel
ln -s /usr/local/Cellar/thrift@0.16.0/0.16.0/bin/thrift ./thirdparty/installed/bin/thrift
```

`brew install thrift@0.16.0` で該当バージョンが見つからないと報告された場合は、次のように対処します。

```Shell
brew tap homebrew/core --force
brew tap-new $USER/local-tap
brew extract --version='0.16.0' thrift $USER/local-tap
brew install thrift@0.16.0
```

参考：<https://gist.github.com/tonydeng/02e571f273d6cce4230dc8d5f394493c>

## 5. ビルド済みサードパーティライブラリによるビルドの高速化（推奨）

コミュニティが提供するビルド済みサードパーティライブラリを直接ダウンロードすると、サードパーティライブラリのコンパイルを省略できます。

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

> `protoc` と `thrift` の実行時に **開発元を確認できないため開けません** というメッセージが表示された場合は、`Security & Privacy → General`（「セキュリティとプライバシー → 一般」）に移動して `Open Anyway`（「このまま開く」）をクリックしてください。参考：<https://support.apple.com/zh-cn/HT202491>

サードパーティライブラリのソースコード [doris-thirdparty-source.tgz](https://github.com/apache/doris-thirdparty/releases/download/automation/doris-thirdparty-source.tgz) を [Apache Doris Third Party Prebuilt](https://github.com/apache/doris-thirdparty/releases/tag/automation) のページからダウンロードし、自分でコンパイルすることもできます。

## 6. ファイル記述子の上限を調整する

```Shell
ulimit -n 65536

# Write to the startup script so it takes effect automatically next time the terminal opens
# bash
echo 'ulimit -n 65536' >>~/.bashrc
# zsh
echo 'ulimit -n 65536' >>~/.zshrc
```

## 7. コンパイル

```Shell
cd $DORIS_HOME
bash build.sh
```

## 8. BE / FE の起動

```Shell
cd output/be/bin && ./start_be.sh --daemon
cd output/fe/bin && ./start_fe.sh --daemon
```

## 9. ローカルデバッグ環境の設定

```Shell
# Copy the build output to use as the runtime directory
cp -r output ../doris-run
```

次に、FE / BE の `conf` で以下の設定を変更します。

1. IP とディレクトリの設定
2. BE ではさらに `min_file_descriptor_number = 10000` を設定

続いて、IDE でデバッグを設定します。

- [FE 開発環境のセットアップ - IntelliJ IDEA](../developer-guide/fe-idea-dev)
- [BE 開発環境のセットアップ - CLion](../developer-guide/be-clion-dev)（「オプション 2：macOS でのローカル開発」を参照）

## FAQ

### CMake が OpenMP を見つけられない場合

BE のコンパイル時に CMake が OpenMP を見つけられず、次のエラーが報告される場合があります。

```text
Could NOT find OpenMP_C (missing: OpenMP_C_FLAGS OpenMP_C_LIB_NAMES)
fatal error: 'omp.h' file not found
```

`libomp` をインストールし、Homebrew でインストールしたディレクトリに `omp.h` があることを確認します。

```Shell
brew install libomp
LIBOMP_PREFIX="$(brew --prefix libomp)"
test -f "${LIBOMP_PREFIX}/include/omp.h"
```

Doris のソースルートにある `custom_env.sh` に、次の環境変数を追加します。

```Shell
LIBOMP_PREFIX="$(brew --prefix libomp)"
export CPPFLAGS="-I${LIBOMP_PREFIX}/include ${CPPFLAGS:-}"
export CFLAGS="-I${LIBOMP_PREFIX}/include ${CFLAGS:-}"
export CXXFLAGS="-I${LIBOMP_PREFIX}/include ${CXXFLAGS:-}"
export LDFLAGS="-L${LIBOMP_PREFIX}/lib ${LDFLAGS:-}"
export EXTRA_CXX_FLAGS="-I${LIBOMP_PREFIX}/include ${EXTRA_CXX_FLAGS:-}"
```

`be/CMakeLists.txt` は `CMAKE_C_FLAGS` と `CMAKE_CXX_FLAGS` をリセットするため、CMake の OpenMP チェックには `CPPFLAGS`、`CFLAGS`、`CXXFLAGS` が渡らない場合があります。`EXTRA_CXX_FLAGS` は `libomp` のインクルードパスを BE のビルドに渡すため、この回避策に必要です。

`custom_env.sh` はローカルのビルド設定ファイルです。リポジトリにコミットしないでください。

### Node.js のバージョンが高すぎてコンパイルに失敗する場合

エラーメッセージ：

```
opensslErrorStack: ['error:03000086:digital envelope routines::initialization error']
library: 'digital envelope routines'
reason: 'unsupported'
code: 'ERR_OSSL_EVP_UNSUPPORTED'
```

解決方法：

```Shell
export NODE_OPTIONS=--openssl-legacy-provider
```

参考：<https://stackoverflow.com/questions/74726224/opensslerrorstack-error03000086digital-envelope-routinesinitialization-e>
