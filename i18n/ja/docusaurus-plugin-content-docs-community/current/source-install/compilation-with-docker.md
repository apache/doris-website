---
title: Docker イメージを使用した Apache Doris のコンパイル
language: ja
description: 公式 Docker イメージを使用して Apache Doris のソースコードをコンパイルします。thirdparty や toolchain を手動で設定する必要はありません。
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

このドキュメントでは、Apache Doris の公式ビルドイメージを使用して Doris のソースコードをコンパイルする方法を説明します。このイメージはコミュニティが保守し、依存ライブラリの更新に合わせて速やかに更新しているため、toolchain やサードパーティーライブラリを手動でインストールする必要がありません。**最も推奨される**コンパイル方法です。

:::tip
Docker イメージを使用する方法は、ストレージとコンピュートを分離したモードでのコンパイルとデプロイにはまだ対応していません。
:::

## 対象者とメリット・デメリット {#target-audience-pros-and-cons}

| 項目 | 説明 |
| ---- | ---- |
| 対象者 | 依存関係を手動で設定せずに、ビルド環境をすばやく構築したい開発者 |
| メリット | thirdparty、toolchain、JDK がイメージにプリインストールされており、すぐに使用できる |
| デメリット | ローカルマシンで Docker が動作する必要がある。イメージのサイズが比較的大きい（約 3.3 GB） |

マシンで Docker を使用できない場合は、代わりに [LDB Toolchain を使用したコンパイル](./compilation-with-ldb-toolchain)を行ってください。

## 1. Docker のインストール {#1-install-docker}

CentOS では、パッケージマネージャーから直接インストールできます。

```bash
yum install docker
```

その他のディストリビューションについては、[Docker の公式インストールガイド](https://docs.docker.com/engine/install/)を参照してください。

## 2. ビルドイメージの選択とダウンロード {#2-choose-and-download-the-build-image}

<!-- Knowledge type: Configuration parameters -->

Doris のバージョンごとに、対応するビルドイメージが異なります。`apache/doris:build-env-ldb-toolchain-latest` は master ブランチのコードをコンパイルするためのイメージで、開発の進行に合わせて継続的に更新されます。

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
| `apache/doris:build-env-ldb-toolchain-latest` | master | 開発ブランチの更新に追随 |
| `apache/doris:build-env-ldb-toolchain-no-avx2-latest` | master | AVX2 に対応していない CPU でも使用可能 |

以下のコマンドはホスト上で実行します。この例では `master` をビルドします。リリースブランチをビルドする場合は、上の表に従ってブランチとイメージの両方を変更してください。これらの変数を引き続き使用できるよう、以降のホスト上のコマンドは同じシェルで実行してください。ARM64 と JDK の選択については、[イメージ選択時の注意事項](#notes-on-image-selection)を参照してください。

```bash
DORIS_BRANCH=master
DORIS_BUILD_IMAGE=apache/doris:build-env-ldb-toolchain-latest
DORIS_SOURCE_DIR="$PWD/doris"

docker pull "$DORIS_BUILD_IMAGE"
```

## 3. Doris のコンパイル {#3-compile-doris}

<!-- Knowledge type: Procedure -->

### 3.1 Doris のソースコードのダウンロード {#31-download-the-doris-source-code}

ホスト上で、選択したブランチを上で設定したディレクトリにクローンします。

```bash
git clone --branch "$DORIS_BRANCH" https://github.com/apache/doris.git "$DORIS_SOURCE_DIR"
```

### 3.2 ビルドコンテナの起動 {#32-start-the-build-container}

```bash
mkdir -p "$HOME/.m2"

docker run -it --network=host \
    --name doris-build \
    -v "$HOME/.m2:/root/.m2" \
    -v "$DORIS_SOURCE_DIR:/root/doris" \
    --workdir /root/doris \
    "$DORIS_BUILD_IMAGE"
```

このコマンドを実行すると、マウントしたソースディレクトリ `/root/doris` を作業ディレクトリとして、コンテナ内で Bash が開きます。

`docker run` の主なパラメーターは次のとおりです。

| パラメーター | 用途 |
| ---- | ---- |
| `-v` | ホストのディレクトリをコンテナにマウントし、ソースコードや依存ライブラリを永続化する |
| `--name` | 後で管理しやすいようにコンテナ名を指定する |
| `--workdir` | マウントしたソースディレクトリでシェルを起動する |
| `--network` | コンテナのネットワークモードを設定する。`host` はホストとネットワークスタックを共有するため、ポートマッピングは不要 |

推奨事項：

- ビルド成果物をホスト上に残し、コンテナ終了時に失われないように、Doris のソースディレクトリは必ずマウントしてください。
- コンテナを起動するたびに Maven の依存ライブラリをダウンロードし直さなくて済むよう、`.m2` ディレクトリをマウントしてください。
- コンテナ内でサードパーティーライブラリをダウンロードするには、インターネットへのアクセスが必要です。`--network=host` モードを推奨します。

### 3.3 ビルドの実行 {#33-run-the-build}

コンテナ内でデフォルトのビルドを実行します。

```bash
bash build.sh
```

ビルドが完了すると、成果物はソースディレクトリ内の `output/` に生成されます。

:::tip
**マシンが AVX2 命令セットに対応しているか確認する方法**

```bash
cat /proc/cpuinfo | grep avx2
```

出力が空でなければ、AVX2 に対応しています。
:::

### その他のビルドオプション {#other-build-options}

必要に応じて、デフォルトのビルドコマンドの代わりに次のいずれかを実行してください。

```bash
# For CPUs without AVX2
USE_AVX2=0 bash build.sh

# Build the Debug version of BE
BUILD_TYPE=Debug bash build.sh
```

### イメージ選択時の注意事項 {#notes-on-image-selection}

- イメージタグと Doris のバージョンは一対一で対応しています。対象ブランチに合うイメージを選び、異なるバージョンの組み合わせでコンパイルしないでください。
- `no-avx2` イメージに含まれるサードパーティーライブラリは、AVX2 に対応していない CPU でも動作します。このイメージを使用する場合は、`USE_AVX2=0` オプションを指定してコンパイルする必要があります。
- イメージの変更履歴については、[thirdparty CHANGELOG](https://github.com/apache/doris/blob/master/thirdparty/CHANGELOG.md)を参照してください。
- 最新の `apache/doris:build-env-ldb-toolchain-latest`（現在は x86_64 アーキテクチャのみに対応）には、JDK 8 と JDK 17 の両方が含まれています。バージョン 2.1 以前には JDK 8、バージョン 3.0 以降または master ブランチには JDK 17 を使用してください。
- ARM64 アーキテクチャ上で Docker を使用してコンパイルする場合は、まず ARM64 対応の Linux ベースイメージ（Ubuntu 22.04.5 LTS に対応する `apache/doris:base-latest` など）をダウンロードしてください。その後、[Linux での直接コンパイル](./compilation-linux)と[ARM プラットフォームでのコンパイル](./compilation-arm)のドキュメントを参照して、依存ライブラリをインストールし、コンパイルしてください。

コンテナ内では、環境変数を使って JDK を切り替えます。

```bash
# Switch to JDK 8
export JAVA_HOME=/usr/lib/jvm/java-1.8.0
export PATH=$JAVA_HOME/bin/:$PATH

# Switch to JDK 17
export JAVA_HOME=/usr/lib/jvm/jdk-17.0.2/
export PATH=$JAVA_HOME/bin/:$PATH
```

## 4. 独自の開発用イメージのビルド {#4-build-your-own-development-image}

ベースイメージをカスタマイズする場合（ベースとなるディストリビューションの変更やデバッグツールの追加など）は、ソースコード内の `docker/README.md` を参照してください。

## よくある質問 {#faq}

### Q1: イメージのバージョンと Doris のバージョンが一致しない場合はどうなりますか？ {#q1-what-happens-if-the-image-version-does-not-match-the-doris-version}

イメージ内の thirdparty ライブラリと toolchain は、Doris のソースコードと密接に結び付いています。異なるバージョンを組み合わせると、コンパイル中に `undefined reference` や `incompatible library` などのリンクエラーが発生する可能性が非常に高くなります。必ず表に従って選択してください。

### Q2: ビルド時に `AVX2 not supported` と表示される場合は？ {#q2-the-build-reports-avx2-not-supported}

ホストまたは実行先のマシンの CPU が AVX2 命令セットに対応していません。`no-avx2` 接尾辞が付いたイメージに切り替え、ビルド時に `USE_AVX2=0` を設定してください。

### Q3: `docker pull` でのイメージ取得が遅すぎる場合は？ {#q3-docker-pull-is-too-slow-to-pull-the-image}

Docker イメージのミラーアクセラレーターを設定するか、完全なパス `docker.io/apache/doris:...` を使用してください。

### Q4: コンテナ内で Java ライブラリのダウンロードに失敗する場合は？ {#q4-java-library-downloads-fail-inside-the-container}

コンテナが `--network=host` を指定して起動されていること、および `~/.m2` ディレクトリがコンテナにマウントされていることを確認してください。プロキシやネットワークの分離によって Maven Central リポジトリにアクセスできなくなる場合があります。

### Q5: Git で `detected dubious ownership in repository` と表示される場合は？ {#q5-git-reports-detected-dubious-ownership-in-repository}

マウントしたソースディレクトリの所有者が、ホスト上の別のユーザーである可能性があります。ソースリポジトリを信頼できることを確認したうえで、コンテナ内でマウント先のパスを例外として追加してください。

```bash
git config --global --add safe.directory /root/doris
```

コンテナ内のマウント先を変更した場合は、`/root/doris` をそのパスに置き換えてください。

## 関連ドキュメント {#related-documents}

- [LDB Toolchain を使用したコンパイル](./compilation-with-ldb-toolchain)
- [Linux での直接コンパイル](./compilation-linux)
- [ARM プラットフォームでのコンパイル](./compilation-arm)
