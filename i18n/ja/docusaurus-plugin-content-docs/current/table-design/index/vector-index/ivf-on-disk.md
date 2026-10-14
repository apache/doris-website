---
{
    "title": "IVF On-Disk",
    "language": "ja",
    "description": "Apache Doris の IVF On-Disk インデックスは転置リストをディスクに保存し、専用キャッシュを使用して大規模なベクトル検索に必要なメモリを削減します。",
    "keywords": [
        "IVF On-Disk",
        "Apache Doris ベクトルインデックス",
        "ANN インデックス",
        "ivf_on_disk",
        "ベクトル検索のメモリ最適化",
        "ivf_nprobe",
        "ann_index_ivf_list_cache_limit",
        "大規模ベクトル検索"
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

# Apache Doris の IVF On-Disk {#ivf-on-disk-in-apache-doris}

<!-- Knowledge type: Capability definition + Configuration parameters + Performance reference -->
<!-- Applicable scenarios: Large-scale vector retrieval / Constrained memory budget / ANN index selection -->

`ivf_on_disk` は、Apache Doris が大規模なベクトル検索（ANN）向けに提供するインデックスタイプです。IVF の転置リストの主要部分をディスクに保存し、必要に応じてアクセス頻度の高いデータを専用キャッシュに読み込みます。これにより、IVF の検索機能を維持しながら、常駐メモリの使用量を大幅に削減できます。

## クイックナビゲーション {#quick-navigation}

- `ivf_on_disk` が必要な理由については、[背景と目的](#background-and-goals)を参照してください。
- テーブル作成時の使い方については、[インデックス DDL](#1-index-ddl)と[クエリパラメータ](#2-query-parameters)を参照してください。
- メモリ使用量の制御については、[BE のキャッシュ設定](#3-be-cache-configuration)と[チューニングの推奨事項](#tuning-recommendations)を参照してください。
- 実際の性能を評価する際は、[性能の参考データ](#performance-reference-data)を参照してください。
- メモリ内 IVF との比較については、[IVF との比較](#comparison-with-ivf)を参照してください。

## 背景と目的 {#background-and-goals}

<!-- Knowledge type: Capability definition -->

ベクトルの規模が数千万件以上になると、すべてをメモリに保持する IVF インデックスのメモリコストは急増し、リソース上のボトルネックになります。`ivf_on_disk` の設計目標は次のとおりです。

- IVF のパラメータモデルと検索時の動作（`nlist` / `nprobe`）を維持する。
- インデックス全体をメモリに常駐させる方式から、ディスクと専用キャッシュを組み合わせる方式に切り替える。
- 既存の ANN 向け SQL の使い方や運用方法を引き続き利用できるようにする。

つまり、`ivf_on_disk` は主に、**メモリ予算に制約があり、それでも ANN による高速化が必要な**本番環境を対象としています。

## IVF との比較 {#comparison-with-ivf}

<!-- Knowledge type: Architecture selection decision -->

次の表は、`ivf_on_disk` を `ivf` より優先すべき場面の判断に役立ちます。

| 比較項目 | `ivf`（メモリ内） | `ivf_on_disk`（ディスク + キャッシュ） |
| --- | --- | --- |
| 転置リストの保存先 | すべてメモリ内 | 主にディスク上。必要に応じてキャッシュ経由で読み込む |
| メモリ使用量 | 多い。データ量に比例して増加する | 大幅に少ない。キャッシュの上限で明示的に制限できる |
| クエリレイテンシ | 最も低い | メモリ内 IVF よりやや高く、キャッシュヒット率の影響を受ける |
| パラメータモデル | `nlist` / `nprobe` | 同じ |
| クエリ関数 | ANN クエリ関数 | 同じ |
| 適した規模 | 小規模から中規模 | 数千万件以上 |
| 移行コスト | - | 低い。`index_type` の変更のみが必要 |

## ユーザーインターフェイス {#user-interface}

### 1) インデックス DDL {#1-index-ddl}

<!-- Knowledge type: Operational steps -->

`index_type="ivf_on_disk"` を指定して ANN インデックスを作成します。

```sql
CREATE TABLE vec_tbl (
    id BIGINT NOT NULL,
    embedding ARRAY<FLOAT> NOT NULL,
    INDEX idx_emb (embedding) USING ANN PROPERTIES (
        "index_type" = "ivf_on_disk",
        "metric_type" = "l2_distance",
        "dim" = "768",
        "nlist" = "1024"
    )
) ENGINE=OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 8
PROPERTIES ("replication_num" = "1");
```

主な注意点は次のとおりです。

- `ivf` と `ivf_on_disk` は、どちらも `nlist` の明示的な指定が必要です。
- `metric_type` は `l2_distance` と `inner_product` をサポートします。
- クエリ関数は同じで、`l2_distance_approximate` / `inner_product_approximate` を使用します。

### 2) クエリパラメータ {#2-query-parameters}

<!-- Knowledge type: Configuration parameters -->

`ivf_nprobe` は、IVF 系インデックスのクエリ実行時に引き続き最も重要なパラメータです。

```sql
SET ivf_nprobe = 64;
```

一般に、`nprobe` を大きくすると再現率は高くなりますが、その分クエリレイテンシも増加します。

### 3) BE のキャッシュ設定 {#3-be-cache-configuration}

<!-- Knowledge type: Configuration parameters -->

`ivf_on_disk` は、IVF の転置リスト用に専用キャッシュを導入します。関連する BE 設定は次のとおりです。

| 設定項目 | デフォルト | 説明 |
| --- | --- | --- |
| `ann_index_ivf_list_cache_limit` | `70%` | キャッシュの上限。割合の基準は BE プロセスが使用できるメモリ（`mem_limit` による制限を受ける）であり、マシン全体の物理メモリではありません。 |
| `ann_index_ivf_list_cache_stale_sweep_time_sec` | `3600` | キャッシュ内の古いエントリを削除する間隔。単位は秒です。 |

## 監視と分析 {#observability}

<!-- Knowledge type: Monitoring metrics -->
<!-- Applicable scenarios: Troubleshooting / Performance tuning -->

`ivf_on_disk` の性能上のボトルネックを特定するために、専用の Profile カウンターと BE メトリクスが用意されています。これらを使うと、現在のキャッシュサイズが適切かどうか、またレイテンシの主な原因がディスクのページフォールトか検索処理自体かを判断できます。

主な Profile フィールド：

- `AnnIvfOnDiskLoadCosts`
- `AnnIvfOnDiskCacheHitCnt`
- `AnnIvfOnDiskCacheMissCnt`

主な BE メトリクス：

- `ann_ivf_on_disk_fetch_page_costs_ms`
- `ann_ivf_on_disk_fetch_page_cnt`
- `ann_ivf_on_disk_search_costs_ms`
- `ann_ivf_on_disk_search_cnt`
- `ann_ivf_on_disk_cache_hit_cnt`
- `ann_ivf_on_disk_cache_miss_cnt`

## 使用上の注意 {#usage-notes}

<!-- Knowledge type: Usage constraints -->

- `ivf_on_disk` には、ベクトル列の型やインデックスパラメータの妥当性など、既存の ANN インデックスと共通する主な制約があります。
- 学習の品質と検索の精度は、引き続きデータ規模とパラメータ（`nlist`、`ivf_nprobe`）の組み合わせに依存します。
- `ivf_on_disk` は Stream Load などの一般的なデータ取り込み方法をサポートします。本番環境に導入する前に、実際の業務データで検証することを推奨します。

## 性能の参考データ {#performance-reference-data}

<!-- Knowledge type: Performance reference -->

次の表は、キャッシュのカバレッジ、メモリ使用量、レイテンシの実際のトレードオフを示す参考ベンチマークのスナップショットです。

| シナリオ | メモリ使用量（GB） | AnnIndexIVFListCache ヒット率 | 最大 QPS | Recall@100 | 平均レイテンシ（秒） | P99 レイテンシ（秒） | P95 レイテンシ（秒） |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 総当たり検索（インデックスなし） | - | - | 0.2922 | 0.0000 | 292.5394 | 307.9490 | 307.9442 |
| メモリ内 IVF | 32.0 | 100% | 71.8535 | 0.9598 | 0.4167 | 0.5623 | 0.5151 |
| OnDisk キャッシュ 100% | 32.0 | 100% | 72.3649 | 0.9599 | 0.8274 | 1.1236 | 1.0395 |
| OnDisk キャッシュ 79% | 22.0 | 70% | 45.0266 | 0.9599 | 1.9900 | 4.4059 | 3.3568 |
| OnDisk キャッシュ 60% | 16.7 | 55% | 38.3141 | 0.9599 | 2.3281 | 4.0063 | 3.5542 |

表の読み方：

- 再現率がほぼ同じ（約 0.96）場合、キャッシュを減らすとメモリ使用量は大幅に下がりますが、テールレイテンシは上がります。
- キャッシュのカバレッジが 100% に近づくと、`ivf_on_disk` はメモリ内 IVF に近い再現率を維持できますが、レイテンシはやや増加します。
- 本番環境では、ヒット率のメトリクスを継続的に監視し、その値を基に `ann_index_ivf_list_cache_limit` を調整することを推奨します。

## チューニングの推奨事項 {#tuning-recommendations}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Performance tuning -->

次の手順で繰り返し調整することを推奨します。

1. `nlist` / `ivf_nprobe` には `ivf` で使用している基準値を引き継ぎ、テストを開始します。
2. メモリ予算に合わせて `ann_index_ivf_list_cache_limit` を設定し、ヒット率とレイテンシの変化を観察します。
3. 再現率が安定していてもレイテンシの変動が大きい場合は、キャッシュ比率を上げることを優先し、ヒット状況を再テストします。
4. キャッシュ比率を変更した後は、再度 `ivf_nprobe` も調整し、再現率とレイテンシのバランスを取ります。

## FAQ {#faq}

<!-- Knowledge type: Frequently asked questions -->

**Q1: `ivf_on_disk` と `ivf` で SQL の使い方に違いはありますか？**

違いはありません。インデックスの作成時に `index_type` を `ivf_on_disk` に変更するだけです。クエリ関数（`l2_distance_approximate` / `inner_product_approximate`）とパラメータ（`ivf_nprobe`）は同じです。

**Q2: `ann_index_ivf_list_cache_limit` の割合は何を基準にしていますか？**

BE プロセスが使用できるメモリ（`mem_limit` による制限を受ける）を基準とし、マシン全体の物理メモリは基準にしません。BE のメモリ上限に基づいてキャッシュ比率を決めてください。

**Q3: どの程度のヒット率が適切ですか？**

業務上許容できるテールレイテンシによって異なります。参考データでは、ヒット率が 100% のときにレイテンシが最も安定しています。ヒット率が 55%～70% に下がるとメモリ使用量は大幅に減りますが、P99 レイテンシは数秒に達することがあります。監視メトリクスを基に継続的に調整してください。

**Q4: どのような場合に `ivf_on_disk` を `ivf` より優先すべきですか？**

ベクトルの規模が大きく（数千万件以上）、メモリ予算が限られ、ANN による高速化も必要な場合は、`ivf_on_disk` を優先してください。レイテンシに対する要件が非常に厳しく、メモリに余裕がある場合は `ivf` を選んでください。

## 関連ドキュメント {#related-documents}

- [ベクトルインデックスの概要](./overview.md)
- [IVF インデックス](./ivf.md)
- [HNSW インデックス](./hnsw.md)
- [ベクトルインデックスの管理](./index-management.md)
- [大規模ベクトル検索の性能](./performance-large-scale.md)
