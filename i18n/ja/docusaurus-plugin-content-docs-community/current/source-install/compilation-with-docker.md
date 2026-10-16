---
title: Docker イメージを使用した Apache Doris のコンパイル
language: ja
description: 公式 Docker イメージを使用して Apache Doris のソースコードをコンパイルします。thirdparty やツールチェーンを手動で設定する必要はありません。
keywords:
    - Docker によるコンパイル
    - Apache Doris
    - ソースコードのコンパイル
    - build-env
    - AVX2
    - JDK 8
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
"AS IS" BASIS, WITHOUT WARRANTIES OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: First-time compilation / Environment validation -->

このドキュメントでは、Apache Doris の公式ビルドイメージを使用して Doris のソースコードをコンパイルする方法を説明します。このイメージはコミュニティが管理し、依存関係の更新を速やかに反映するため、ツールチェーンやサードパーティ製ライブラリを手動でインストールする必要がありません。**最も推奨される**コンパイル方法です。

:::tip
Docker イメージを使用する方法は、ストレージとコンピュートを分離したモードでのコンパイルとデプロイにはまだ対応していません。
:::

## 対象読者、長所と短所

| 項目 | 説明 |
| ---- | ---- |
| 対象読者 | 依存関係を手動で設定せずに、ビルド環境をすばやく構築したい開発者 |
| 長所 | イメージに thirdparty、ツールチェーン、JDK があらかじめインストールされており、すぐに使用できる |
| 短所 | ローカルマシンで Docker が動作する必要があり、イメージのサイズが比較的大きい（約 3.3 GB） |

マシンで Docker を使用できない場合は、代わりに [LDB ツールチェーンを使用したコンパイル](./compilation-with-ldb-toolchain)を参照してください。

## 1. Docker をインストールする

CentOS では、パッケージマネージャーから直接インストールします。

```bash
yum install docker
```

その他のディストリビューションについては、[Docker の公式インストールガイド](https://docs.docker.com/engine/install/)を参照してください。

## 2. ビルドイメージを選択してダウンロードする

<!-- Knowledge type: Configuration parameters -->

Doris のバージョンごとに対応するビルドイメージが異なります。`apache/doris:build-env-ldb-toolchain-latest` は master ブランチのコードをコンパイルするためのイメージで、開発の進行に合わせて継続的に更新されます。

| イメージタグ | 対応する Doris のバージョン | 備考 |
| -------- | --------------- | ---- |
| `apache/doris:build-env-for-2.0` | 2.0.x | AVX2 命令セットに対応 |
| `apache/doris:build-env-for-2.0-no-avx2` | 2.0.x | AVX2 に対応していない CPU でも使用可能 |
| `apache/doris:build-env-for-2.1` | 2.1.x | AVX2 命令セットに対応 |
| `apache/doris:build-env-for-2.1-no-avx2` | 2.1.x | AVX2 に対応していない CPU でも使用可能 |
| `apache/doris:build-env-for-3.0` | 3.0.x | AVX2 命令セットに対応 |
| `apache/doris:build-env-for-3.0-no-avx2` | 3.0.x | AVX2 に対応していない CPU でも使用可能 |
| `apache/doris:build-env-for-3.1` | 3.1.x | AVX2 命令セットに対応 |
| `apache/doris:build-env-for-3.1-no-avx2` | 3.1.x | AVX2 に対応していない CPU でも使用可能 |
| `apache/doris:build-env-ldb-toolchain-latest` | master | 開発ブランチに追従 |
| `apache/doris:build-env-ldb-toolchain-no-avx2-latest` | master | AVX2 に対応していない CPU でも使用可能 |

Doris 2.0 のコンパイルを例に、イメージをダウンロードして確認します。

```bash
# You can also use docker.io/apache/doris:build-env-for-2.0
docker pull apache/doris:build-env-for-2.0

# Confirm that the image has been downloaded successfully
docker images
# REPOSITORY      TAG                  IMAGE ID        CREATED       SIZE
# apache/doris    build-env-for-2.0    f29cf1979dba    3 days ago    3.3GB
```

### イメージ選択時の注意事項

- イメージタグは Doris のバージョンと一対一で対応します。対象ブランチに合うイメージを選び、異なるバージョンの組み合わせでコンパイルしないでください。
- `no-avx2` イメージ内のサードパーティ製ライブラリは、AVX2 に対応していない CPU でも動作します。このイメージを使用する場合は、`USE_AVX2=0` オプションを指定してコンパイルする必要があります。
- イメージの変更履歴については、[thirdparty の CHANGELOG](https://github.com/apache/doris/blob/master/thirdparty/CHANGELOG.md)を参照してください。
- 最新の `apache/doris:build-env-ldb-toolchain-latest`（現時点では x86_64 アーキテクチャのみ対応）には、JDK 8 と JDK 17 の両方が含まれています。バージョン 2.1 以前には JDK 8 を、バージョン 3.0 以降または master ブランチには JDK 17 を使用してください。
- ARM64 アーキテクチャで Docker を使用してコンパイルする場合は、まず ARM64 に対応した Linux ベースイメージ（Ubuntu 22.04.5 LTS に対応する `apache/doris:base-latest` など）をダウンロードします。その後、[Linux での直接コンパイル](./compilation-linux)と [ARM プラットフォームでのコンパイル](./compilation-arm)を参照して、依存関係をインストールし、コンパイルしてください。

コンテナ内では、環境変数を使用して JDK を切り替えます。

```bash
# Switch to JDK 8
export JAVA_HOME=/usr/lib/jvm/java-1.8.0
export PATH=$JAVA_HOME/bin/:$PATH

# Switch to JDK 17
export JAVA_HOME=/usr/lib/jvm/jdk-17.0.2/
export PATH=$JAVA_HOME/bin/:$PATH
```

## 3. Doris をコンパイルする

<!-- Knowledge type: Procedure -->

### 3.1 Doris のソースコードをダウンロードする

ホストマシンで対象ブランチのコードを取得します（以下は branch-2.0 の例です）。

```bash
git clone -b branch-2.0 https://github.com/apache/doris.git
```

ソースディレクトリを `~/doris-branch-2.0` と仮定します。

### 3.2 ビルドコンテナを起動する

```bash
# Prepare the maven .m2 directory on the host in advance so that Java dependencies can be reused across multiple builds
mkdir ~/.m2

# Mount the source code and the .m2 directory, then start the build image
docker run -it --network=host \
    --name mydocker \
    -v ~/.m2:/root/.m2 \
    -v ~/doris-branch-2.0:/root/doris-branch-2.0/ \
    apache/doris:build-env-for-2.0

# After the command runs successfully, it enters the container automatically
```

主な `docker run` パラメーターの説明は次のとおりです。

| パラメーター | 用途 |
| ---- | ---- |
| `-v` | ホストのディレクトリをコンテナ内にマウントし、ソースコードと依存関係を保持する |
| `--name` | 後で管理しやすいようにコンテナ名を指定する |
| `--network` | コンテナのネットワークモードを設定する。`host` はホストとネットワークスタックを共有し、ポートのマッピングは不要 |

推奨事項：

- ビルド成果物がホストに残り、コンテナの終了時に失われないよう、Doris のソースディレクトリを必ずマウントしてください。
- コンテナを起動するたびに Maven の依存関係を再ダウンロードしなくて済むよう、`.m2` ディレクトリをマウントしてください。
- コンテナ内でサードパーティ製ライブラリをダウンロードするには、インターネット接続が必要です。`--network=host` モードを推奨します。

### 3.3 ビルドを実行する

コンテナ内のソースディレクトリに移動した後、以下を実行します。

```bash
# By default, compile artifacts that support AVX2
sh build.sh

# When the CPU does not support AVX2, append USE_AVX2=0
USE_AVX2=0 sh build.sh

# Compile the Debug version of BE
BUILD_TYPE=Debug sh build.sh
```

ビルドが完了すると、成果物はソースディレクトリ内の `output/` に配置されます。

:::tip
**マシンが AVX2 命令セットに対応しているか確認するには？**

```bash
cat /proc/cpuinfo | grep avx2
```

出力が空でなければ、AVX2 に対応しています。
:::

## 4. 独自の開発用イメージをビルドする

ベースイメージをカスタマイズする場合（別のベースディストリビューションへの変更やデバッグツールの追加など）は、ソースコード内の `docker/README.md` を参照してください。

## FAQ

### Q1: イメージのバージョンと Doris のバージョンが一致しない場合はどうなりますか？

イメージ内の thirdparty ライブラリとツールチェーンは、Doris のソースコードと密接に結び付いています。バージョンが異なる組み合わせでは、コンパイル中に `undefined reference` や `incompatible library` などのリンカーエラーが発生する可能性が非常に高くなります。必ず表に従って選択してください。

### Q2: ビルド時に `AVX2 not supported` と表示される場合は？

ホストまたは実行先のマシンの CPU が AVX2 命令セットに対応していません。`no-avx2` サフィックスが付いたイメージに切り替え、ビルド時に `USE_AVX2=0` を設定してください。

### Q3: `docker pull` でのイメージ取得が遅すぎる場合は？

Docker のイメージミラーアクセラレーターを設定するか、完全なパス `docker.io/apache/doris:...` を使用してください。

### Q4: コンテナ内で Java ライブラリのダウンロードに失敗する場合は？

プロキシやネットワークの分離によって Maven Central リポジトリに接続できなくならないよう、コンテナが `--network=host` で起動されていることと、`~/.m2` ディレクトリがコンテナ内にマウントされていることを確認してください。

## 関連ドキュメント

- [LDB ツールチェーンを使用したコンパイル](./compilation-with-ldb-toolchain)
- [Linux での直接コンパイル](./compilation-linux)
- [ARM プラットフォームでのコンパイル](./compilation-arm)
