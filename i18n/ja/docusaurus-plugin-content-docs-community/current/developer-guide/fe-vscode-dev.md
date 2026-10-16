---
title: FE 開発環境のセットアップ - Visual Studio Code (VSCode)
language: ja
description: VSCode を使用した Apache Doris FE 開発環境のセットアップ方法を説明します。Java 拡張機能の設定、JDK の切り替え、リモートデバッグを扱います。
keywords:
    - VSCode
    - Apache Doris FE
    - FE 開発環境
    - Java 拡張機能
    - リモートデバッグ
    - JDWP
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

# VSCode を使用した FE 開発環境のセットアップ

このドキュメントでは、開発マシン、WSL、または Docker 上で、VSCode を使用して Doris FE 開発環境をセットアップする方法を説明します。VSCode を使用する開発者は、Remote 拡張機能を利用してリモートで開発やデバッグを行えます。

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: IDE configuration / Debugging setup -->

## 1. 前提条件

| コンポーネント          | 必要なバージョン                                                      | 用途                                           |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------- |
| JDK                     | 11 以降（Java 拡張機能に必要）。コンパイルには JDK 8 も使用可能       | 両方をインストールし、設定で切り替える          |
| VSCode                  | 最新の安定版                                                        | エディター                                     |
| Extension Pack for Java | 最新版                                                              | Java 言語のサポート                            |
| Remote 拡張機能         | Remote - SSH / Remote - WSL / Remote - Containers                    | リモート開発                                   |

[JDK 11](https://github.com/adoptium/temurin11-binaries/releases/) と JDK 8 を、`~/lib` などの独立したディレクトリにそれぞれインストールすることを推奨します。前者は IDE 拡張機能、後者はソースコードのコンパイルに使用します。

## 2. ソースコードのクローンと開き方

1. GitHub からソースコードをダウンロードします。

    ```bash
    git clone https://github.com/apache/doris.git
    ```

2. VSCode で、リポジトリのルート全体ではなく、ソースツリー内の `fe` ディレクトリを開きます。

## 3. VSCode の設定

`settings.json` を `fe/.vscode/` に作成し、Java ランタイムと Maven のパスを設定します。

<!-- Knowledge type: Configuration parameters -->

| 設定項目                        | 説明                                                          |
| ------------------------------- | ------------------------------------------------------------- |
| `java.configuration.runtimes`   | 利用可能な JDK の一覧を登録し、Java 拡張機能がプロジェクトごとに使用する |
| `java.jdt.ls.java.home`         | JDK 11 以降のディレクトリを指定する（`vscode-java` 拡張機能自体が使用） |
| `maven.executable.path`         | `maven-language-server` 拡張機能が使用するローカルの Maven 実行ファイルを指定する |

例：

```json
{
    "java.configuration.runtimes": [
        {
            "name": "JavaSE-1.8",
            "path": "/!!!path!!!/jdk-1.8.0_191"
        },
        {
            "name": "JavaSE-11",
            "path": "/!!!path!!!/jdk-11.0.14.1+1",
            "default": true
        }
    ],
    "java.jdt.ls.java.home": "/!!!path!!!/jdk-11.0.14.1+1",
    "maven.executable.path": "/!!!path!!!/maven/bin/mvn"
}
```

## 4. FE のコンパイル

コンパイルの詳しい手順については、以下を参照してください。

- [LDB ツールチェーンを使用したコンパイル](/community/source-install/compilation-with-ldb-toolchain)
- [Docker 開発イメージを使用したコンパイル](/community/source-install/compilation-with-docker)

## 5. リモートデバッグの設定

<!-- Knowledge type: Configuration parameters -->

VSCode から FE をリモートデバッグするには、FE の起動時に次の JDWP パラメーターを追加します。

```shell
-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005
```

これを行うには、`doris/output/fe/bin/start_fe.sh` を編集し、`$JAVA $final_java_opt` の後に上記のパラメーターを追加します。

| JDWP パラメーター | 値          | 説明                                                      |
| ---------------- | ----------- | --------------------------------------------------------- |
| `transport`      | `dt_socket` | ソケット転送を使用する                                      |
| `server`         | `y`         | デバッグサーバーとして起動し、デバッガーの接続を待つ          |
| `suspend`        | `n`         | 起動時に中断せず、通常どおり実行する                          |
| `address`        | `5005`      | 待ち受けポート。変更可能                                    |

FE を起動した後、VSCode の Java Debug 拡張機能で `host:5005` に **Attach** すると、ブレークポイントを使ってデバッグできます。

## 6. よくある質問（FAQ）

<!-- Knowledge type: Troubleshooting -->

### Q1: Java 拡張機能で JDK のバージョンが低すぎると報告される

`java.jdt.ls.java.home` には JDK 11 以降を指定する必要があります。コンパイルに JDK 8 を使用する場合でも、拡張機能自体の実行には JDK 11 以降が必要です。

### Q2: Maven のタスクが失敗する、または `mvn` が見つからない

`maven.executable.path` が有効な `mvn` 実行ファイルを指していることを確認するか、システムの `PATH` に追加してください。

### Q3: リモートデバッグに接続できない

- FE プロセスが JDWP パラメーターを実際に読み込んでいることを確認します（`ps -ef | grep java` でコマンドラインを確認します）。
- `address` で指定したポートがファイアウォールでブロックされていないことを確認します。
- `suspend=y` を使用すると、FE はデバッガーの接続を待って停止します。`suspend=n` に変更するか、デバッガーから先に接続してください。
