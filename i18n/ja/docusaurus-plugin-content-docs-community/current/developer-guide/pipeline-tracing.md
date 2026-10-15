---
title: Pipeline Tracing（パイプライントレーシング）
language: ja
description: Apache Doris の Pipeline Tracing は、スケジューリングのトレースを記録し、Perfetto で可視化します。
keywords:
    - Apache Doris
    - Pipeline Tracing
    - パイプライン実行エンジン
    - Perfetto
    - スケジューリング分析
    - BE のパフォーマンスチューニング
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

# Pipeline Tracing（パイプライントレーシング）

<!-- Knowledge type: Tool usage -->
<!-- Applicable scenarios: Performance tuning / Scheduling analysis -->

## はじめに

Apache Doris の Pipeline 実行エンジンでは、各 Instance の実行計画ツリーが複数の Pipeline Task に分割され、専用の Pipeline スケジューラによってスケジュールされ、実行されます。Pipeline Task の数が多い場合、これらのタスクがスレッドや CPU コアにどのように割り当てられるかは、実行性能に影響する重要な要因になります。

Pipeline Tracing ツールを使うと、特定のクエリまたは期間のスケジューリング過程を観察でき、性能の分析やボトルネックの特定が容易になります。

## 使用手順

### 1. スケジューリングデータを記録する

HTTP インターフェースを使用して、BE がスケジューリング過程を記録するかどうか、および記録方法を制御します。これらの設定は、指定した BE にのみ適用されます。

| 目的 | HTTP コマンド |
|---------|----------|
| Pipeline Tracing の記録を無効にする | `curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=disable` |
| クエリごとに一件の記録を生成する | `curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=perquery` |
| 一定期間のトレース記録を生成する | `curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=periodic` |
| 期間の長さ（秒）を設定する | `curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?dump_interval=60` |

コマンド例：

```shell
# Disable Pipeline Tracing recording
curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=disable

# Produce one record per query
curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=perquery

# Produce a tracing record over a fixed period
curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=periodic

# Set the period length to 60 seconds
curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?dump_interval=60
```

### 2. データ形式を変換する

記録されたデータは、対象の BE の `log/tracing` ディレクトリに書き込まれます。`doris/tools/pipeline-tracing/` にある変換スクリプトを使用して、生データを Perfetto で読み込める JSON 形式に変換します。

```shell
cd doris/tools/pipeline-tracing/
python3 origin-to-show.py -s <SOURCE_FILE> -d <DEST>.json
```

パラメータ：

| パラメータ | 説明 |
|------|------|
| `-s <SOURCE_FILE>` | BE が生成した生のトレースファイルのパス |
| `-d <DEST>.json` | 可視化に使用する出力 JSON ファイルのパス |

詳しい使い方は、そのディレクトリにある `README.md` を参照してください。

### 3. Perfetto で可視化する

1. [Perfetto](https://ui.perfetto.dev/) を開きます。
2. `Open trace file` をクリックし、前の手順で生成した JSON ファイルを選択します。
3. スケジューリング結果を確認します。

    ![](/images/tracing1.png)

    Perfetto では、同じタスクが CPU コア間でどのようにスケジュールされるかも確認できます。

    ![](/images/tracing2.png)

## よくある質問（FAQ）

**Q: トレースファイルはどこにありますか？**

対象の BE の `log/tracing` ディレクトリにあります。ファイル名にはタイムスタンプとクエリ情報が含まれます。

**Q: Pipeline Tracing を有効にすると性能に影響しますか？**

多少のオーバーヘッドが生じます。スケジューリングを調査するときだけ有効にし、調査が終わったら `type=disable` で無効にしてください。
