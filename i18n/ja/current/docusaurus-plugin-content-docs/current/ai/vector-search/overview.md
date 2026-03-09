---
{
  "title": "概要 | Vector Search",
  "language": "ja",
  "description": "生成AI アプリケーションにおいて、大規模モデルの内部パラメータの「記憶」のみに依存することには明確な限界があります：（1）モデルの知識が",
  "sidebar_label": "Overview"
}
---
# 概要

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

生成AI アプリケーションにおいて、大規模モデルの内部パラメータの「メモリ」のみに依存することには明らかな制限があります：（1）モデルの知識が古くなり、最新の情報をカバーできない；（2）モデルに直接「生成」させることで幻覚のリスクが高まる。これがRAG（Retrieval-Augmented Generation）の誕生につながります。RAGの主要なタスクは、モデルに無から答えを作り出させることではなく、外部の知識ベースからTop-K個の最も関連性の高い情報チャンクを取得し、それらを根拠となるコンテキストとしてモデルに提供することです。

これを実現するために、ユーザーのクエリと知識ベース内のドキュメント間の意味的関連性を測定する仕組みが必要です。ベクトル表現は標準的なツールです：クエリとドキュメントの両方を意味ベクトルにエンコードすることで、ベクトル類似度を使用して関連性を測定できます。事前学習された言語モデルの進歩により、高品質な埋め込みの生成が主流になりました。したがって、RAGの検索段階は典型的なベクトル類似度検索問題になります：大規模なベクトルコレクションから、クエリに最も類似するK個のベクトル（すなわち候補知識片）を見つけること。

RAGにおけるベクトル検索はテキストに限定されず、マルチモーダルシナリオに自然に拡張されます。マルチモーダルRAGシステムでは、画像、音声、動画、その他のデータタイプもベクトルにエンコードして検索し、生成モデルにコンテキストとして供給できます。例えば、ユーザーが画像をアップロードした場合、システムはまず関連する説明や知識スニペットを検索し、その後説明的なコンテンツを生成できます。医療QAでは、RAGは患者記録や文献を検索して、より正確な診断提案をサポートできます。

## 近似最近傍探索

バージョン4.0から、Apache DorisはANN検索を正式にサポートしています。追加のデータタイプは導入されません：ベクトルは固定長配列として格納されます。距離ベースのインデックスには、Faissをベースとした新しいインデックスタイプANNが実装されています。

一般的な[SIFT](http://corpus-texmex.irisa.fr/)データセットを例として、以下のようにテーブルを作成できます：

```sql
CREATE TABLE sift_1M (
  id int NOT NULL,
  embedding array<float>  NOT NULL  COMMENT "",
  INDEX ann_index (embedding) USING ANN PROPERTIES(
      "index_type"="hnsw",
      "metric_type"="l2_distance",
      "dim"="128",
      "quantizer"="flat"
  )
) ENGINE=OLAP
DUPLICATE KEY(id) COMMENT "OLAP"
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
  "replication_num" = "1"
);
```
- index_type: `hnsw`は[Hierarchical Navigable Small World algorithm](https://en.wikipedia.org/wiki/Hierarchical_navigable_small_world)を使用することを意味します
- metric_type: `l2_distance`は距離関数としてL2距離を使用することを意味します
- dim: `128`はベクトル次元が128であることを意味します
- quantizer: `flat`は各ベクトル次元が元のfloat32として保存されることを意味します

| パラメータ | 必須 | サポート/オプション | デフォルト | 説明 |
|-----------|----------|-------------------|---------|-------------|
| `index_type` | はい | hnsw のみ | (なし) | ANNインデックスアルゴリズム。現在はHNSWのみサポート。 |
| `metric_type` | はい | `l2_distance`, `inner_product` | (なし) | ベクトル類似度/距離メトリック。L2 = ユークリッド距離; inner_productはベクトルが正規化されている場合、コサイン距離を近似可能。 |
| `dim` | はい | 正の整数 (> 0) | (なし) | ベクトル次元。インポートされるすべてのベクトルが一致する必要があり、そうでなければエラーが発生します。 |
| `max_degree` | いいえ | 正の整数 | `32` | HNSW M（ノードあたりの最大近傍数）。インデックスメモリと検索性能に影響します。 |
| `ef_construction` | いいえ | 正の整数 | `40` | HNSW efConstruction（構築時の候補キューサイズ）。大きくすると品質が向上しますが、構築が遅くなります。 |
| `quantizer` | いいえ | `flat`, `sq8`, `sq4`, `pq` | `flat` | ベクトルエンコーディング/量子化: `flat` = 生データ; `sq8`/`sq4` = スカラー量子化（8/4ビット）、`pq` = メモリ削減のためのプロダクト量子化。 |
| `pq_m` | 'quantizer=pq'の場合必須 | 正の整数 | (なし) | 使用するサブベクトル数を指定します（ベクトル次元dimはpq_mで割り切れる必要があります）。 |
| `pq_nbits` | 'quantizer=pq'の場合必須 | 正の整数 | (なし) | 各サブベクトルの表現に使用するビット数。faissではpq_nbitsは一般的に24以下である必要があります。 |

S3 TVFを介したインポート:

```sql
INSERT INTO sift_1M
SELECT *
FROM S3(
  "uri" = "https://selectdb-customers-tools-bj.oss-cn-beijing.aliyuncs.com/sift_database.tsv",
  "format" = "csv");

SELECT count(*) FROM sift_1M

+----------+
| count(*) |
+----------+
|  1000000 |
+----------+
```
`l2_distance_approximate` / `inner_product_approximate`を使用すると、ANNインデックスパスがトリガーされます。関数はインデックスの`metric_type`と正確に一致する必要があります（例：`metric_type=l2_distance` → `l2_distance_approximate`を使用、`metric_type=inner_product` → `inner_product_approximate`を使用）。順序について：L2は距離の昇順を使用（小さいほど近い）、inner productはスコアの降順を使用（大きいほど近い）します。

```sql
SELECT id,
       l2_distance_approximate(
        embedding,
        [0,11,77,24,3,0,0,0,28,70,125,8,0,0,0,0,44,35,50,45,9,0,0,0,4,0,4,56,18,0,3,9,16,17,59,10,10,8,57,57,100,105,125,41,1,0,6,92,8,14,73,125,29,7,0,5,0,0,8,124,66,6,3,1,63,5,0,1,49,32,17,35,125,21,0,3,2,12,6,109,21,0,0,35,74,125,14,23,0,0,6,50,25,70,64,7,59,18,7,16,22,5,0,1,125,23,1,0,7,30,14,32,4,0,2,2,59,125,19,4,0,0,2,1,6,53,33,2]
       ) AS distance
FROM sift_1M
ORDER BY distance
LIMIT 10;
--------------

+--------+----------+
| id     | distance |
+--------+----------+
| 178811 | 210.1595 |
| 177646 | 217.0161 |
| 181997 | 218.5406 |
| 181605 | 219.2989 |
| 821938 | 221.7228 |
| 807785 | 226.7135 |
| 716433 | 227.3148 |
| 358802 | 230.7314 |
| 803100 | 230.9112 |
| 866737 | 231.6441 |
+--------+----------+
10 rows in set (0.02 sec)
```
正確なground truthと比較するには、`l2_distance`または`inner_product`（`_approximate`接尾辞なし）を使用します。この例では、完全検索には約290ミリ秒かかります：

```
10 rows in set (0.29 sec)
```
ANNインデックスを使用すると、この例ではクエリレイテンシが約290msから約20msに短縮されます。

ANNインデックスはセグメント粒度で構築されます。分散テーブルでは、各セグメントがローカルTopNを返し、その後TopNオペレータがタブレットとセグメント間で結果をマージしてグローバルTopNを生成します。

順序に関する注意事項：
- `metric_type = l2_distance`の場合、距離が小さいほど近いベクトル → `ORDER BY dist ASC`を使用します。
- `metric_type = inner_product`の場合、値が大きいほど近いベクトル → インデックス経由でTopNを取得するには`ORDER BY dist DESC`を使用します。

## 近似範囲検索

一般的なTopN近傍探索（最も近いN件のレコードを返す）に加えて、もう一つの典型的なパターンは閾値ベースの範囲検索です。固定数の結果を返す代わりに、ターゲットベクトルまでの距離が述語（>、>=、<、<=）を満たすすべての点を返します。例えば、距離が閾値より大きいまたは小さいベクトルが必要な場合があります。これは「十分に類似した」または「十分に異なった」候補が必要な場合に有用です。推薦システムでは、多様性を向上させるために近いが同一ではないアイテムを取得することがあり、異常検知では正常分布から離れた点を探します。

SQLの例：

```sql
SELECT count(*)
FROM   sift_1M
WHERE  l2_distance_approximate(
        embedding,
        [0,11,77,24,3,0,0,0,28,70,125,8,0,0,0,0,44,35,50,45,9,0,0,0,4,0,4,56,18,0,3,9,16,17,59,10,10,8,57,57,100,105,125,41,1,0,6,92,8,14,73,125,29,7,0,5,0,0,8,124,66,6,3,1,63,5,0,1,49,32,17,35,125,21,0,3,2,12,6,109,21,0,0,35,74,125,14,23,0,0,6,50,25,70,64,7,59,18,7,16,22,5,0,1,125,23,1,0,7,30,14,32,4,0,2,2,59,125,19,4,0,0,2,1,6,53,33,2])
        > 300 
--------------

+----------+
| count(*) |
+----------+
|   999271 |
+----------+
1 row in set (0.19 sec)
```
これらの範囲ベースのベクトル検索もANNインデックスによって高速化されます：インデックスがまず候補を絞り込み、その後近似距離が計算されることで、コストを削減し、レイテンシを改善します。サポートされる述語：`>`、`>=`、`<`、`<=`。

## Compound Search

Compound Searchは、同じSQL文内でANN TopN検索と範囲述語を組み合わせ、距離制約も満たすTopN結果を返します。

```sql
SELECT id,
       l2_distance_approximate(
        embedding, [0,11,77,24,3,0,0,0,28,70,125,8,0,0,0,0,44,35,50,45,9,0,0,0,4,0,4,56,18,0,3,9,16,17,59,10,10,8,57,57,100,105,125,41,1,0,6,92,8,14,73,125,29,7,0,5,0,0,8,124,66,6,3,1,63,5,0,1,49,32,17,35,125,21,0,3,2,12,6,109,21,0,0,35,74,125,14,23,0,0,6,50,25,70,64,7,59,18,7,16,22,5,0,1,125,23,1,0,7,30,14,32,4,0,2,2,59,125,19,4,0,0,2,1,6,53,33,2]) as dist
FROM sift_1M
WHERE l2_distance_approximate(
        embedding, [0,11,77,24,3,0,0,0,28,70,125,8,0,0,0,0,44,35,50,45,9,0,0,0,4,0,4,56,18,0,3,9,16,17,59,10,10,8,57,57,100,105,125,41,1,0,6,92,8,14,73,125,29,7,0,5,0,0,8,124,66,6,3,1,63,5,0,1,49,32,17,35,125,21,0,3,2,12,6,109,21,0,0,35,74,125,14,23,0,0,6,50,25,70,64,7,59,18,7,16,22,5,0,1,125,23,1,0,7,30,14,32,4,0,2,2,59,125,19,4,0,0,2,1,6,53,33,2])
        > 300
ORDER BY dist limit 10
--------------

+--------+----------+
| id     | dist     |
+--------+----------+
| 243590 |  300.005 |
| 549298 | 300.0317 |
| 429685 | 300.0533 |
| 690172 | 300.0916 |
| 123410 | 300.1333 |
| 232540 | 300.1649 |
| 547696 | 300.2066 |
| 855437 | 300.2782 |
| 589017 | 300.3048 |
| 930696 | 300.3381 |
+--------+----------+
10 rows in set (0.12 sec)
```
重要な問題は、述語フィルタリングがTopNの前に実行されるか後に実行されるかです。述語が最初にフィルタリングしてからTopNが削減されたセットに適用される場合は事前フィルタリングです。それ以外の場合は事後フィルタリングです。事後フィルタリングはより高速になる可能性がありますが、リコールを大幅に減少させる可能性があります。Dorisはリコールを保持するために事前フィルタリングを使用します。

Dorisはインデックスを使用して両方のフェーズを高速化できます。ただし、最初のフェーズ（範囲フィルタ）の選択性が高すぎる場合、両方のフェーズのインデックス化はリコールを損なう可能性があります。Dorisは述語の選択性とインデックスタイプに基づいて、インデックスを2回使用するかどうかを適応的に決定します。

## 追加フィルタを使用したANN検索

これは、ANN TopNの前に他の述語を適用し、それらの制約の下でTopNを返すことを指します。

8次元の小さなベクトルとテキストフィルタを使用した例：

```sql
CREATE TABLE ann_with_fulltext (
  id int NOT NULL,
  embedding array<float> NOT NULL,
  comment String NOT NULL,
  value int NULL,
  INDEX idx_comment(`comment`) USING INVERTED PROPERTIES("parser" = "english") COMMENT 'inverted index for comment',
  INDEX ann_embedding(`embedding`) USING ANN PROPERTIES("index_type"="hnsw","metric_type"="l2_distance","dim"="8")
) DUPLICATE KEY (`id`) 
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES("replication_num"="1");
```
サンプルデータを挿入し、`comment`に"music"が含まれる行のみを検索する：

```sql
INSERT INTO ann_with_fulltext VALUES
(1, [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8], 'this is about music', 10),
(2, [0.2,0.1,0.5,0.3,0.9,0.4,0.7,0.1], 'sports news today',   20),
(3, [0.9,0.8,0.7,0.6,0.5,0.4,0.3,0.2], 'latest music trend',  30),
(4, [0.05,0.06,0.07,0.08,0.09,0.1,0.2,0.3], 'politics update',40);

SELECT id, comment,
       l2_distance_approximate(embedding, [0.1,0.1,0.2,0.2,0.3,0.3,0.4,0.4]) AS dist
FROM ann_with_fulltext
WHERE comment MATCH_ANY 'music'       -- Filter using inverted index
ORDER BY dist ASC                     -- Ann topn calculation after predicates evaluate.
LIMIT 2;

+------+---------------------+----------+
| id   | comment             | dist     |
+------+---------------------+----------+
|    1 | this is about music | 0.663325 |
|    3 | latest music trend  | 1.280625 |
+------+---------------------+----------+
2 rows in set (0.04 sec)
```
TopNがベクトルインデックス経由で高速化されることを保証するため、すべての述語列には適切なセカンダリインデックス（例：転置インデックス）が必要です。

## ANN検索に関連するセッション変数

HNSWのビルド時パラメータに加えて、セッション変数を通じて検索時パラメータを渡すことができます：

- hnsw_ef_search: EF検索パラメータ。候補キューの最大長を制御します；大きいほど精度が高くなりますが、レイテンシも高くなります。デフォルトは32です。
- hnsw_check_relative_distance: 精度を向上させるために相対距離チェックを有効にするかどうか。デフォルトはtrueです。
- hnsw_bounded_queue: パフォーマンスを最適化するために有界優先キューを使用するかどうか。デフォルトはtrueです。

## ベクトル量子化

FLATエンコーディングでは、HNSWインデックス（生ベクトル+グラフ構造）が大量のメモリを消費する場合があります。HNSWが機能するためには完全にメモリに常駐する必要があるため、大規模スケールではメモリがボトルネックになる可能性があります。

スカラー量子化（SQ）はfloat32ストレージを圧縮してメモリを削減します。積量子化（PQ）は高次元ベクトルをより小さなサブベクトルに圧縮し、各サブベクトルを独立して量子化することでメモリオーバーヘッドを削減します。スカラー量子化について、Dorisは現在2つのスカラー量子化スキームをサポートしています：INT8とINT4（SQ8 / SQ4）。SQ8を使用した例：

```sql
CREATE TABLE sift_1M (
  id int NOT NULL,
  embedding array<float>  NOT NULL  COMMENT "",
  INDEX ann_index (embedding) USING ANN PROPERTIES(
      "index_type"="hnsw",
      "metric_type"="l2_distance",
      "dim"="128",
      "quantizer"="sq8"
  )
) ENGINE=OLAP
DUPLICATE KEY(id) COMMENT "OLAP"
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
  "replication_num" = "1"
);
```
768次元のCohere-MEDIUM-1MおよびCohere-LARGE-10Mデータセットにおいて、SQ8はFLATと比較してインデックスサイズを約3分の1に削減します。

| Dataset | Dim | Storage/Index Scheme | Total Disk | Data Part | Index Part | Notes |
|---------|-----|----------------------|------------|-----------|------------|-------|
| Cohere-MEDIUM-1M | 768D | Doris (FLAT) | 5.647 GB (2.533 + 3.114) | 2.533 GB | 3.114 GB | 1M vectors |
| Cohere-MEDIUM-1M | 768D | Doris SQ INT8 | 3.501 GB (2.533 + 0.992) | 2.533 GB | 0.992 GB | INT8 symmetric quantization |
| Cohere-MEDIUM-1M | 768D | Doris PQ(pq_m=384,pq_nbits=8)   | 3.149 GB (2.535 + 0.614) | 2.535 GB | 0.614 GB | product quantization |
| Cohere-LARGE-10M | 768D | Doris (FLAT) | 56.472 GB (25.328 + 31.145) | 25.328 GB | 31.145 GB | 10M vectors |
| Cohere-LARGE-10M | 768D | Doris SQ INT8 | 35.016 GB (25.329 + 9.687) | 25.329 GB | 9.687 GB | INT8 quantization |

量子化は、各距離計算で量子化された値をデコードする必要があるため、追加のビルド時間のオーバーヘッドをもたらします。128次元ベクトルの場合、ビルド時間は行数とともに増加し、SQはFLATと比較してビルドが最大約10倍遅くなる可能性があります。

同様に、Dorisはproduct quantizationもサポートしていますが、PQを使用する場合は追加のパラメータを提供する必要があることに注意してください：

- `pq_m`：元の高次元ベクトルを分割するサブベクトルの数を示します（ベクトル次元dimは`pq_m`で割り切れる必要があります）。
- `pq_nbits`：各サブベクトル量子化のビット数を示し、各サブスペースコードブックのサイズを決定します。faissでは`pq_nbits`は一般的に24以下である必要があります。

PQ量子化は訓練中に十分なデータを必要とし、訓練ポイントの数はクラスタ数以上である必要があることに注意してください（n >= 2 ^ pq_nbits）。

```sql
CREATE TABLE sift_1M (
  id int NOT NULL,
  embedding array<float>  NOT NULL  COMMENT "",
  INDEX ann_index (embedding) USING ANN PROPERTIES(
      "index_type"="hnsw",
      "metric_type"="l2_distance",
      "dim"="128",
      "quantizer"="pq",    -- Specify using PQ for quantization
      "pq_m"="2",          -- Required when using PQ, indicates splitting high-dimensional vector into pq_m low-dimensional sub-vectors
      "pq_nbits"="2"       -- Required when using PQ, indicates the number of bits for each subspace codebook
  )
) ENGINE=OLAP
DUPLICATE KEY(id) COMMENT "OLAP"
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
  "replication_num" = "1"
);
```
![ANN-SQ-BUILD_COSTS](/images/ann-index-quantization-build-time.jpg)

## パフォーマンスチューニング

ベクトル検索は典型的なセカンダリインデックスのポイントルックアップシナリオです。高QPSと低レイテンシーのためには、以下を検討してください：

チューニングにより、ハードウェア FE 32C 64GB + BE 32C 64GB において、Dorisは3000+ QPS（データセット：Cohere-MEDIUM-1M）を実現できます。

### クエリパフォーマンス

| 同時実行数 | スキーム | QPS | 平均レイテンシー (s) | P99 (s) | CPU使用率 | Recall |
|-------------|--------|-----|-----------------|---------|-----------|--------|
| 240 | Doris | 3340.4399 | 0.071368168 | 0.163399825 | 40% | 91.00% |
| 240 | Doris SQ INT8 | 3188.6359 | 0.074728852 | 0.160370195 | 40% | 88.26% |
| 240 | Doris SQ INT4 | 2818.2291 | 0.084663868 | 0.174826815 | 43% | 80.38% |
| 240 | Doris brute force | 3.6787 | 25.554878826 | 29.363227973 | 100% | 100.00% |
| 480 | Doris | 4155.7220 | 0.113387271 | 0.261086075 | 60% | 91.00% |
| 480 | Doris SQ INT8 | 3833.1130 | 0.123040214 | 0.276912867 | 50% | 88.26% |
| 480 | Doris SQ INT4 | 3431.0538 | 0.137636995 | 0.281631249 | 57% | 80.38% |
| 480 | Doris brute force | 3.6787 | 25.554878826 | 29.363227973 | 100% | 100.00% |

### Prepared Statementの使用

現代の埋め込みモデルは、768次元以上のベクトルを出力することが多くあります。768次元のリテラルをSQLにインライン化すると、解析時間が実行時間を上回る可能性があります。Prepared Statementを使用してください。現在DorisはMySQL clientのprepareコマンドを直接サポートしていないため、JDBCを使用してください：

1. JDBC URLでサーバーサイドPrepared Statementを有効化：  
   `jdbc:mysql://127.0.0.1:9030/demo?useServerPrepStmts=true`
2. プレースホルダー（`?`）でPreparedStatementを使用し、再利用する。

### セグメント数の削減

ANNインデックスはセグメントごとに構築されます。セグメント数が多すぎるとオーバーヘッドが発生します。理想的には、各tabletでANNインデックス付きテーブルに対して最大約5セグメントにするべきです。`be.conf`の`write_buffer_size`と`vertical_compaction_max_segment_size`を調整してください（例：両方を10737418240に）。

### Rowset数の削減

セグメントを削減するのと同じ動機：スケジューリングのオーバーヘッドを最小化します。各ロードがrowsetを作成するため、バッチ取り込みにはstream loadまたは`INSERT INTO SELECT`を推奨します。

### ANNインデックスをメモリに保持

現在のANNアルゴリズムはメモリベースです。セグメントのインデックスがメモリにない場合、ディスクI/Oが発生します。`be.conf`で`enable_segment_cache_prune=false`を設定してANNインデックスを常駐させてください。

### parallel_pipeline_task_num = 1

ANN TopNクエリは各スキャナーから非常に少ない行を返すため、高いパイプラインタスクの並列性は不要です。`parallel_pipeline_task_num = 1`を設定してください。

### enable_profile = false

超低レイテンシーが要求されるクエリに対してクエリプロファイリングを無効化してください。

## Python SDK

AIの時代において、Pythonはデータ処理とインテリジェントアプリケーション開発の主流言語となっています。開発者がPython環境でDorisのベクトル検索機能をより簡単に使用できるように、一部のコミュニティ貢献者がDoris用のPython SDKを開発しました。

* https://github.com/uchenily/doris_vector_search: ベクトル距離検索に最適化されており、現在利用可能な最高性能のDorisベクトル検索Python SDKです。

## 使用制限

1. ANNインデックス列は`NOT NULL`の`Array<Float>`である必要があり、インポートされるすべてのベクトルは宣言された`dim`と一致する必要があります。そうでなければエラーが投げられます。
2. ANNインデックスはDuplicateKeyテーブルモデルでのみサポートされています。
3. Dorisはpre-filterセマンティクス（ANN TopNの前に述語が適用される）を使用します。述語に行を正確に特定できるセカンダリインデックスがない列（例：転置インデックスなし）が含まれる場合、Dorisは正確性を保つためにbrute forceにフォールバックします。
   例：

   ```sql
   SELECT id, l2_distance_approximate(embedding, [xxx]) AS distance
   FROM sift_1M
   WHERE round(id) > 100
   ORDER BY distance LIMIT 10;
   ```
`id`はキーですが、セカンダリインデックス（転置インデックスなど）がない場合、その述語はインデックス解析後に適用されるため、Dorisはプリフィルターセマンティクスを満たすためにブルートフォースにフォールバックします。

4. SQLの距離関数がインデックスDDLで定義されたmetric typeと一致しない場合、`l2_distance_approximate` / `inner_product_approximate`を呼び出してもDorisはTopNにANNインデックスを使用できません。
5. metric type `inner_product`の場合、`ORDER BY inner_product_approximate(...) DESC LIMIT N`（DESCが必須）のみがANNインデックスによって高速化できます。
6. `xxx_approximate()`の第一パラメータはColumnArrayである必要があり、第二パラメータはCASTまたはArrayLiteralである必要があります。これらを逆にするとブルートフォース検索がトリガーされます。
