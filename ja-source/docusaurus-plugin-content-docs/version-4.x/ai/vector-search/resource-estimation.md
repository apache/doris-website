---
{
  "title": "ANNリソース推定ガイド",
  "language": "ja",
  "description": "このガイドでは、HNSW や異なる量子化器を使用した IVF を含む、Apache Doris における ANN ワークロードのメモリと CPU 要件を見積もる方法について説明します。"
}
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

ANNワークロードは通常、生ストレージよりもメモリとCPUによって制約されます。このガイドでは、起動前にクラスターサイジングを見積もる実用的な方法を提供します。

この方法は、ベクトルデータベースでよく使用される同じパターンに従います：
1. まずindexメモリを見積もる
2. 目標クエリパフォーマンスに基づいてCPUコア数を見積もる
3. 非ベクトルカラムと実行オーバーヘッド用のメモリヘッドルームを予約する

## ANNが明示的な容量プランニングを必要とする理由

通常のOLAP indexと比較して、ANNには以下の特定のリソース特性があります：

1. Index構築はCPU集約的である
2. 非常に大きなセグメントはindex構築の失敗を引き起こす可能性がある（例：単一index構築中のout-of-memoryによる）
3. 高性能クエリは通常、indexがメモリに常駐することを要求する
4. 高QPSクエリは距離計算とマージオーバーヘッドを維持するのに十分なCPUコア数を必要とする

メモリ使用量を削減するため、Dorisはベクトル量子化（`sq8`、`sq4`、`pq`）をサポートしています。量子化はメモリを節約しますが、トレードオフをもたらす可能性があります：
- インポートが遅くなる（追加のエンコーディング）
- クエリが遅くなることがある（追加のデコード/再構築）
- 量子化は非可逆であるため再現率が低下する

## ステップバイステップの見積もり

以下の入力を準備してください：
- ベクトル次元 `D`
- 総行数 `N`
- Indexタイプ（`hnsw`または`ivf`）
- Quantizer（`flat`、`sq8`、`sq4`、`pq`）
- HNSWパラメータ `max_degree`（HNSWを使用する場合）
- 目標QPSと遅延目標

次に、この順序で見積もります：
1. Indexメモリ
2. CPUコア数
3. 安全ヘッドルーム

## HNSWメモリ見積もり

デフォルト`max_degree=32`のHNSWの場合、実用的なメモリは：

`HNSW_FLAT_Bytes ~= 1.3 * D * 4 * N`

ここで：
- `D * 4 * N`は生のfloat32ベクトルメモリ
- `1.3`はHNSWグラフオーバーヘッドを含む

`max_degree`が増加した場合、グラフオーバーヘッドを比例してスケールします：

`HNSW_factor ~= 1 + 0.3 * (max_degree / 32)`

`HNSW_FLAT_Bytes ~= HNSW_factor * D * 4 * N`

Quantizerベースの近似値：
- `sq8`：`flat`の約`1/4`
- `sq4`：`flat`の約`1/8`
- `pq`：通常メモリでは`sq4`に近い（例：`pq_m=D/2, pq_nbits=8`）

### クイックリファレンス（`D=768`、`max_degree=32`）

| 行数 | FLAT | SQ8 | SQ4 | PQ (`m=384, nbits=8`) |
|------|------|-----|-----|------------------------|
| 1M | 4 GB | 1 GB | 0.5 GB | 0.5 GB |
| 10M | 40 GB | 10 GB | 5 GB | 5 GB |
| 100M | 400 GB | 100 GB | 50 GB | 50 GB |
| 1B | 4000 GB | 1000 GB | 500 GB | 500 GB |
| 10B | 40000 GB | 10000 GB | 5000 GB | 5000 GB |

## IVFメモリ見積もり

IVFはHNSWよりも構造的オーバーヘッドが少ないです。実用的な近似値は：

`IVF_FLAT_Bytes ~= D * 4 * N`

Quantizerベースの近似値：
- `sq8`：`flat`の約`1/4`
- `sq4`：`flat`の約`1/8`
- `pq`：通常`sq4`に近い

### クイックリファレンス（`D=768`）

| 行数 | FLAT | SQ8 | SQ4 | PQ (`m=384, nbits=8`) |
|------|------|-----|-----|------------------------|
| 1M | 3 GB | 0.75 GB | 0.35 GB | 0.35 GB |
| 10M | 30 GB | 7.5 GB | 3.5 GB | 3.5 GB |
| 100M | 300 GB | 75 GB | 35 GB | 35 GB |
| 1B | 3000 GB | 750 GB | 350 GB | 350 GB |
| 10B | 30000 GB | 7500 GB | 3500 GB | 3500 GB |

## CPU見積もり

高QPS ANN検索の場合、実用的なベースライン比率は：

`16コア：64 GBメモリ`（約`1コア：4 GB`）

量子化を使用する場合、CPU需要はindexメモリと比例して常に縮小するとは限りません。実際には、**FLAT-memory-equivalent workload**からCPUを見積もり、ベンチマーク検証後にのみ調整を減らします。

## 実クエリヘッドルーム（100%にサイジングしない）

上記の数式はANN indexメモリのみを見積もります。実際のSQLは多くの場合、追加のカラムを返します。例：

```sql
SELECT id, text, l2_distance_approximate(embedding, [...]) AS dist
FROM tbl
ORDER BY dist
LIMIT N;
```
TopN delayed materializationを使用しても、実行時には他のオペレーターやカラムのためのメモリが必要です。本番環境でのリスクを軽減するために：

- ANNインデックスメモリをマシンメモリの約`70%`以下に保つ
- 残りのメモリをクエリ実行、コンパクション、および非ベクターデータアクセス用に確保する

## シナリオ別サイジング推奨事項

1. 最高パフォーマンス、メモリが問題ではない場合：`HNSW + FLAT`
2. メモリ制約のあるデプロイメント：`HNSW/IVF + PQ`（多くの場合`SQ8/SQ4`よりも実用的なバランスが優れている）
3. PQパラメータ化については、`pq_m = D / 2`から開始し、リコールとレイテンシーの目標に応じて調整する
4. クエリパフォーマンス要件が中程度の場合は、CPUコア数の削減を優先する。一部のデプロイメントでは、インポート/ビルド時により高いCPUをプロビジョニングし、その後CPUをスケールダウンできる

## 関連ドキュメント

- [Overview](./overview.md)
- [HNSW](./hnsw.md)
- [IVF](./ivf.md)
- [ANN Index Management](./index-management.md)
