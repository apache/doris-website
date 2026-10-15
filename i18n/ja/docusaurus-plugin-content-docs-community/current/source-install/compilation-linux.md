---
title: Linux で Apache Doris を直接コンパイルする
language: ja
description: "Linux で Apache Doris を直接コンパイルする方法：JDK、依存関係、AVX2 命令セットの確認、ビルドコマンド。"
keywords:
    - Linux でのコンパイル
    - Apache Doris
    - ソースからのコンパイル
    - Ubuntu
    - JDK 17
    - AVX2
    - build.sh
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
<!-- Applicable scenario: First-time compilation / compiling directly on a physical machine -->

このドキュメントでは、Docker イメージや LDB Toolchain を使わずに、Linux 上で Apache Doris を直接コンパイルする方法を説明します。Ubuntu 24.04 以降を例に使用します。

## 対象読者とメリット・デメリット

| 項目 | 説明 |
| ---- | ---- |
| 対象読者 | Ubuntu 24.04 以降などの新しいディストリビューションで、システムに付属する GCC を使いたい開発者 |
| メリット | 手順が最も少なく、システムのパッケージマネージャーから依存関係を直接インストールできる |
| デメリット | 古いディストリビューションでは、GCC や glibc のバージョンが古すぎてコンパイルに失敗する場合がある。その場合は、代わりに [LDB Toolchain](./compilation-with-ldb-toolchain) を使用する |

## 環境要件

<!-- Knowledge type: Hardware requirements -->

| コンポーネント | 必要なバージョン |
| ---- | -------- |
| オペレーティングシステム | Ubuntu 24.04 以降（または他のディストリビューションの同等のバージョン） |
| JDK | 8 以降（バージョン 2.1 以前）、17（バージョン 3.0 以降、または master ブランチ） |
| GCC | 10 以降 |
| Python | 2.7 以降 |
| Apache Maven | 3.5 以降 |
| CMake | 3.19.2 以降 |
| Bison | 3.0 以降 |

## 1. JDK をインストールする

<!-- Knowledge type: Procedure -->

コンパイル対象の Doris のバージョンに応じて、JDK を選択します。

```bash
# To compile Doris 2.1 or earlier, install JDK 8
sudo apt install openjdk-8-jdk

# To compile Doris 3.0 or later, or the master branch, install JDK 17
sudo apt install openjdk-17-jdk
```

## 2. システムの依存関係をインストールする

```bash
sudo apt install build-essential maven cmake byacc flex automake libtool-bin bison binutils-dev libiberty-dev zip unzip libncurses5-dev curl git ninja-build python
sudo add-apt-repository ppa:ubuntu-toolchain-r/ppa
sudo apt update
sudo apt install gcc-10 g++-10
sudo apt-get install autoconf automake libtool autopoint
```

## 3. CPU が AVX2 に対応しているか確認する

```bash
cat /proc/cpuinfo | grep avx2
```

出力が空でなければ、CPU は AVX2 に対応しており、デフォルトのコンパイルオプションを使用できます。出力が空の場合は、ビルドコマンドに `USE_AVX2=0` を付けます。

## 4. ビルドを実行する

```bash
# Default build, producing AVX2-enabled artifacts
sh build.sh

# When the CPU does not support AVX2, append USE_AVX2=0
USE_AVX2=0 sh build.sh

# Build a Debug version of BE
BUILD_TYPE=Debug sh build.sh
```

## 5. ビルド成果物の場所を確認する

ビルドが完了すると、成果物はソースルートディレクトリの `output/` 以下に配置されます。

## よくある質問

### Q1: 古いバージョンの Ubuntu や CentOS でも直接コンパイルできますか？

古いディストリビューションに付属する GCC や glibc は、通常、バージョンが古すぎます。代わりに [LDB Toolchain](./compilation-with-ldb-toolchain) または [Docker イメージ](./compilation-with-docker) を使用してください。

### Q2: ビルド時に `AVX2 not supported` と表示されます。

CPU が AVX2 命令セットに対応していません。`USE_AVX2=0 sh build.sh` で再実行し、ビルド済みサードパーティライブラリの `no-avx2` 系列をダウンロードしてください。

### Q3: ビルド時に `Too many open files` と表示されます。

`ulimit -n 65536` でプロセスごとのファイルディスクリプター数の上限を引き上げるか、`/etc/security/limits.conf` で永続的に設定してください。

### Q4: メモリ不足でビルドの途中にプロセスが強制終了されます。

`ninja failed with: signal: killed` というメッセージは、通常、メモリ不足（OOM）を示します。メモリが 16 GB 以上のマシンを使用するか、並列度（`-j` パラメーター）を下げてください。

## 関連ドキュメント

- [LDB Toolchain を使ってコンパイルする](./compilation-with-ldb-toolchain)
- [Docker イメージを使ってコンパイルする](./compilation-with-docker)
- [ARM でコンパイルする](./compilation-arm)
