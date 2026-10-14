---
{
    "title": "ベクトルインデックス実践ガイド",
    "sidebar_label": "実践ガイド",
    "language": "ja",
    "description": "Apache Doris のベクトルインデックス（ANN）実践ガイド。テーブル作成、インデックス作成、データ取り込み、クエリ、チューニング、トラブルシューティングまでを網羅した運用ガイドです。",
    "keywords": [
        "Doris ベクトルインデックス",
        "ANN インデックス",
        "HNSW",
        "IVF",
        "ベクトル検索",
        "ベクトルサーチ",
        "セマンティック検索",
        "RAG",
        "コサイン類似度",
        "ベクトル検索の再現率",
        "BUILD INDEX"
    ]
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

<!-- Knowledge type: Operational guide / End-to-end workflow -->
<!-- Applicable scenarios: Launching vector retrieval / Performance tuning / Troubleshooting -->

このドキュメントは、Apache Doris でベクトル検索（ANN）を導入するユーザー向けです。テーブル設計からクエリのチューニング、トラブルシューティングまで、一連の運用手順を説明します。セマンティック検索、RAG、レコメンデーションの候補検索を Doris に移行することを検討している場合は、このドキュメントの手順に沿って進められます。

## クイックナビゲーション {#quick-navigation}

| やりたいこと | 参照先 |
|---|---|
| Doris のバージョンとテーブルモデルが要件を満たすか確認する | [前提条件と制限事項](#prerequisites-and-limitations) |
| HNSW インデックスと IVF インデックスのどちらを使うか選ぶ | [適用シナリオとインデックスの選択](#applicable-scenarios-and-index-selection) |
| テーブル作成 → データ取り込み → クエリまでの全手順を実行する | [一連の運用手順](#end-to-end-operational-workflow) |
| コサイン類似度でソートする | [コサイン類似度の使用](#using-cosine-similarity) |
| 再現率を高める、またはレイテンシを下げる | [クエリとビルドのチューニング](#query-and-build-tuning) |
| インデックスが効かない、再現率が低い、データ取り込みに失敗するといった問題を調査する | [よくある問題のトラブルシューティング](#common-troubleshooting) |

---

## 適用シナリオとインデックスの選択 {#applicable-scenarios-and-index-selection}

<!-- Knowledge type: Architectural selection decision -->

Apache Doris 4.x 以降では、ANN（Approximate Nearest Neighbor、近似最近傍）ベクトルインデックスをサポートします。一般的な導入シナリオは次のとおりです。

- セマンティック検索
- RAG の検索拡張
- レコメンデーションシステムの候補検索
- 画像検索またはマルチモーダル検索
- 異常検知

### インデックスタイプの比較 {#index-type-comparison}

| インデックスタイプ | 再現率 | オンラインクエリの性能 | ビルド速度 | メモリ使用量 | 適したシナリオ |
|---|---|---|---|---|---|
| `hnsw` | 高い | 良好 | 遅い | 多い | 低レイテンシのオンライン検索 |
| `ivf` | 中程度 | より良好 | 速い | より効率的 | 大規模データセット |
| `ivf_on_disk` | 中程度 | 中程度 | 速い | 最も効率的 | 超大規模、メモリに制約がある環境 |

### サポートされる距離関数 {#supported-distance-functions}

| 関数 | ソート順 | 説明 |
|---|---|---|
| `l2_distance_approximate` | `ORDER BY ... ASC` | ユークリッド距離。距離が小さいほど類似度が高い |
| `inner_product_approximate` | `ORDER BY ... DESC` | 内積。値が大きいほど類似度が高い |

> コサイン類似度を `metric_type="cosine"` で直接設定することはできません。ベクトルを正規化し、内積を使用して実現します。詳しくは[コサイン類似度の使用](#using-cosine-similarity)を参照してください。

---

## 前提条件と制限事項 {#prerequisites-and-limitations}

<!-- Knowledge type: Environment requirements -->
<!-- Applicable scenarios: Pre-deployment check -->

ANN インデックスを使用する前に、次の条件を確認してください。

| 確認項目 | 要件 |
|---|---|
| Doris のバージョン | `>= 4.0.0` |
| テーブルモデル | `DUPLICATE KEY`。`UNIQUE KEY` では Merge-on-Write を有効にする必要がある（バージョン 4.1.4 以降でサポート） |
| ベクトル列の型 | `ARRAY<FLOAT> NOT NULL` |
| 次元数の一致 | 取り込むベクトルの次元数がインデックスの `dim` と一致すること |

最小構成のテーブル作成例：

```sql
CREATE TABLE document_vectors (
    id BIGINT NOT NULL,
    embedding ARRAY<FLOAT> NOT NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 8
PROPERTIES ("replication_num" = "1");
```

---

## 一連の運用手順 {#end-to-end-operational-workflow}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: First-time deployment of vector retrieval -->

一連の手順は、テーブル作成 → インデックス設定 → データ取り込み → インデックスのビルドと監視の 4 ステップです。

### ステップ 1：ベクトルテーブルを作成する {#step-1-create-the-vector-table}

テーブルの作成方法は二通りあります。データ規模と取り込み方法に応じて選択してください。

| 方法 | 利点 | 欠点 | 推奨シナリオ |
|---|---|---|---|
| テーブル作成時に ANN インデックスを直接定義する | データを書き込むとすぐにクエリ可能 | データ取り込みが遅くなる | 小規模データ、ストリーミング取り込み |
| テーブル作成とデータ取り込みを先に行い、その後 `CREATE INDEX` と `BUILD INDEX` を実行する | データ取り込みが速く、ビルド時期を制御できる | ビルド手順が追加で必要 | 大規模なバッチ取り込み |

テーブル作成時に ANN インデックスを直接定義する例：

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

### ステップ 2：ベクトルインデックスのパラメータを設定する {#step-2-configure-vector-index-parameters}

<!-- Knowledge type: Configuration parameters -->

共通パラメータ：

| パラメータ | 値 | 説明 |
|---|---|---|
| `index_type` | `hnsw` / `ivf` / `ivf_on_disk` | インデックスタイプ |
| `metric_type` | `l2_distance` / `inner_product` | 距離尺度 |
| `dim` | 整数 | ベクトルの次元数 |
| `quantizer` | `flat` / `sq8` / `sq4` / `pq` | 量子化方式（省略可能） |

HNSW 固有のパラメータ：

| パラメータ | デフォルト | 説明 |
|---|---|---|
| `max_degree` | `32` | ノードあたりの近傍ノードの最大数 |
| `ef_construction` | `40` | ビルド時の探索幅 |

IVF 固有のパラメータ（`ivf` と `ivf_on_disk` で共通）：

| パラメータ | デフォルト | 説明 |
|---|---|---|
| `nlist` | `1024` | クラスタの重心数 |

テーブル作成後にインデックスを作成する例：

```sql
CREATE INDEX idx_embedding ON document_vectors (embedding) USING ANN PROPERTIES (
    "index_type" = "hnsw",
    "metric_type" = "l2_distance",
    "dim" = "768",
    "max_degree" = "64",
    "ef_construction" = "128"
);
```

### ステップ 3：データを取り込む {#step-3-ingest-data}

バッチ取り込みでは、次の順序を推奨します。

1. テーブルを作成する。この時点では**インデックスをビルドしない**
2. データをバッチで書き込む（Stream Load / S3 TVF / SDK）
3. データ取り込み完了後にインデックスをまとめてビルドする

本番環境では、このバッチ方式を推奨します。データ取り込み時間を大幅に短縮できます。

### ステップ 4：インデックスをビルドして監視する {#step-4-build-the-index-and-monitor}

データ取り込み後にインデックスを作成する方法を選んだ場合は、ビルドを手動で開始する必要があります。

```sql
BUILD INDEX idx_embedding ON document_vectors;

SHOW BUILD INDEX WHERE TableName = "document_vectors";
```

ビルドの状態には、`PENDING`、`RUNNING`、`FINISHED`、`CANCELLED` があります。

---

## クエリのパターン {#query-patterns}

<!-- Knowledge type: Operational examples -->

### 上位 N 件の最近傍検索 {#topn-nearest-neighbor-search}

```sql
SELECT id, title,
       l2_distance_approximate(embedding, [0.1, 0.2, ...]) AS dist
FROM document_vectors
ORDER BY dist
LIMIT 10;
```

### 範囲検索 {#range-search}

```sql
SELECT id, title
FROM document_vectors
WHERE l2_distance_approximate(embedding, [0.1, 0.2, ...]) < 0.5;
```

### フィルタ条件を使うハイブリッド検索 {#hybrid-search-with-filter-conditions}

```sql
SELECT id, title,
       l2_distance_approximate(embedding, [0.1, 0.2, ...]) AS dist
FROM document_vectors
WHERE category = 'AI'
ORDER BY dist
LIMIT 10;
```

ハイブリッドフィルタリングでは、Doris は**事前フィルタリング**戦略を使用し、性能と再現率のバランスを取ります。

---

## コサイン類似度の使用 {#using-cosine-similarity}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Business metric is cosine -->

ANN インデックスでは `metric_type="cosine"` を直接設定できません。コサイン類似度でソートする必要がある場合は、次の方法を使用します。

1. データ取り込み前にベクトルを L2 正規化する（単位ベクトルに変換する）
2. ANN インデックスを作成するときに `metric_type="inner_product"` を使用する
3. クエリで `inner_product_approximate(...)` を使用し、`ORDER BY ... DESC` でソートする

**原理：**

- `cos(x, y) = (x · y) / (||x|| · ||y||)`
- 正規化後は `||x|| = ||y|| = 1` となるため、`cos(x, y) = x · y`

単位ベクトル空間では、コサイン類似度によるソートと内積によるソートは同等です。

---

## クエリとビルドのチューニング {#query-and-build-tuning}

<!-- Knowledge type: Performance tuning -->
<!-- Applicable scenarios: Recall not meeting requirements / Latency too high -->

### クエリパラメータ {#query-parameters}

| インデックスタイプ | チューニングパラメータ | 効果 |
|---|---|---|
| HNSW | `hnsw_ef_search` | 値を大きくすると再現率が高くなり、レイテンシも増える |
| IVF | `nprobe` または `ivf_nprobe`（バージョンによって異なる） | 値を大きくすると再現率が高くなる |

```sql
SET hnsw_ef_search = 100;
SET nprobe = 128;
SET optimize_index_scan_parallelism = true;
```

### ビルドに関する推奨事項 {#build-recommendations}

1. 大規模データでは、先に compaction を実行してから、最終的なインデックスのビルドを開始する
2. セグメントが大きすぎて再現率に影響しないよう、セグメントの規模を制御する
3. 同じデータセットを使い、複数のパラメータ設定で A/B ベンチマークを行う

### 容量の見積もり {#capacity-estimation}

- ベクトルのメモリ使用量の概算式：`dim * 4 bytes * row_count`
- これに ANN インデックス構造のオーバーヘッドを加える
- ベクトル以外の列と実行オペレーター用のメモリも確保する

単一ノードおよび分散デプロイでの 10M / 100M 規模の容量の目安については、[大規模性能テスト](./performance-large-scale.md)を参照してください。

---

## インデックスの管理 {#index-management}

<!-- Knowledge type: Operational commands -->

一般的な管理用 SQL：

```sql
-- View the index list
SHOW INDEX FROM document_vectors;

-- View data scale
SHOW DATA ALL FROM document_vectors;

-- Drop the index
ALTER TABLE document_vectors DROP INDEX idx_embedding;
```

インデックスのパラメータを調整する場合は、**既存のインデックスを削除して再ビルドする**ことを推奨します。

---

## よくある問題のトラブルシューティング {#common-troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting -->

### インデックスが効かない {#index-not-taking-effect}

次の順序で調査してください。

1. インデックスが存在するか：`SHOW INDEX` を実行する
2. インデックスのビルドが完了したか：`SHOW BUILD INDEX` を実行する
3. クエリで接尾辞が `_approximate` の距離関数を使用しているか

### 再現率が低い {#low-recall}

| 調査項目 | 推奨対処 |
|---|---|
| HNSW パラメータ | `max_degree`、`ef_construction`、`hnsw_ef_search` を大きくする |
| IVF の探索パラメータ | `nprobe` / `ivf_nprobe` を大きくする |
| セグメントの規模 | compaction 後にインデックスを再ビルドする |

### クエリのレイテンシが高い {#high-query-latency}

| 調査項目 | 推奨対処 |
|---|---|
| コールドクエリとウォームクエリの差 | インデックスの読み込み時間が異なる。サービス起動後にウォームアップできる |
| `hnsw_ef_search` が大きすぎる | 適切に小さくしてレイテンシを下げる |
| 並列スキャンが有効でない | `optimize_index_scan_parallelism = true` を設定する |
| BE のメモリ負荷 | BE のメモリ使用状況と GC の動作を確認する |

### データ取り込みに失敗する {#ingestion-failure}

| よくある原因 | 推奨対処 |
|---|---|
| 次元数の不一致 | 取り込むベクトルの次元数がインデックスの `dim` と一致することを確認する |
| ベクトル列に NULL が含まれる | アプリケーション側で NULL を補完するか除外する |
| ベクトル配列の形式が無効 | JSON / Stream Load のペイロード形式を検証する |

---

## FAQ {#faq}

<!-- Knowledge type: Frequently asked questions -->

**Q1：ANN インデックスは UNIQUE KEY テーブルや AGGREGATE KEY テーブルで使用できますか？**

バージョン 4.1.4 以降、ANN インデックスは **DUPLICATE KEY** モデルと、**Merge-on-Write** を有効にした **UNIQUE KEY** モデル（`enable_unique_key_merge_on_write = "true"`）をサポートします。Merge-on-Read の UNIQUE KEY テーブルと AGGREGATE KEY テーブルは、引き続きサポートされません。4.1.4 より前のバージョンでは、DUPLICATE KEY モデルのみをサポートします。

**Q2：ANN インデックスと転置インデックスを同時に作成できますか？**

はい。同じテーブルに ANN インデックスと転置インデックスの両方を作成できます。テキストのフィルタリングとベクトルによるソートを組み合わせることで、オンライン RAG で一般的な**ハイブリッド検索**を実現できます。

**Q3：コサイン類似度を使いたい場合はどうすればよいですか？**

ANN は `metric_type="cosine"` をサポートしません。ベクトルを正規化して `inner_product` を使用すると、同等の結果が得られます。詳しくは[コサイン類似度の使用](#using-cosine-similarity)を参照してください。

**Q4：BUILD INDEX が RUNNING のまま進まない場合はどうすればよいですか？**

`SHOW BUILD INDEX` で進捗を確認してください。大きなテーブルのビルド自体には時間がかかるため、まずビルドが正常に進行中か確認します。長時間進捗がない場合は、BE のメモリとディスクの状態を確認してください。

**Q5：ANN インデックスのパラメータはどう調整しますか？**

ANN インデックスのパラメータは、その場で変更できません。まず **DROP INDEX を実行し、新しいパラメータで CREATE INDEX を実行して**、最後に BUILD INDEX を実行することを推奨します。
