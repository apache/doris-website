---
{
    "title": "ローカルディスクの階層型ストレージ",
    "language": "ja",
    "description": "Doris の SSD と HDD による階層型ストレージの概要。動的パーティションに基づいてホットデータを SSD に保持し、コールドデータを HDD に自動移行することで、クエリ性能とストレージコストのバランスを取ります。",
    "keywords": [
        "Doris 階層型ストレージ",
        "SSD HDD ホット・コールド分離",
        "動的パーティション",
        "hot_partition_num",
        "storage_medium",
        "storage_cooldown_time",
        "ホットデータとコールドデータの移行"
    ]
}
---

<!-- Knowledge type: Feature introduction + Configuration parameters + Operation steps -->
<!-- Applicable scenarios: Hot-cold data separation / Storage cost optimization / Query performance assurance -->

Doris は、SSD と HDD の間での階層型ストレージをサポートしています。動的パーティションと組み合わせることで、データのアクセス頻度に応じてホットデータを SSD に保持し、コールドデータを HDD に自動移行できます。これにより、ホットデータの高速な読み書きを確保しながら、全体のストレージコストを削減できます。

## 適用シナリオ {#applicable-scenarios}

このドキュメントは、次のシナリオを対象としています。

- テーブルのデータが時間でパーティション分割されており、アクセス頻度に明確な差がある。
- クラスターに SSD と HDD の両方のストレージ媒体がある。
- 最近のホットデータに対するクエリを SSD で高速化し、過去のコールドデータを HDD に保存してコストを抑えたい。
- 動的パーティションでデータのライフサイクルを自動管理し、手動での移行を避けたい。

## クイックナビゲーション {#quick-navigation}

- [基本概念](#core-concepts)：動的パーティションと階層型ストレージの関係。
- [パラメータリファレンス](#parameter-reference)：`hot_partition_num` と `storage_medium` の使い方。
- [使用例](#usage-example)：テーブル作成用 SQL とパーティションの配置の確認。
- [よくある質問](#faq)：使用中によくある質問。
- [トラブルシューティング](#troubleshooting)：パーティションの作成失敗などの問題への対処。

## 基本概念 {#core-concepts}

<!-- Knowledge type: Feature introduction -->

階層型ストレージは、動的パーティションを基盤として実装されています。Doris はパーティションのアクティブ度に応じてストレージ媒体を自動的に選択し、クールダウン時刻に達するとデータを移行先の媒体へ移動します。

### ホットパーティションとコールドパーティション {#hot-partitions-and-cold-partitions}

| 種類 | 説明 | ストレージ媒体 | 性能上の特性 |
| ---- | ---- | -------------- | ------------ |
| ホットパーティション | 最近アクティブで、頻繁にアクセスされるパーティション | SSD | 高 IOPS、低レイテンシー |
| コールドパーティション | アクセス頻度が低い過去のデータを含むパーティション | HDD | 大容量、低コスト |

### 動作の仕組み {#how-it-works}

階層型ストレージは、次の流れで動作します。

1. テーブルの作成時に動的パーティションを有効にし、`dynamic_partition.storage_medium = HDD` を設定します。
2. `dynamic_partition.hot_partition_num` を使用して、現在のパーティション、過去 `N - 1` 個の時間間隔に対応するパーティション、および将来のすべてのパーティションを SSD に保持します。
3. システムは、各ホットパーティションに `storage_cooldown_time` を設定します。
4. クールダウン時刻に達すると、パーティションのデータが SSD から HDD に自動移行されます。

動的パーティションについて詳しくは、[データのパーティション分割 - 動的パーティション](../../table-design/data-partitioning/dynamic-partitioning)を参照してください。

## パラメータリファレンス {#parameter-reference}

<!-- Knowledge type: Configuration parameters -->

階層型ストレージは、次の動的パーティションパラメータを使用します。

| パラメータ | 用途 | デフォルト | 備考 |
| ---------- | ---- | ---------- | ---- |
| `dynamic_partition.hot_partition_num` | 現在のパーティション、過去 `N - 1` 個の時間間隔に対応するパーティション、および将来のすべてのパーティションを、`N > 0` の場合に SSD に保持する | なし | `storage_medium = HDD` と併用する必要がある |
| `dynamic_partition.storage_medium` | 動的パーティションの最終的なストレージ媒体を指定する | HDD | SSD に設定すると、`hot_partition_num` は効かなくなる |

### dynamic_partition.hot_partition_num {#dynamic_partitionhot_partition_num}

- **機能**：正の値 `N` を指定すると、現在のパーティション、過去 `N - 1` 個の時間間隔に対応するパーティション、および将来のすべてのパーティションを SSD に保持します。それより古いパーティションには HDD を使用します。
- **使用条件**：
    - `dynamic_partition.storage_medium = HDD` も設定する必要があります。設定しない場合、このパラメータは効きません。
    - ストレージパスに SSD デバイスが必要です。ない場合はパーティションの作成に失敗します。

**例**：

現在の日付が **2021-05-20** で、日単位のパーティションを使用し、動的パーティションを次のように設定したとします。

```sql
dynamic_partition.hot_partition_num = 2
dynamic_partition.start = -3
dynamic_partition.end = 3
```

システムは次のパーティションを自動作成し、それぞれに対応するストレージ媒体とクールダウン時刻を設定します。

```Plain
p20210517: ["2021-05-17", "2021-05-18") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
p20210518: ["2021-05-18", "2021-05-19") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
p20210519: ["2021-05-19", "2021-05-20") storage_medium=SSD storage_cooldown_time=2021-05-21 00:00:00
p20210520: ["2021-05-20", "2021-05-21") storage_medium=SSD storage_cooldown_time=2021-05-22 00:00:00
p20210521: ["2021-05-21", "2021-05-22") storage_medium=SSD storage_cooldown_time=2021-05-23 00:00:00
p20210522: ["2021-05-22", "2021-05-23") storage_medium=SSD storage_cooldown_time=2021-05-24 00:00:00
p20210523: ["2021-05-23", "2021-05-24") storage_medium=SSD storage_cooldown_time=2021-05-25 00:00:00
```

日単位のパーティションでは、当日のオフセットは `0` です。`hot_partition_num = N > 0` で、最終的なストレージ媒体が `HDD` の場合、オフセットが `-N` より大きいパーティションには SSD を使用します。これには当日、過去 `N - 1` 日、および `dynamic_partition.end` によって作成される将来のすべてのパーティションが含まれます。オフセットが `i` の SSD パーティションのクールダウン時刻は、当日を基準とした `i + N` 日目の開始時刻です。

この例では、オフセット `-3` と `-2` には HDD を、`-1` から `3` には SSD を使用します。**2021-05-20** 時点では、`hot_partition_num = 2` であっても、SSD を使用するパーティションは 5 個あります。過去のパーティションを作成するには、以下の完全なテーブル定義のように `dynamic_partition.create_history_partition = true` も設定する必要があります。

### dynamic_partition.storage_medium {#dynamic_partitionstorage_medium}

- **機能**：動的パーティションの最終的なストレージ媒体を指定します。有効な値は `HDD`（デフォルト）または `SSD` です。
- **注意事項**：
    - `SSD` に設定すると、`hot_partition_num` パラメータは無視されます。
    - この場合、すべてのパーティションで SSD ストレージを使用し、クールダウン時刻は一律に `9999-12-31 23:59:59` に設定されます。つまり、移行は行われません。

## 使用例 {#usage-example}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Table creation / Verifying storage medium distribution -->

以下の手順では、階層型ストレージをサポートするテーブルを作成し、パーティションのストレージ媒体の配置を確認します。

### ステップ 1：階層型ストレージを使用するテーブルを作成する {#step-1-create-a-tiered-storage-table}

目的：SSD/HDD の階層型ストレージを有効にしたテーブルを作成します。`hot_partition_num = 2` の場合、当日、前日、および将来のすべてのパーティションには SSD を使用し、それより古いパーティションには HDD を使用します。

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

### ステップ 2：パーティションのストレージ媒体を確認する {#step-2-check-the-partition-storage-medium}

目的：パーティションが想定どおりに SSD と HDD に割り当てられていることを確認します。

```sql
SHOW PARTITIONS FROM tiered_table;
```

テーブルを **2021-05-20** に作成した場合、関連するパーティションのプロパティは次のとおりです。パーティションは合計 7 個で、そのうち 5 個が SSD、2 個が HDD を使用します。

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

`dynamic_partition.storage_medium = HDD` も設定されていることを確認してください。ホットパーティションの設定は、最終的なストレージ媒体が HDD の場合にのみ有効です。

### Q2：SSD ストレージだけを使用できますか？ {#q2-can-i-use-ssd-storage-only}

はい。`dynamic_partition.storage_medium` を `SSD` に設定すると、すべてのパーティションで SSD を使用し、クールダウンによる移行は行われません。この場合、`hot_partition_num` を設定する必要はありません。

### Q3：クールダウン時刻に達した後、データはどのように移行されますか？ {#q3-how-is-data-migrated-after-the-cooldown-time-is-reached}

パーティションの `storage_cooldown_time` に達すると、システムがそのパーティションのデータを SSD から HDD に自動移行します。手動での操作は不要です。

### Q4：階層型ストレージと、オブジェクトストレージなどを使ったホットデータとコールドデータのアーカイブには、どのような違いがありますか？ {#q4-what-is-the-difference-between-tiered-storage-and-hot-cold-data-archiving-such-as-object-storage}

SSD/HDD の階層型ストレージは、異なるローカルディスク媒体間でデータを移動するためのもので、短期から中期のホットデータとコールドデータの分離に適しています。過去のデータをオブジェクトストレージ（S3、HDFS など）にアーカイブする場合は、ホットデータとコールドデータの階層型ストレージに関するドキュメントを参照してください。

## トラブルシューティング {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Table creation failure / Partition creation failure -->

| エラーの症状 | 考えられる原因 | 対処方法 |
| ------------ | -------------- | -------- |
| パーティションの作成に失敗する | ストレージパスに SSD デバイスがない | BE ノードに SSD のストレージパスを設定するか、HDD のみを使用するストレージに切り替える |
| `hot_partition_num` が効かない | `storage_medium = HDD` が設定されていない | `dynamic_partition.storage_medium = HDD` も設定する |
| すべてのパーティションが SSD を使用し、HDD に移行されない | `storage_medium` が `SSD` に設定されている | `storage_medium` を `HDD` に変更し、`hot_partition_num` を設定する |
| データが想定どおりに HDD に移行されない | `storage_cooldown_time` に達していない | クールダウン時刻まで待つか、時刻の設定が正しいことを確認する |
