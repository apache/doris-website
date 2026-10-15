---
{
    "title": "ANN のリソース見積もりガイド",
    "sidebar_label": "リソース見積もり",
    "language": "ja",
    "description": "Apache Doris のベクトル検索（ANN）に必要なメモリと CPU を見積もる方法。HNSW と IVF、および各量子化モードの容量計画方法を説明します。",
    "keywords": [
        "ANN リソース見積もり",
        "ベクトル検索の容量計画",
        "HNSW メモリ見積もり",
        "IVF メモリ見積もり",
        "ベクトル量子化 sq8 sq4 pq",
        "Doris ベクトルインデックス CPU"
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

<!-- Knowledge type: Capacity planning / Resource estimation -->
<!-- Applicable scenarios: Pre-launch capacity planning / Cluster sizing / Memory and CPU budget estimation -->

ベクトル検索（ANN）のワークロードでは、通常、ディスク容量より先にメモリと CPU が制約になります。この記事では、本番運用を始める前に Apache Doris のベクトル検索クラスタの構成を計画できるよう、実用的なリソース見積もり方法を説明します。

## クイックナビゲーション {#quick-navigation}

- **ANN に個別の見積もりが必要な理由**: [ANN のリソース特性](#ann-resource-characteristics)を参照してください。
- **メモリを見積もる方法**: [HNSW のメモリ見積もり](#hnsw-memory-estimation)と[IVF のメモリ見積もり](#ivf-memory-estimation)を参照してください。
- **CPU を見積もる方法**: [CPU コア数の見積もり](#cpu-core-estimation)を参照してください。
- **本番環境で確保する余裕**: [本番環境の安全マージン](#production-safety-margin-do-not-design-against-100-memory)を参照してください。
- **インデックスの選び方**: [シナリオ別の推奨構成](#scenario-based-recommendations)を参照してください。

## 見積もりの概要 {#estimation-overview}

見積もりは、通常、次の順序で行います。

1. **インデックスのメモリを見積もる**: データ規模、インデックスタイプ、量子化モードから、メモリに常駐するインデックスのサイズを求めます。
2. **CPU コア数を見積もる**: 目標 QPS とレイテンシーを踏まえ、メモリ容量との比率から CPU コア数を決めます。
3. **安全マージンを確保する**: クエリ実行、ベクトル以外の列へのアクセス、コンパクションに必要な余裕を残します。

## ANN のリソース特性 {#ann-resource-characteristics}

<!-- Knowledge type: Concept explanation -->

通常の OLAP インデックスと比べ、ANN には次のようなリソース使用上の特徴があります。

| リソース項目 | 特性 |
|----------|----------|
| 構築時の CPU | 使用率が高く、データ取り込み時に CPU への負荷が大きくなります。 |
| 構築時のメモリ | セグメントが大きすぎると、メモリ不足によって単一インデックスの構築に失敗する場合があります。 |
| クエリ実行時のメモリ | 高性能なクエリ処理には、通常、インデックスをできるだけメモリに常駐させる必要があります。 |
| クエリ実行時の CPU | 高 QPS のシナリオでは、十分な数の CPU コアが必要です。 |

Doris は、メモリ使用量を減らすために `sq8`、`sq4`、`pq` の三つの量子化モードをサポートします。量子化には通常、次のトレードオフがあります。

- **データ取り込みが遅くなる**: エンコード処理の負荷が増えます。
- **クエリが遅くなる可能性がある**: デコードや再構築の処理負荷が増えます。
- **再現率が低下する可能性がある**: 非可逆エンコードによって誤差が生じます。

## 見積もりに必要な入力項目 {#estimation-input-checklist}

<!-- Knowledge type: Operational steps -->

見積もりを始める前に、次の情報を用意してください。

| 入力項目 | 説明 |
|--------|------|
| ベクトルの次元数 `D` | 単一のベクトルの float 型の次元数。例: `768`。 |
| 総行数 `N` | インデックスを作成するベクトルの総数。 |
| インデックスタイプ | `hnsw` / `ivf` / `ivf_on_disk` |
| 量子化モード | `flat` / `sq8` / `sq4` / `pq` |
| `max_degree` | HNSW のみ。グラフの隣接ノード数を制御します。デフォルトは `32`。 |
| 目標 QPS とレイテンシー | CPU コア数の見積もりに使用します。 |

## HNSW のメモリ見積もり {#hnsw-memory-estimation}

<!-- Knowledge type: Capacity planning formula -->

### デフォルトパラメータでの経験式 {#empirical-formula-under-default-parameters}

デフォルトの `max_degree=32` では、次の式を使用します。

```
HNSW_FLAT_Bytes ~= 1.3 * D * 4 * N
```

ここで、各項目の意味は次のとおりです。

- `D * 4 * N` は、float32 ベクトルの元のメモリ使用量です。
- `1.3` は、HNSW のグラフ構造による追加のオーバーヘッド（約 `0.3` 倍）を表します。

### `max_degree` を調整する場合 {#adjustment-when-tuning-max_degree}

`max_degree` が大きいほど、グラフ構造のオーバーヘッドも増えます。次のように比例させて計算します。

```
HNSW_factor   ~= 1 + 0.3 * (max_degree / 32)
HNSW_FLAT_Bytes ~= HNSW_factor * D * 4 * N
```

### 量子化によるメモリ削減量の概算 {#approximate-memory-reduction-from-quantization}

| 量子化モード | メモリ比率（FLAT 比） |
|----------|------------------------|
| `sq8` | 約 `1/4` |
| `sq4` | 約 `1/8` |
| `pq` | 通常は `sq4` に近い（例: `pq_m=D/2, pq_nbits=8`） |

### `ivf_on_disk` に関する注意事項 {#notes-on-ivf_on_disk}

`ivf_on_disk` は、IVF の学習およびクエリパラメータのモデル（`nlist` / `ivf_nprobe`）を再利用しますが、転置リスト本体をディスクに保存し、キャッシュを介してクエリを処理します。容量計画では、まず以下の IVF の見積もりを「すべてがメモリに常駐する場合」の上限として扱い、次にメモリに常駐させたいホットデータのサイズに基づいて `ann_index_ivf_list_cache_limit` を別途計画できます。

### クイックリファレンス（`D=768`、`max_degree=32`） {#quick-reference-d768-max_degree32}

| 行数 | FLAT | SQ8 | SQ4 | PQ (`m=384, nbits=8`) |
|------|------|------|------|--------------------------|
| 1M | 4 GB | 1 GB | 0.5 GB | 0.5 GB |
| 10M | 40 GB | 10 GB | 5 GB | 5 GB |
| 100M | 400 GB | 100 GB | 50 GB | 50 GB |
| 1B | 4000 GB | 1000 GB | 500 GB | 500 GB |
| 10B | 40000 GB | 10000 GB | 5000 GB | 5000 GB |

## IVF のメモリ見積もり {#ivf-memory-estimation}

<!-- Knowledge type: Capacity planning formula -->

IVF は HNSW より構造上のオーバーヘッドが小さく、次の式で概算できます。

```
IVF_FLAT_Bytes ~= D * 4 * N
```

量子化した IVF のメモリ削減比率は、HNSW と同じです。

| 量子化モード | メモリ比率（FLAT 比） |
|----------|------------------------|
| `sq8` | 約 `1/4` |
| `sq4` | 約 `1/8` |
| `pq` | 通常は `sq4` に近い |

### クイックリファレンス（`D=768`） {#quick-reference-d768}

| 行数 | FLAT | SQ8 | SQ4 | PQ (`m=384, nbits=8`) |
|------|------|------|------|--------------------------|
| 1M | 3 GB | 0.75 GB | 0.35 GB | 0.35 GB |
| 10M | 30 GB | 7.5 GB | 3.5 GB | 3.5 GB |
| 100M | 300 GB | 75 GB | 35 GB | 35 GB |
| 1B | 3000 GB | 750 GB | 350 GB | 350 GB |
| 10B | 30000 GB | 7500 GB | 3500 GB | 3500 GB |

## CPU コア数の見積もり {#cpu-core-estimation}

<!-- Knowledge type: Capacity planning formula -->

高 QPS のシナリオでは、次の経験的な比率を出発点にできます。

```
16 cores : 64 GB   (about 1 core : 4 GB)
```

注: 量子化を有効にしても、CPU の必要量がインデックスのメモリ使用量と同じ比率で減るとは限りません。実際には、次の手順で見積もります。

1. まず、**FLAT 相当のワークロード**に基づいて CPU を見積もります。
2. 次に、実際の負荷テストの結果を基に、適切な水準まで段階的に減らします。

## 本番環境の安全マージン（メモリ使用率 100% を前提に設計しない） {#production-safety-margin-do-not-design-against-100-memory}

<!-- Knowledge type: Best practice -->

上記の式で見積もれるのは ANN インデックス自体のメモリだけで、SQL 実行全体のオーバーヘッドは含まれません。たとえば、次のクエリを考えます。

```sql
SELECT id, text, l2_distance_approximate(embedding, [...]) AS dist
FROM tbl
ORDER BY dist
LIMIT N;
```

TopN 遅延実体化を使用しても、実行レイヤーではベクトル以外の列やオペレーターの状態を処理するために追加のメモリが必要です。本番環境では、次のように計画することを推奨します。

- ANN インデックスのメモリ使用量を、マシンの総メモリの約 **70%** 以内に抑えます。
- 残りのメモリを、クエリ実行、コンパクション、その他のデータアクセスに充てます。

## シナリオ別の推奨構成 {#scenario-based-recommendations}

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenarios: Index type and quantization mode selection -->

| シナリオ | 推奨構成 | 説明 |
|------|----------|------|
| 十分なメモリ予算があり、性能を優先する場合 | `HNSW + FLAT` | 再現率とレイテンシーが最も優れています。 |
| メモリに制約がある場合 | `HNSW/IVF + PQ` | 通常、`SQ8/SQ4` よりバランスが取れています。 |
| PQ パラメータの初期値 | `pq_m = D / 2` | 後で再現率とレイテンシーの負荷テスト結果に基づいて調整します。 |
| クエリ性能の要件が低い場合 | まず CPU を少なく構成する | 「データ取り込み時は CPU を多く割り当て、安定した後に縮小する」方法もあります。 |

## よくある質問 {#faq}

<!-- Knowledge type: Frequently asked questions -->

**Q1: 量子化を有効にすると、メモリ使用量はどの程度減りますか？**

A: `sq8` では FLAT の約 `1/4`、`sq4` と `pq`（例: `pq_m=D/2, pq_nbits=8`）では約 `1/8` になります。正確な値は HNSW のグラフ構造のオーバーヘッドにも左右されます。

**Q2: 量子化によるメモリ削減と同じ比率で CPU も減らせますか？**

A: 推奨しません。量子化で主に減るのはメモリ使用量で、CPU の必要量は比例して減りません。まず FLAT 相当のワークロードに基づいて CPU を見積もり、負荷テストの結果に応じて減らすことを推奨します。

**Q3: `max_degree` を増やすとメモリ使用量はどう変わりますか？**

A: HNSW のグラフ構造のオーバーヘッドは、`1 + 0.3 * (max_degree / 32)` に応じて増えます。たとえば、`max_degree=64` の場合、係数は約 `1.6` です。

**Q4: `ivf_on_disk` 用にどの程度のメモリを計画すべきですか？**

A: 上限は「IVF のすべてがメモリに常駐する場合」です。実際に常駐するサイズは `ann_index_ivf_list_cache_limit` によって決まり、ホットデータのサイズに基づいて別途評価できます。

**Q5: メモリを 100% 使用する前提で設計してはいけないのはなぜですか？**

A: ANN インデックスに加え、SQL 実行レイヤー（ベクトル以外の列やオペレーターの状態）、コンパクション、その他のデータアクセスもメモリを消費します。約 30% の余裕を確保し、インデックスのメモリ使用量を総メモリの 70% 以内に抑えることを推奨します。

## 関連ドキュメント {#related-documents}

- [ベクトル検索の概要](./overview.md)
- [HNSW](./hnsw.md)
- [IVF](./ivf.md)
- [ANN インデックスの管理](./index-management.md)
