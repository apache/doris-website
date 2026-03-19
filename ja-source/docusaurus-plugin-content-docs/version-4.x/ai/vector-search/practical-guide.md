---
{
  "title": "実践ガイド",
  "language": "ja",
  "description": "Apache Doris ANN ベクトル検索の実践ガイド：テーブル設計、インデックス作成、データロード、インデックス構築、クエリチューニング、およびトラブルシューティング。"
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

このガイドは、スキーマ設計からチューニングとトラブルシューティングまで、Apache Doris ANNベクトル検索の本番環境向けワークフローを提供します。

## 1. スコープと典型的なシナリオ

Apache Doris 4.xは、以下のようなシナリオにおいて高次元ベクトルのANNインデックスをサポートします：

- セマンティック検索
- RAG検索
- レコメンデーション
- 画像またはマルチモーダル検索
- 外れ値検出

サポートされているインデックスタイプ：

- `hnsw`: 高い再現率とオンラインクエリパフォーマンス
- `ivf`: より少ないメモリと大規模ケースでの高速ビルド

サポートされている近似距離関数：

- `l2_distance_approximate` (`ORDER BY ... ASC`)
- `inner_product_approximate` (`ORDER BY ... DESC`)

コサインに関する注意：

- ANNインデックスは`metric_type="cosine"`を直接サポートしません。
- コサインベースの検索には、まずベクトルを正規化してから、`inner_product`を使用してください。

## 2. 前提条件と制約

ANNインデックスを使用する前に、以下を確認してください：

1. Dorisバージョン：`>= 4.0.0`
2. テーブルモデル：ANNでは`DUPLICATE KEY`のみサポート
3. ベクトル列：`ARRAY<FLOAT> NOT NULL`である必要があります
4. 次元の一貫性：入力ベクトルの次元はインデックスの`dim`と一致する必要があります

テーブルモデルの例：

```sql
CREATE TABLE document_vectors (
  id BIGINT NOT NULL,
  embedding ARRAY<FLOAT> NOT NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 8
PROPERTIES ("replication_num" = "1");
```
## 2.1 Doris ANNでのコサイン類似度の使用

ランキングメトリックがコサイン類似度の場合は、次のパターンを使用してください：

1. 取り込み前にすべてのベクトルを単位長に正規化する。
2. `metric_type="inner_product"`でANNインデックスを構築する。
3. `inner_product_approximate(...)`と`ORDER BY ... DESC`でクエリを実行する。

理由：

- `cos(x, y) = (x · y) / (||x|| ||y||)`
- 正規化後は`||x|| = ||y|| = 1`となるため、`cos(x, y) = x · y`

これがDoris ANNで内積を通じてコサインランキングを実装できる理由です。

## 3. エンドツーエンドワークフロー

### ステップ1：テーブル作成

以下の2つのパターンから選択できます：

1. テーブル作成時にANNインデックスを定義する。
   - インデックスは取り込み中に構築される。
   - ロード後のクエリまでの時間が短縮される。
   - 取り込みスループットが低下する。
2. 最初にテーブルを作成し、後で`CREATE INDEX`と`BUILD INDEX`を実行する。
   - 大量バッチインポートに適している。
   - コンパクションと構築タイミングをより細かく制御できる。

例（`CREATE TABLE`でインデックスを定義）：

```sql
CREATE TABLE document_vectors (
  id BIGINT NOT NULL,
  title VARCHAR(500),
  content TEXT,
  category VARCHAR(100),
  embedding ARRAY<FLOAT> NOT NULL,
  INDEX idx_embedding (embedding) USING ANN PROPERTIES (
    "index_type" = "hnsw",
    "metric_type" = "l2_distance",
    "dim" = "768"
  )
)
ENGINE = OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 8
PROPERTIES ("replication_num" = "1");
```
### ステップ2: ANNインデックスを設定する

共通プロパティ:

- `index_type`: `hnsw` または `ivf`
- `metric_type`: `l2_distance` または `inner_product`
- `dim`: ベクトル次元
- `quantizer`: `flat`、`sq8`、`sq4`、`pq` (オプション)

HNSW固有:

- `max_degree` (デフォルト `32`)
- `ef_construction` (デフォルト `40`)

IVF固有:

- `nlist` (デフォルト `1024`)

例:

```sql
CREATE INDEX idx_embedding ON document_vectors (embedding) USING ANN PROPERTIES (
  "index_type" = "hnsw",
  "metric_type" = "l2_distance",
  "dim" = "768",
  "max_degree" = "64",
  "ef_construction" = "128"
);
```
### ステップ 3: データの読み込み

バルクワークロードの推奨順序:

1. テーブルを作成（ANN indexなし、または`BUILD INDEX`なし）
2. データをバッチでインポート（Stream Load、S3 TVF、またはSDK）
3. インデックス構築をトリガー

本番環境では、Stream LoadやSDKバッチインサートなどのバッチ読み込み手法を使用することを推奨します。

### ステップ 4: インデックスの構築と監視

テーブル作成後にインデックスが作成される場合は、手動で`BUILD INDEX`を実行してください:

```sql
BUILD INDEX idx_embedding ON document_vectors;
SHOW BUILD INDEX WHERE TableName = "document_vectors";
```
ビルド状態には`PENDING`、`RUNNING`、`FINISHED`、`CANCELLED`が含まれます。

## 4. クエリパターン

### TopN検索

```sql
SELECT id, title,
       l2_distance_approximate(embedding, [0.1, 0.2, ...]) AS dist
FROM document_vectors
ORDER BY dist
LIMIT 10;
```
### 範囲検索

```sql
SELECT id, title
FROM document_vectors
WHERE l2_distance_approximate(embedding, [0.1, 0.2, ...]) < 0.5;
```
### フィルターを使用した検索

```sql
SELECT id, title,
       l2_distance_approximate(embedding, [0.1, 0.2, ...]) AS dist
FROM document_vectors
WHERE category = 'AI'
ORDER BY dist
LIMIT 10;
```
Dorisはベクトル検索プランで事前フィルタリングを使用しており、これにより混合フィルタシナリオでのリコールを保持できます。

## 5. チューニングチェックリスト

### クエリ側パラメータ

- HNSW: `hnsw_ef_search`（高リコール vs 高レイテンシ）
- IVF: `nprobe`（または`ivf_nprobe`、バージョン/セッション変数による）

例:

```sql
SET hnsw_ef_search = 100;
SET nprobe = 128;
SET optimize_index_scan_parallelism = true;
```
### ビルド側の推奨事項

1. 大規模データセットでは最終インデックス構築前にcompactionを実行する。
2. 高いrecallを目標とする場合は過大なセグメントを避ける。
3. 同一データセットで複数のパラメータグループ（`max_degree`、`ef_construction`、`ef_search`）をベンチマークする。

### キャパシティプランニング

実用的なベースラインとして、`dim * 4 bytes * row_count`でベクターメモリを推定し、ANN構造のオーバーヘッドを加算して、非ベクターカラムと実行operatorのためのメモリ余裕を確保する。  
10M/100Mスケールでのシングルノードおよび分散サイジングリファレンスについては、[Large-scale Performance Benchmark](./performance-large-scale.md)を参照。

## 6. Index Operations

一般的な管理SQL:

```sql
SHOW INDEX FROM document_vectors;
SHOW DATA ALL FROM document_vectors;
ALTER TABLE document_vectors DROP INDEX idx_embedding;
```
インデックスパラメータを変更する場合は、drop-and-recreateワークフローを使用してから、インデックスを再構築してください。

## 7. トラブルシューティング

### インデックスが使用されない

確認事項：

1. インデックスが存在する：`SHOW INDEX`
2. ビルドが完了している：`SHOW BUILD INDEX`
3. 正しい関数：`_approximate`関数を使用する

### 低いrecall

確認事項：

- HNSWパラメータ（`max_degree`、`ef_construction`、`hnsw_ef_search`）
- IVFプローブパラメータ（`nprobe`/`ivf_nprobe`）
- セグメントサイズとpost-compaction後の再構築

### 高いレイテンシ

確認事項：

- コールドクエリとウォームクエリの動作（インデックスロード）
- 過度に大きな`hnsw_ef_search`
- 並列スキャン設定
- BEメモリ圧迫

### データインポートエラー

一般的な原因：

- 次元の不一致（`dim`と実際のデータ）
- nullベクトル値
- 無効な配列形式

## 8. Hybrid Searchパターン

同じテーブルでANNと転置インデックスの両方を定義し、テキスト述語でフィルタリングしてベクトル距離で順序付けすることで、ANNとテキスト検索を組み合わせることができます。これは本番環境のRAGパイプラインでよく使われるアプローチです。
