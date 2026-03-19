---
{
  "title": "ベクトル量子化調査および選択ガイド",
  "language": "ja",
  "description": "DorisANNにおけるSQ、PQ、および関連する量子化手法の実用的な調査、トレードオフと選択指針を含む。"
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

この文書では、実用的な観点から一般的なベクトル量子化手法を紹介し、Apache Doris ANNワークロードでそれらを適用する方法について説明します。

## 量子化が必要な理由

ANNワークロード、特にHNSWでは、インデックスメモリが急速にボトルネックとなる可能性があります。量子化は高精度ベクトル（通常float32）をより低精度のコードにマッピングし、わずかな再現率を犠牲にしてメモリ使用量を削減します。

Dorisでは、量子化はANNインデックスの`quantizer`プロパティで制御されます：
- `flat`：量子化なし（最高品質、最高メモリ使用量）
- `sq8`：スカラー量子化、8-bit
- `sq4`：スカラー量子化、4-bit
- `pq`：積量子化

例（HNSW + quantizer）：

```sql
CREATE TABLE vector_tbl (
  id BIGINT,
  embedding ARRAY<FLOAT>,
  INDEX ann_idx (embedding) USING ANN PROPERTIES (
    "index_type" = "hnsw",
    "metric_type" = "l2_distance",
    "dim" = "768",
    "quantizer" = "sq8"
  )
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 8
PROPERTIES ("replication_num" = "3");
```
## Method Overview

| Method | Core Idea | Typical Gain | Main Cost |
|---|---|---|---|
| SQ (Scalar Quantization) | 各次元を独立して量子化 | 大幅なメモリ削減、シンプルな実装 | FLATより構築が遅い；より強い圧縮では再現率が低下 |
| PQ (Product Quantization) | ベクトルをサブベクトルに分割し、各サブベクトルをコードブックで量子化 | 多くのデータセットでより良い圧縮/レイテンシのバランス | 学習/エンコーディングのコストが高い；チューニングが必要 |

Apache Dorisは現在、ANNベクトルインデックスと検索のコアエンジンとして最適化されたFaiss実装を使用しています。以下で説明するSQ/PQの動作は、実際にDorisに直接関連しています。

## Scalar Quantization (SQ)

### 原理

SQはベクトル次元を変更せず、次元ごとの精度のみを下げます。

次元ごとの標準的なmin-maxマッピングは以下の通りです：
- `max_code = (1 << b) - 1`
- `scale = (max_val - min_val) / max_code`
- `code = round((x - min_val) / scale)`

Faiss SQには2つのスタイルがあります：
- Uniform：すべての次元が1つのmin/max範囲を共有
- Non-uniform：各次元が独自のmin/maxを使用

次元の値の範囲が大きく異なる場合、non-uniform SQは通常より良い再構築品質を提供します。

### 主な特徴

- 長所：
  - 直接的で安定している
  - 予測可能な圧縮（`sq8`はfloat32値に対して約4倍、`sq4`は約8倍）
- 短所：
  - 分布が固定ステップでバケット化できることを前提としている
  - 次元が非常に不均一な場合（例：強いロングテール）、量子化エラーが増加する可能性がある

### Faissソースレベル注記（SQ）

Doris + 最適化Faiss実装パスでは、SQ学習は最初にmin/max統計を計算し、その後追加時の範囲外リスクを軽減するために範囲をわずかに拡張します。簡略化された形は以下の通りです：

```cpp
void train_Uniform(..., const float* x, std::vector<float>& trained) {
    trained.resize(2);
    float& vmin = trained[0];
    float& vmax = trained[1];
    // scan all values to get min/max
    // then optionally expand range by rs_arg
}
```
非一様なSQの場合、Faissは次元ごとに統計を計算します（1つのグローバルな範囲ではなく）。これにより、異なる次元が非常に異なる値スケールを持つ場合に、通常はより良く動作します。

### 実用的な観察結果

内部の128D/256D HNSWテストにおいて：
- `sq8`は一般的に`sq4`よりもrecallをよく保持しました。
- SQインデックスのbuild/add時間はFLATより大幅に長くなりました。
- 検索レイテンシの変化は`sq8`では小さいことが多い一方、`sq4`はrecallの低下が大きくなりました。

以下の棒グラフはベンチマークデータの例に基づいています：

![SQ build time vs rows (128D)](/images/vector-search/quantization-survey/sq-build-time-vs-rows.png)

![SQ memory usage vs rows (128D)](/images/vector-search/quantization-survey/sq-memory-usage-vs-rows.png)

## Product Quantization (PQ)

### 原理

PQは`D`次元ベクトルを`M`個のサブベクトル（それぞれ`D/M`次元）に分割し、各部分空間にk-meansコードブックを適用します。

主要なパラメータ：
- `pq_m`: サブ量子化器（サブベクトル）の数
- `pq_nbits`: サブベクトルコードあたりのビット数

`pq_m`を大きくすると通常は品質が向上しますが、トレーニング/エンコーディングコストが増加します。

### PQがクエリ時により高速になる理由

PQはLUT（ルックアップテーブル）距離推定を使用できます：
- クエリサブベクトルとコードブック重心間の距離を事前計算します。
- テーブルルックアップ + 累積により完全ベクトル距離を近似します。

これにより完全な再構築を回避でき、検索CPU コストを削減できます。

### Faissソースレベル注意（PQ）

同じ実装パスの下で、Faiss `ProductQuantizer`は部分空間上でコードブックをトレーニングし、それらを連続した重心テーブルに格納します。簡略化された形状は：

```cpp
void ProductQuantizer::train(size_t n, const float* x) {
    Clustering clus(dsub, ksub, cp);
    IndexFlatL2 index(dsub);
    clus.train(n * M, x, index);
    for (int m = 0; m < M; m++) {
        set_params(clus.centroids.data(), m);
    }
}
```
Centroidは `(M, ksub, dsub)` として配置されます。ここで：
- `M`: サブ量子化器の数
- `ksub`: サブ空間あたりのコードブックサイズ (`2^pq_nbits`)
- `dsub`: サブベクトル次元 (`D / M`)

### 実用的な観測

同じ内部テストにおいて：
- PQは明確な圧縮効果を示しました。
- PQのエンコーディング/トレーニングオーバーヘッドは高いものでした。
- SQと比較して、PQはLUT加速により検索時の動作が良好な場合が多くありましたが、リコール/構築のトレードオフはデータとパラメータに依存しました。

以下の棒グラフはベンチマークデータの例に基づいています：

![PQ index size on disk vs rows (128D/256D)](/images/vector-search/quantization-survey/pq-index-size-on-disk-vs-rows.png)

![PQ build time vs rows (128D/256D)](/images/vector-search/quantization-survey/pq-build-time-vs-rows.png)

![PQ search time vs rows (128D/256D)](/images/vector-search/quantization-survey/pq-search-time-vs-rows.png)

## Dorisの実用的選択ガイド

これを開始点として使用してください：

1. メモリが十分でリコールが最優先：`flat`
2. 比較的安定した品質で低リスクの圧縮が必要：`sq8`
3. 極端なメモリ圧迫があり、より低いリコールを受け入れられる：`sq4`
4. より強いメモリパフォーマンスバランスが必要で、チューニングに時間をかけられる：`pq`

推奨検証プロセス：

1. ベースラインとして`flat`から開始する
2. まず`sq8`をテストし、リコールとP95/P99レイテンシを比較する
3. メモリがまだ高すぎる場合、`pq`をテストする（最初の試行として`pq_m = D/2`）
4. メモリ削減がリコールより優先度が高い場合のみ`sq4`を使用する

## ベンチマーキング注意事項

- 絶対時間はハードウェア/スレッド/データセットに依存します。
- 同じ条件下でメソッドを比較してください：
  - ベクトル次元
  - インデックスパラメータ
  - セグメントサイズ
  - クエリセットとグラウンドトゥルース
- 品質とコスト両方を評価してください：
  - Recall@K
  - インデックスサイズ
  - 構築時間
  - クエリレイテンシ

## 関連ドキュメント

- [Overview](./overview.md)
- [HNSW](./hnsw.md)
- [IVF](./ivf.md)
- [ANN Resource Estimation Guide](./resource-estimation.md)
