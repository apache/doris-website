---
title: FE Profiler でフレームグラフを生成する
language: ja
description: async-profiler を使用して Apache Doris FE のフレームグラフを生成し、パフォーマンスのボトルネックを特定する方法を説明します。
keywords:
    - Apache Doris
    - FE Profiler
    - async-profiler
    - フレームグラフ
    - profile_fe.sh
    - FE のパフォーマンスボトルネック
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

# FE Profiler でフレームグラフを生成する

<!-- Knowledge type: Tool usage -->
<!-- Applicable scenarios: Performance tuning / Troubleshooting -->

## はじめに

Apache Doris 2.1.4 以降では、FE のデプロイディレクトリ `${DORIS_FE_HOME}/bin` に `profile_fe.sh` スクリプトが同梱されています。このスクリプトは [async-profiler](https://github.com/async-profiler/async-profiler) を使用して FE のフレームグラフを生成し、FE のパフォーマンスボトルネックを特定できるようにします。

### 対応システム

| システム | 対応状況 |
|--------|-----------|
| Linux | 対応 |
| macOS | 対応 |
| Windows | まだ非対応 |

## 使用手順

### 1. profile_fe.sh を実行する

```shell
# Profile the FE for 10 seconds by default and generate a flame graph
${DORIS_FE_HOME}/bin/profile_fe.sh

# Profile the FE for 30 seconds and generate a flame graph
PROFILE_SECONDS=30 ${DORIS_FE_HOME}/bin/profile_fe.sh
```

| 環境変数 | 意味 | デフォルト値 |
|----------------------|---------|---------|
| `PROFILE_SECONDS` | async-profiler のサンプリング時間（秒） | `10` |

### 2. ワークロードを実行する

コマンドを実行すると、async-profiler は指定された時間だけサンプリングを続けます。その間に調査対象のクエリを FE に繰り返し送信し、対象のコードパスのスタックフレームを async-profiler が取得できるようにします。

### 3. フレームグラフを確認する

サンプリングが終了すると、スクリプトは `${DORIS_FE_HOME}/log` ディレクトリに HTML 形式のフレームグラフファイルを生成します。FE のパフォーマンスボトルネックは、通常、高さが低く幅が広い「台地状」の部分として現れます。それらのスタックフレームに対応するコードを最適化します。

フレームグラフの例：

![FE Profiler で生成したフレームグラフの例](/images/fe-profiler.png)

## 古いバージョンの FE で async-profiler を使用する

Doris 2.1.4 より前のバージョンでは、次の二つのファイルを手動でダウンロードします。

1. [ap-loader-all-3.0-8.jar](https://repo1.maven.org/maven2/me/bechberger/ap-loader-all/3.0-8/ap-loader-all-3.0-8.jar) を `${DORIS_FE_HOME}/lib` ディレクトリにダウンロードします。
2. [profile_fe.sh](https://raw.githubusercontent.com/apache/doris/master/bin/profile_fe.sh) を `${DORIS_FE_HOME}/bin` ディレクトリにダウンロードします。
3. `profile_fe.sh` を実行してフレームグラフを生成します。

## FAQ

**質問：サンプリング中に、対象の関数のスタックフレームがフレームグラフに表示されません。**

通常は、サンプリング中に対応するクエリの処理経路が実行されていません。`profile_fe.sh` の実行中に、対象の SQL を手動またはスクリプトで繰り返し送信するか、`PROFILE_SECONDS=30` を指定してサンプリング時間を延ばしてください。

**質問：FE Profiler と [Arthas](./arthas) はどのように使い分けますか？**

- `profile_fe.sh`：サンプリング時間を指定して実行するスクリプトです。単発のフレームグラフをすばやく生成する場合に適しています。
- Arthas：`trace` や `watch` などを使用して、実行中の状態をより細かく対話的に調査できるターミナルです。詳細な調査に適しています。
