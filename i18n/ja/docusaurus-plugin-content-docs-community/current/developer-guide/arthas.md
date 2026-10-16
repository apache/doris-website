---
title: Arthas を使用した FE のパフォーマンス分析
language: ja
description: "Arthas を使用して Apache Doris FE のパフォーマンスをオンラインで分析します。フレームグラフ、関数呼び出しのトレース、実行時の状態の観察について説明します。"
keywords:
    - Apache Doris
    - Arthas
    - FE のパフォーマンス分析
    - フレームグラフ
    - 関数呼び出しのトレース
    - JVM
    - DorisFE
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

# Arthas を使用した FE のパフォーマンス分析

<!-- Knowledge type: Tool usage -->
<!-- Applicable scenarios: Performance tuning / Troubleshooting -->

## はじめに

Apache Doris 3.1.0 以降では、FE のデプロイディレクトリ `${DORIS_FE_HOME}/arthas` に Arthas ツール（バージョン 4.0.5）が同梱されています。Arthas を使用すると、オンラインでフレームグラフを生成し、関数の呼び出し経路をトレースし、関数の実行時間を測定し、関数の入力値と戻り値を観察できます。これにより、FE の実行時の問題を特定しやすくなります。

コマンドの詳しい説明は、[Arthas の公式ドキュメント](https://arthas.aliyun.com/en/doc/)を参照してください。

### 対応環境

| システム | 対応状況 |
|------|---------|
| Linux | 対応 |
| macOS | 対応 |
| Windows | 現時点では未対応 |

### 古い FE バージョンへの手動インストール

Doris 3.1.0 より前のバージョンでは、Arthas を手動でダウンロードします。

```bash
wget https://github.com/alibaba/arthas/releases/download/arthas-all-4.0.5/arthas-bin.zip
unzip arthas-bin.zip -o ${DORIS_FE_HOME}/arthas
```

## フレームグラフの生成

1. `${DORIS_FE_HOME}/arthas/as.sh` スクリプトを実行し、プロセス一覧から `DorisFE` プロセスの番号を選択します。

    ```shell
    bash ./as.sh
    Arthas script version: 4.0.5
    Found existing java process, please choose one and input the serial number of the process, eg : 1. Then hit ENTER.
    * [1]: 75123 com.intellij.idea.Main
      [2]: 77285 org.apache.doris.DorisFE
      [3]: 76901 DorisBE
      [4]: 6776 org.jetbrains.jps.cmdline.Launcher
      [5]: 76265 DorisBE
      [6]: 80527 org.jetbrains.jps.cmdline.Launcher
    2
    ```

2. Arthas のコマンドラインでプロファイリングを開始します。

    ```shell
    [arthas@77285]$ profiler start
    Profiling started
    ```

3. プロファイリングを停止し、HTML 形式のフレームグラフを生成します。

    ```shell
    [arthas@77285]$ profiler stop --format html
    OK
    profiler output file: <DORIS_FE_HOME>/arthas-output/20250627-115104.html
    ```

    出力ファイルは `${DORIS_FE_HOME}/arthas-output/` に保存されます。ブラウザで開き、処理時間の長い関数を分析します。

## よく使う Arthas コマンド

| コマンド | 用途 |
|------|------|
| `profiler start` / `profiler stop --format html` | CPU フレームグラフを収集する |
| `trace <class> <method>` | 関数の呼び出し経路と実行時間をトレースする |
| `watch <class> <method>` | 関数の入力値と戻り値を観察する |
| `thread` | JVM スレッドの状態を確認する |
| `dashboard` | JVM 全体の実行時メトリクスをリアルタイムで確認する |

## よくある質問

**Q: `DorisFE` プロセスが `as.sh` を実行しても見つかりません。**

FE プロセスが起動していることと、`as.sh` を FE と同じマシンで実行していることを確認してください。プロセス一覧には、現在のユーザーから参照できる JVM が表示されます。

**Q: 生成されたフレームグラフが空であるか、サンプル数が少なすぎます。**

プロファイリング中に、FE に継続的なクエリまたはリクエストの負荷がかかっていることを確認してください。`profiler start` から `profiler stop` までの時間を延ばすこともできます。
