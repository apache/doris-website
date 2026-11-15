---
{
    "title": "ローカルディスクの階層化ストレージ",
    "language": "ja",
    "description": "Doris の SSD と HDD による階層化ストレージの概要。動的パーティションを利用してホットデータを SSD に保持し、コールドデータを HDD に自動移行することで、クエリ性能とストレージコストのバランスを取ります。",
    "keywords": [
        "Doris 階層化ストレージ",
        "SSD HDD ホット・コールド分離",
        "動的パーティション",
        "hot_partition_num",
        "storage_medium",
        "storage_cooldown_time",
        "ホット・コールドデータの移行"
    ]
}
---

<!-- Knowledge type: Feature introduction + Configuration parameters + Operation steps -->
<!-- Applicable scenarios: Hot-cold data separation / Storage cost optimization / Query performance assurance -->

Doris は SSD と HDD 間の階層化ストレージに対応しています。動的パーティションと組み合わせることで、データのアクセス頻度に応じてホットデータを SSD に保持し、コールドデータを HDD に自動移行できます。これにより、ホットデータの読み書き性能を高く保ちながら、ストレージ全体のコストを削減できます。

## 適用シナリオ {#applicable-scenarios}

このドキュメントは、次のシナリオを対象としています。

- テーブルのデータが時間でパーティション分割され、アクセス頻度に明確な差がある。
- クラスタに SSD と HDD の両方がある。
- 最近のホットデータに対するクエリを SSD で高速化し、過去のコールドデータを HDD に保存してコストを抑えたい。
- 動的パーティションでデータのライフサイクルを自動管理し、手動での移行を避けたい。

## クイックナビゲーション {#quick-navigation}

- [基本概念](#core-concepts)：動的パーティションと階層化ストレージの関係。
- [パラメータ一覧](#parameter-reference)：`hot_partition_num` と `storage_medium` の使い方。
- [使用例](#usage-example)：テーブル作成用 SQL とパーティションの配置状況の確認。
- [よくある質問](#faq)：利用時によくある質問。
- [トラブルシューティング](#troubleshooting)：パーティションの作成失敗などへの対処。

## 基本概念 {#core-concepts}

<!-- Knowledge type: Feature introduction -->

階層化ストレージは動的パーティションを基盤として実装されています。Doris はパーティションのアクセス頻度に応じてストレージメディアを自動的に選択し、クールダウン時刻に達するとデータを移行先のメディアに移します。

### ホットパーティションとコールドパーティション {#hot-partitions-and-cold-partitions}

| 種類 | 説明 | ストレージメディア | 性能上の特徴 |
| ---- | ---- | ------------------ | ------------ |
| ホットパーティション | 最近活発に利用され、頻繁にアクセスされるパーティション | SSD | 高 IOPS、低レイテンシ |
| コールドパーティション | アクセス頻度の低い過去のデータを含むパーティション | HDD | 大容量、低コスト |

### 仕組み {#how-it-works}

階層化ストレージは次の流れで動作します。

1. テーブルの作成時に動的パーティションを有効にし、`dynamic_partition.storage_medium = HDD` を設定します。
2. `dynamic_partition.hot_partition_num` を使用して、現在のパーティション、過去 `N - 1` 個の時間区間に対応するパーティション、および将来のすべてのパーティションを SSD に保持します。
3. システムは各ホットパーティションに `storage_cooldown_time` を設定します。
4. クールダウン時刻に達すると、パーティションのデータは SSD から HDD に自動的に移行されます。

動的パーティションの詳細は、[データのパーティション分割 - 動的パーティション](../../table-design/data-partitioning/dynamic-partitioning)を参照してください。

## パラメータ一覧 {#parameter-reference}

<!-- Knowledge type: Configuration parameters -->

階層化ストレージでは、次の二つの動的パーティションのパラメータを使用します。

| パラメータ | 用途 | デフォルト | 備考 |
| ---------- | ---- | ---------- | ---- |
| `dynamic_partition.hot_partition_num` | `N > 0` の場合、現在のパーティション、過去 `N - 1` 個の時間区間に対応するパーティション、および将来のすべてのパーティションを SSD に保持する | なし | `storage_medium = HDD` と併用する必要がある |
| `dynamic_partition.storage_medium` | 動的パーティションの最終的なストレージメディアを指定する | HDD | SSD に設定すると、`hot_partition_num` は効かなくなる |

### dynamic_partition.hot_partition_num {#dynamic_partitionhot_partition_num}

- **機能**：正の値 `N` を指定すると、現在のパーティション、過去 `N - 1` 個の時間区間に対応するパーティション、および将来のすべてのパーティションを SSD に保持します。それより古いパーティションには HDD を使用します。
- **使用条件**：
    - `dynamic_partition.storage_medium = HDD` も設定する必要があります。設定しない場合、このパラメータは効きません。
    - ストレージパスに SSD デバイスが必要です。SSD デバイスがない場合、パーティションの作成に失敗します。

**例**：

現在の日付が **2021-05-20** で、日単位のパーティションを使用し、動的パーティションを次のように設定したとします。

```sql
dynamic_partition.hot_partition_num = 2
dynamic_partition.start = -3
dynamic_partition.end = 3
```

システムは以下のパーティションを自動作成し、それぞれに対応するストレージメディアとクールダウン時刻を設定します。

```Plain
p20210517: ["2021-05-17", "2021-05-18") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
p20210518: ["2021-05-18", "2021-05-19") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
p20210519: ["2021-05-19", "2021-05-20") storage_medium=SSD storage_cooldown_time=2021-05-21 00:00:00
p20210520: ["2021-05-20", "2021-05-21") storage_medium=SSD storage_cooldown_time=2021-05-22 00:00:00
p20210521: ["2021-05-21", "2021-05-22") storage_medium=SSD storage_cooldown_time=2021-05-23 00:00:00
p20210522: ["2021-05-22", "2021-05-23") storage_medium=SSD storage_cooldown_time=2021-05-24 00:00:00
p20210523: ["2021-05-23", "2021-05-24") storage_medium=SSD storage_cooldown_time=2021-05-25 00:00:00
```

日単位のパーティションでは、当日のオフセットは `0` です。`hot_partition_num = N > 0` で、最終的なストレージメディアが `HDD` の場合、オフセットが `-N` より大きいパーティションには SSD を使用します。これには、当日、過去 `N - 1` 日、および `dynamic_partition.end` によって作成される将来のすべてのパーティションが含まれます。オフセットが `i` の SSD パーティションのクールダウン時刻は、当日から数えて `i + N` 日目の開始時刻です。

この例では、オフセット `-3` と `-2` のパーティションには HDD を使用し、オフセット `-1` から `3` までのパーティションには SSD を使用します。**2021-05-20** には、`hot_partition_num = 2` でも SSD を使用するパーティションは五つあります。過去のパーティションを作成するには、以下の完全なテーブル定義に示すように、`dynamic_partition.create_history_partition = true` も必要です。

### dynamic_partition.storage_medium {#dynamic_partitionstorage_medium}

- **機能**：動的パーティションの最終的なストレージメディアを指定します。有効な値は `HDD`（デフォルト）または `SSD` です。
- **注意事項**：
    - `SSD` に設定すると、`hot_partition_num` パラメータは無視されます。
    - この場合、すべてのパーティションで SSD が使用され、クールダウン時刻は一律に `9999-12-31 23:59:59` に設定されます。つまり、移行は行われません。

## 使用例 {#usage-example}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Table creation / Verifying storage medium distribution -->

以下の手順では、階層化ストレージに対応するテーブルを作成し、各パーティションのストレージメディアの配置を確認します。

### ステップ 1：階層化ストレージのテーブルを作成する {#step-1-create-a-tiered-storage-table}

目的：SSD/HDD の階層化ストレージを有効にしたテーブルを作成します。`hot_partition_num = 2` の場合、当日、前日、および将来のすべてのパーティションには SSD を使用し、それより古いパーティションには HDD を使用します。

```sql
CREATE TABLE tiered_table (k DATE)
PARTITION BY RANGE(k)()
DISTRIBUTED BY HASH (k) BUCKETS 5
PROPERTIES
(
    "dynamic_partition.storage_medium" = "hdd",
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.hot_partition_num" = "2",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "5",
    "dynamic_partition.create_history_partition" = "true",
    "dynamic_partition.start" = "-3"
);
```

### ステップ 2：パーティションのストレージメディアを確認する {#step-2-check-the-partition-storage-medium}

目的：パーティションが想定どおりに SSD と HDD に配置されていることを確認します。

```sql
SHOW PARTITIONS FROM tiered_table;
```

テーブルを **2021-05-20** に作成した場合、関連するパーティションの属性は以下のようになります。合計 7 パーティションのうち、5 パーティションが SSD、2 パーティションが HDD を使用します。

```Plain
p20210517: ["2021-05-17", "2021-05-18") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
p20210518: ["2021-05-18", "2021-05-19") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
p20210519: ["2021-05-19", "2021-05-20") storage_medium=SSD storage_cooldown_time=2021-05-21 00:00:00
p20210520: ["2021-05-20", "2021-05-21") storage_medium=SSD storage_cooldown_time=2021-05-22 00:00:00
p20210521: ["2021-05-21", "2021-05-22") storage_medium=SSD storage_cooldown_time=2021-05-23 00:00:00
p20210522: ["2021-05-22", "2021-05-23") storage_medium=SSD storage_cooldown_time=2021-05-24 00:00:00
p20210523: ["2021-05-23", "2021-05-24") storage_medium=SSD storage_cooldown_time=2021-05-25 00:00:00
```

## よくある質問 {#faq}

<!-- Knowledge type: FAQ -->

### Q1：`hot_partition_num` が効かない場合は？ {#q1-what-if-hot_partition_num-does-not-take-effect}

`dynamic_partition.storage_medium = HDD` も設定されていることを確認してください。ホットパーティションの設定は、最終的なストレージメディアが HDD の場合にのみ有効です。

### Q2：SSD のみを使用できますか？ {#q2-can-i-use-ssd-storage-only}

はい。`dynamic_partition.storage_medium` を `SSD` に設定すると、すべてのパーティションで SSD が使用され、クールダウンによる移行は行われません。この場合、`hot_partition_num` を設定する必要はありません。

### Q3：クールダウン時刻に達した後、データはどのように移行されますか？ {#q3-how-is-data-migrated-after-the-cooldown-time-is-reached}

パーティションの `storage_cooldown_time` に達すると、システムがそのパーティションのデータを SSD から HDD に自動的に移行します。手動操作は不要です。

### Q4：階層化ストレージと、オブジェクトストレージなどを使用したホット・コールドデータのアーカイブはどう違いますか？ {#q4-what-is-the-difference-between-tiered-storage-and-hot-cold-data-archiving-such-as-object-storage}

SSD/HDD の階層化ストレージは、異なる種類のローカルディスク間でデータを移動するためのもので、短期から中期のホット・コールド分離に適しています。過去のデータをオブジェクトストレージ（S3、HDFS など）にアーカイブする場合は、ホット・コールド階層化ストレージのドキュメントを参照してください。

## トラブルシューティング {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Table creation failure / Partition creation failure -->

| エラーの症状 | 考えられる原因 | 対処方法 |
| ------------ | -------------- | -------- |
| パーティションの作成に失敗する | ストレージパスに SSD デバイスがない | BE ノードに SSD のストレージパスを設定するか、HDD のみを使用する設定に切り替える |
| `hot_partition_num` が効かない | `storage_medium = HDD` が設定されていない | `dynamic_partition.storage_medium = HDD` も設定する |
| すべてのパーティションが SSD を使用し、HDD に移行されない | `storage_medium` が `SSD` に設定されている | `storage_medium` を `HDD` に変更し、`hot_partition_num` を設定する |
| データが想定どおりに HDD に移行されない | `storage_cooldown_time` に達していない | クールダウン時刻に達するまで待つか、時刻の設定が正しいか確認する |
