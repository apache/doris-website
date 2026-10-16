---
title: IntelliJ IDEA を使用した FE 開発環境のセットアップ
language: ja
description: Linux、macOS、Windows で IntelliJ IDEA を使用して Apache Doris FE の開発・デバッグ環境をセットアップする方法を説明します。
keywords:
    - IntelliJ IDEA
    - Apache Doris FE
    - FE 開発環境
    - FE デバッグ
    - Thrift
    - generated-source
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

# IntelliJ IDEA を使用した FE 開発環境のセットアップ

このドキュメントでは、Linux、macOS、Windows で IntelliJ IDEA を使用し、Doris FE（Frontend）の開発・デバッグ環境をセットアップする方法を説明します。

<!-- Knowledge type: Procedure -->
<!-- Applies to: IDE configuration / Debugging setup -->

## 1. 環境の準備

必要なもの：JDK 1.8 以降、IntelliJ IDEA。

### 1.1 ソースコードの取得

GitHub から Doris のソースコードをローカルマシンにダウンロードします。

```bash
git clone https://github.com/apache/doris.git
```

:::tip macOS ユーザー向けの注意
**IDEA でプロジェクトを開く際は、Doris リポジトリのルート全体ではなく、ソースツリー内の `fe` サブディレクトリを直接開くことを推奨します。** これにより、後で `be` ディレクトリを開く CLion との競合を避けられます。
:::

### 1.2 Thrift のインストール {#12-install-thrift}

FE の開発のみを行い、`thirdparty` 全体をまだビルドしていない場合は、Thrift を別途インストールし、`thirdparty/installed/bin` ディレクトリにコピーするか、シンボリックリンクを作成する必要があります。

| Doris のバージョン | 対応する Thrift のバージョン |
| ----------------- | --------------------------- |
| 0.15 ~ 1.2        | 0.13.0                      |
| 1.2+              | 0.16.0                      |

以下では 0.16.0 を例に説明します。0.13.0 でも手順は同じです。

#### macOS

```bash
brew tap homebrew/core --force
brew tap-new $USER/local-tap
brew extract --version='0.16.0' thrift $USER/local-tap
brew install thrift@0.16.0
```

ダウンロードに失敗する場合は、次のファイルを編集できます。

`/usr/local/Homebrew/Library/Taps/$USER/homebrew-local-tap/Formula/thrift@0.16.0.rb`

変更前：

`url "https://www.apache.org/dyn/closer.lua?path=thrift/0.16.0/thrift-0.16.0.tar.gz"`

変更後：

`url "https://archive.apache.org/dist/thrift/0.16.0/thrift-0.16.0.tar.gz"`

参考：<https://gist.github.com/tonydeng/02e571f273d6cce4230dc8d5f394493c>

#### Linux

```bash
wget https://archive.apache.org/dist/thrift/0.16.0/thrift-0.16.0.tar.gz
yum install -y autoconf automake libtool cmake ncurses-devel openssl-devel lzo-devel zlib-devel gcc gcc-c++
tar zxvf thrift-0.16.0.tar.gz
cd thrift-0.16.0
./configure --without-tests
make
make install
```

インストール後、バージョンを確認します。

```bash
thrift --version
```

#### Windows

1. <http://archive.apache.org/dist/thrift/0.16.0/thrift-0.16.0.exe> からダウンロードします。
2. `./thirdparty/installed/bin` にコピーします。

> Doris 全体をすでにビルドしている場合、Thrift を再インストールする必要はありません。`$DORIS_HOME/thirdparty/installed/bin/thrift` をそのまま再利用できます。

## 2. コードの生成

### Linux / macOS

ソースのルートディレクトリで以下を実行します。

```bash
sh generated-source.sh
```

`Done` と表示されるまで待ちます。

> バージョン 1.2 以前では `cd fe && mvn generate-sources` を使用します。エラーが発生した場合は `cd fe && mvn clean install -DskipTests` を実行します。

IDEA の UI から対応する Maven コマンドを実行することもできます。

![](/images/gen_code.png)

### Windows

Windows では `make` やシェルスクリプトを実行できない場合があります。次のいずれかの方法を使用してください。

- Linux マシンで生成した `fe/fe-core/target/generated-sources` ディレクトリを、Windows 上の対応する場所にコピーします。
- Docker でローカルディレクトリをマウントし、Docker 内で自動生成コードを生成します（[ソースからのコンパイル](../source-install/compilation-with-docker)を参照）。

## 3. ヘルプドキュメントの生成

ヘルプドキュメントをまだ生成していない場合は、以下を実行します。

```bash
cd doris/docs
sh build_help_zip.sh
cp build/help-resource.zip ../fe/fe-core/target/classes
```

## 4. IDEA でのデバッグ設定

### 4.1 プロジェクトのインポート

IDEA で `fe` プロジェクトをインポートします。

### 4.2 ディレクトリの準備

`fe` ディレクトリ内にデバッグに必要なディレクトリを作成します（新しいバージョンではすでに存在する場合があります）。

![](/images/DEBUG4.png)

### 4.3 UI のビルド（任意）

`ui` プロジェクトをビルドし、`ui/dist/` ディレクトリ内のファイルを `webroot` にコピーします。Doris UI を表示する必要がなければ、この手順は省略できます。

### 4.4 fe.conf の設定

以下は、必要に応じて調整できる `conf/fe.conf` の設定例です。

```bash
LOG_DIR = ${DORIS_HOME}/log

DATE = `date +%Y%m%d-%H%M%S`
JAVA_OPTS="-Xmx2048m -XX:+UseMembar -XX:SurvivorRatio=8 -XX:MaxTenuringThreshold=7 -XX:+PrintGCDateStamps -XX:+PrintGCDetails -XX:+UseConcMarkSweepGC -XX:+UseParNewGC -XX:+CMSClassUnloadingEnabled -XX:-CMSParallelRemarkEnabled -XX:CMSInitiatingOccupancyFraction=80 -XX:SoftRefLRUPolicyMSPerMB=0 -Xloggc:$DORIS_HOME/log/fe.gc.log.$DATE"

# For jdk 9+, this JAVA_OPTS will be used as default JVM options
JAVA_OPTS_FOR_JDK_9="-Xmx4096m -XX:SurvivorRatio=8 -XX:MaxTenuringThreshold=7 -XX:+CMSClassUnloadingEnabled -XX:-CMSParallelRemarkEnabled -XX:CMSInitiatingOccupancyFraction=80 -XX:SoftRefLRUPolicyMSPerMB=0 -Xlog:gc*:$DORIS_HOME/log/fe.gc.log.$DATE:time"

sys_log_level = INFO

http_port = 8030
rpc_port = 9020
query_port = 9030
arrow_flight_sql_port = -1
edit_log_port = 9010

# priority_networks = 10.10.10.0/24;192.168.0.0/16
```

:::tip macOS で Docker を使用して BE を実行する場合
macOS で Docker for Mac を介して BE を実行する場合、`docker for Mac` は Host モードをサポートしていないため、`-p` で BE のポートを公開する必要があります。また、`priority_networks` には、`fe.conf` でコンテナ内から到達できる IP アドレス（例：Wi-Fi の IP アドレス）を設定する必要があります。
:::

### 4.5 IDEA の実行環境変数の設定

IDEA で実行環境変数を設定します。

![](/images/DEBUG5.png)

<!-- Knowledge type: Configuration parameters -->

macOS での設定例です（`DORIS_HOME` 環境変数は、別途コピーした Doris の実行環境ディレクトリを指します）。

| 環境変数     | 値の例                        | 説明                                           |
| ------------ | ----------------------------- | ---------------------------------------------- |
| `JAVA_OPTS`  | `-Xmx8092m`                   | JVM のヒープパラメータ                         |
| `LOG_DIR`    | `~/DorisDev/doris-run/fe/log` | FE のログディレクトリ                          |
| `PID_DIR`    | `~/DorisDev/doris-run/fe/log` | PID ファイルのディレクトリ                     |
| `DORIS_HOME` | `~/DorisDev/doris-run/fe`     | FE の実行環境ディレクトリ（ソースディレクトリではありません） |

```bash
JAVA_OPTS=-Xmx8092m
LOG_DIR=~/DorisDev/doris-run/fe/log
PID_DIR=~/DorisDev/doris-run/fe/log
DORIS_HOME=~/DorisDev/doris-run/fe
```

![macOS での IDEA の実行環境変数の設定画面](/images/mac-idea-deployment5.png)

### 4.6 Modify options の設定 {#46-configure-modify-options}

一部の依存関係はスコープが `provided` に設定されているため、IDEA で特別な設定が必要です。`Run/Debug Configurations` で右側の `Modify options` をクリックし、`Add dependencies with "provided" scope to classpath` にチェックを入れます。

![](/images/idea_options.png)

## 5. FE の起動

`Run` または `Debug` をクリックします。IDEA がコンパイルを開始し、完了すると FE が起動します。

![macOS での IDEA による FE の起動画面](/images/mac-idea-deployment6.png)

これで FE の開発とデバッグを開始できます。

## 6. よくある質問（FAQ）

<!-- Knowledge type: Troubleshooting -->

### Q1: 起動時に `ClassNotFoundException` が発生する、または一部の依存関係が見つからない

`Add dependencies with "provided" scope to classpath` に、`Run/Debug Configurations` でチェックが入っていません。[セクション 4.6](#46-configure-modify-options)を参照して設定してください。

### Q2: `generated-source.sh` で Thrift のバージョン不一致が報告される

`thirdparty/installed/bin/thrift` のバージョンが、使用している Doris のバージョンと一致していません。[セクション 1.2](#12-install-thrift)の対応表に従って再インストールしてください。

### Q3: 起動後に BE やクライアントから FE にアクセスできない

`priority_networks` が `fe.conf` でローカルマシンまたはコンテナから到達できるサブネットに設定されているか確認してください。macOS と Docker 上の BE を組み合わせる場合は、セクション 4.4 のヒントを参照してください。
