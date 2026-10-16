---
title: LDB Toolchain を使用した Apache Doris のコンパイル
language: ja
description: LDB Toolchain を使用して Linux 上で Apache Doris をコンパイルする方法。ツールチェーンのインストール手順とビルド手順を詳しく説明します。
keywords:
    - LDB Toolchain
    - Apache Doris
    - ソースからのコンパイル
    - Linux でのコンパイル
    - ビルド済みサードパーティライブラリ
    - AVX2
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
<!-- Use case: First-time compilation / No Docker environment -->

このドキュメントでは、LDB Toolchain を使用して Linux 上で Apache Doris をコンパイルする方法を説明します。この方法は [Docker イメージを使用したコンパイル](./compilation-with-docker) を補完するもので、Docker 環境がない開発者に適しています。

:::tip
LDB Toolchain は **Linux Distribution Based Toolchain Generator** の略です。ほぼすべての Linux ディストリビューションで最新の C++ プロジェクトをビルドできる、独立した移植可能な最新の C++ コンパイルツールチェーンを提供します。
:::

貢献してくださった [Amos Bird](https://github.com/amosbird) に感謝します。

## バージョンの対応関係

<!-- Knowledge type: Configuration parameters -->

| Doris のバージョン | 推奨 LDB Toolchain バージョン | 含まれるコンパイラ |
| ---------- | ----------------------- | ---------- |
| master | 0.25 | clang-20, gcc-15 |
| 3.1 / 3.0 / 2.1 | 0.19 | clang-17, gcc-13 |

## 対象読者とメリット・デメリット

| 項目 | 説明 |
| ---- | ---- |
| 対象読者 | Docker 環境がなく、物理マシンまたは仮想マシン上で直接コンパイルしたい開発者 |
| メリット | Docker に依存せず、ツールチェーンが独立しているため、システムのコンパイラ環境を汚染しない |
| デメリット | Java、Maven、Node、およびシステムレベルの依存関係を手動でインストールする必要がある |

## 1. コンパイル環境を準備する

<!-- Knowledge type: Procedure -->
<!-- Use case: First-time compilation -->

ほとんどの Linux ディストリビューション（CentOS、Ubuntu など）に適用できます。

### 1.1 `ldb_toolchain_gen.sh` をダウンロードする

[ldb_toolchain_gen のリリース](https://github.com/amosbird/ldb_toolchain_gen/releases) から、アーキテクチャに合ったバージョンをダウンロードします。

- x86_64 アーキテクチャ: `ldb_toolchain_gen.sh` をダウンロードします。
- ARM アーキテクチャ: `ldb_toolchain_gen.aarch64.sh` をダウンロードします。

:::tip
プロジェクトのホームページ: <https://github.com/amosbird/ldb_toolchain_gen>
:::

### 1.2 LDB Toolchain を生成する

スクリプトを実行してツールチェーンを生成します。

```bash
bash ldb_toolchain_gen.sh /path/to/ldb_toolchain/
```

ここで、`/path/to/ldb_toolchain/` はインストール先のディレクトリです。スクリプトが正常に完了すると、このディレクトリに次の構造が生成されます。

```text
├── bin
├── include
├── lib
├── share
├── test
└── usr
```

### 1.3 その他のコンパイル用コンポーネントをインストールする

| コンポーネント | 推奨バージョン | ダウンロード URL |
| ---- | -------- | -------- |
| JDK 8 | 1.8.0_391 | [jdk-8u391-linux-x64.tar.gz](https://doris-thirdparty-1308700295.cos.ap-beijing.myqcloud.com/tools/jdk-8u391-linux-x64.tar.gz) |
| JDK 17 | 17.0.10 | [jdk-17.0.10_linux-x64](https://download.oracle.com/java/17/archive/jdk-17.0.10_linux-x64_bin.tar.gz) |
| Maven | 3.9.9 | [apache-maven-3.9.9-bin.tar.gz](https://archive.apache.org/dist/maven/maven-3/3.9.9/binaries/apache-maven-3.9.9-bin.tar.gz) |
| Node | v12.13.0 | [node-v12.13.0-linux-x64.tar.gz](https://doris-thirdparty-repo.bj.bcebos.com/thirdparty/node-v12.13.0-linux-x64.tar.gz) |

JDK バージョンの選択基準:

- Doris 2.1 以前: JDK 8 を使用します。
- Doris 3.0 以降、または master ブランチ: JDK 17 を使用します。
- Linux ディストリビューションのパッケージマネージャー（`yum`、`apt` など）を使用して、OpenJDK 8 または 17 を直接インストールすることもできます。

Linux ディストリビューションによって提供されるシステムコンポーネントが異なるため、追加のツールが必要になる場合があります。CentOS 6 の例を示します。

```bash
# Install system dependencies
sudo yum install -y byacc patch automake libtool make which file ncurses-devel gettext-devel unzip bzip2 zip util-linux wget git python2

# Install autoconf-2.69
wget http://ftp.gnu.org/gnu/autoconf/autoconf-2.69.tar.gz && \
    tar zxf autoconf-2.69.tar.gz && \
    cd autoconf-2.69 && \
    ./configure && \
    make && \
    make install

# Install bison-3.8.2
wget http://ftp.gnu.org/gnu/bison/bison-3.8.2.tar.gz && \
    tar xzf bison-3.8.2.tar.gz && \
    cd bison-3.8.2 && \
    ./configure && \
    make && \
    make install
```

### 1.4 Doris のソースコードをダウンロードして環境変数を設定する

```bash
git clone https://github.com/apache/doris.git
```

ソースディレクトリに移動し、次の環境変数を設定した `custom_env.sh` を作成します。

```bash
export JAVA_HOME=/path/to/java/
export PATH=$JAVA_HOME/bin:$PATH
export PATH=/path/to/maven/bin:$PATH
export PATH=/path/to/node/bin:$PATH
export PATH=/path/to/ldb_toolchain/bin:$PATH
```

## 2. Doris をコンパイルする

<!-- Knowledge type: Procedure -->

:::tip
デフォルトでは、`build.sh` は最初にサードパーティライブラリをコンパイルします。サードパーティライブラリのコンパイルを省略する方法については、[3. ビルド済みサードパーティライブラリを使用して時間を短縮する](#3-speed-up-with-precompiled-third-party-libraries) を参照してください。
:::

### 2.1 AVX2 に対応しているか確認する

```bash
cat /proc/cpuinfo | grep avx2
```

出力が空でなければ、CPU は AVX2 に対応しています。

### 2.2 コンパイルを実行する

```bash
# By default, build artifacts that support AVX2
sh build.sh

# When the CPU does not support AVX2, append USE_AVX2=0
USE_AVX2=0 sh build.sh

# Compile the Debug version of BE
BUILD_TYPE=Debug sh build.sh
```

このスクリプトは、サードパーティライブラリ、FE、BE、MS の順にコンパイルし、成果物を `output/` ディレクトリに書き込みます。MS モジュールはストレージとコンピューティングを分離するモードで使用されます。詳しくは関連ドキュメントを参照してください。

## 3. ビルド済みサードパーティライブラリを使用して時間を短縮する {#3-speed-up-with-precompiled-third-party-libraries}

<!-- Use case: Speed up compilation / Restricted network -->

デフォルトでは、`build.sh` はサードパーティライブラリをソースからコンパイルするため、時間がかかります。コミュニティが提供するビルド済みのバージョンを直接ダウンロードすることもできます。

```text
https://github.com/apache/doris-thirdparty/releases
```

コミュニティは、Linux、macOS、ARM 向けのビルド済み成果物を提供しています。パッケージをダウンロードして展開すると、`installed/` ディレクトリが作成されます。これを Doris ソースの `thirdparty/` ディレクトリにコピーしてから `build.sh` を実行すると、サードパーティライブラリのコンパイルを省略できます。

## よくある質問

### Q1: LDB Toolchain のバージョンはどのように選べばよいですか？

表に従い、master ブランチには 0.25、3.1、3.0、2.1 ブランチには 0.19 を使用してください。バージョンが一致しないと、ABI の不整合やリンクエラーが発生する可能性があります。

### Q2: `cat /proc/cpuinfo | grep avx2` で何も出力されない場合はどうすればよいですか？

CPU は AVX2 に対応していません。コンパイル時に `USE_AVX2=0` を指定し、ビルド済みのサードパーティライブラリまたはコンパイル用イメージには `-no-avx2` 版を使用してください。

### Q3: コンパイル中に `Too many open files` が発生した場合はどうすればよいですか？

`ulimit -n 65536` で開けるファイルの上限を引き上げるか、永続化する場合は `/etc/security/limits.conf` に設定を記述してください。

### Q4: ARM でコンパイルするときの注意点は何ですか？

`ldb_toolchain_gen.aarch64.sh` をダウンロードしてください。AVX2、libunwind、Azure、およびその他の互換性のないサードパーティライブラリを無効にする方法については、[ARM プラットフォームでのコンパイル](./compilation-arm) を参照してください。

## 関連ドキュメント

- [Docker イメージを使用したコンパイル](./compilation-with-docker)
- [Linux 上での直接コンパイル](./compilation-linux)
- [ARM プラットフォームでのコンパイル](./compilation-arm)
