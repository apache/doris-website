---
{
    "title": "ローカルディスクの階層型ストレージ",
    "language": "ja",
    "description": "Doris の SSD と HDD を使った階層型ストレージの概要。動的パーティションに基づいてホットデータを SSD に保持し、コールドデータを HDD に自動移行することで、クエリ性能とストレージコストのバランスを取ります。",
    "keywords": [
        "Doris 階層型ストレージ",
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

Doris は、SSD と HDD の間で階層型ストレージをサポートします。動的パーティションと組み合わせることで、データのホット・コールド特性に応じてホットデータを SSD に保持し、コールドデータを HDD に自動移行できます。これにより、ホットデータの読み書き性能を高く保ちながら、全体的なストレージコストを削減できます。

## 適用シナリオ

このドキュメントは、次のような場合に適用できます。

- テーブルデータが時間でパーティション分割され、アクセス頻度に明確なホット・コールドの差がある。
- クラスターに SSD と HDD の両方のストレージメディアがある。
- 最近のホットデータに対するクエリを SSD で高速化し、過去のコールドデータを HDD に保存してコストを抑えたい。
- 手動でデータを移行せず、動的パーティションでデータのライフサイクルを自動管理したい。

## クイックナビゲーション

- [基本概念](#core-concepts): 動的パーティションと階層型ストレージの関係。
- [パラメータリファレンス](#parameter-reference): `hot_partition_num` と `storage_medium` の使い方。
- [使用例](#usage-example): テーブル作成 SQL とパーティションの配置の確認。
- [FAQ](#faq): 利用時によくある質問。
- [トラブルシューティング](#troubleshooting): パーティション作成失敗などの問題への対処。

## 基本概念 {#core-concepts}

<!-- Knowledge type: Feature introduction -->

階層型ストレージは、動的パーティションに基づいて実装されます。Doris はパーティションの利用状況に応じてストレージメディアを自動的に選択し、クールダウン時刻に達するとデータを対象のメディアへ移行します。

### ホットパーティションとコールドパーティション

| 種類 | 説明 | ストレージメディア | 性能上の特性 |
| ---- | ---- | ------------------ | ------------ |
| ホットパーティション | 最近活発に利用され、頻繁にアクセスされるパーティション | SSD | 高 IOPS、低レイテンシー |
| コールドパーティション | アクセス頻度の低い過去のデータ | HDD | 大容量、低コスト |

### 動作の仕組み

階層型ストレージは、次の流れで動作します。

1. テーブル作成時に動的パーティションを有効にし、`dynamic_partition.storage_medium = HDD` を設定します。
2. `dynamic_partition.hot_partition_num` で直近の N 個のパーティションを SSD に保存するホットパーティションとして指定します。
3. システムは各ホットパーティションに `storage_cooldown_time` を設定します。
4. クールダウン時刻に達すると、パーティションのデータは SSD から HDD に自動的に移行されます。

動的パーティションの詳細については、[データパーティショニング - 動的パーティション](../../table-design/data-partitioning/dynamic-partitioning)を参照してください。

## パラメータリファレンス {#parameter-reference}

<!-- Knowledge type: Configuration parameters -->

階層型ストレージでは、次の二つの動的パーティションパラメータを使用します。

| パラメータ | 用途 | デフォルト | 備考 |
| ---------- | ---- | ---------- | ---- |
| `dynamic_partition.hot_partition_num` | 直近のいくつのパーティションを SSD に保存するホットパーティションとするかを指定する | なし | `storage_medium = HDD` と併用する必要がある |
| `dynamic_partition.storage_medium` | 動的パーティションの最終的なストレージメディアを指定する | HDD | SSD に設定すると、`hot_partition_num` は効かなくなる |

### dynamic_partition.hot_partition_num

- **機能**: 直近の N 個のパーティションをホットパーティションとして指定します。これらのパーティションは SSD に保存され、残りは HDD に保存されます。
- **使用条件**:
    - `dynamic_partition.storage_medium = HDD` も設定する必要があります。設定しない場合、このパラメータは効きません。
    - ストレージパスの下に SSD デバイスが必要です。ない場合、パーティションの作成に失敗します。

**例**:

現在の日付が **2021-05-20** で、パーティションを日単位で作成し、動的パーティションを次のように設定したとします。

```sql
dynamic_partition.hot_partition_num = 2
dynamic_partition.start = -3
dynamic_partition.end = 3
```

システムは、次のパーティションを対応するストレージメディアおよびクールダウン時刻とともに自動作成します。

```Plain
p20210517: ["2021-05-17", "2021-05-18") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
p20210518: ["2021-05-18", "2021-05-19") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
p20210519: ["2021-05-19", "2021-05-20") storage_medium=SSD storage_cooldown_time=2021-05-21 00:00:00
p20210520: ["2021-05-20", "2021-05-21") storage_medium=SSD storage_cooldown_time=2021-05-22 00:00:00
p20210521: ["2021-05-21", "2021-05-22") storage_medium=SSD storage_cooldown_time=2021-05-23 00:00:00
p20210522: ["2021-05-22", "2021-05-23") storage_medium=SSD storage_cooldown_time=2021-05-24 00:00:00
p20210523: ["2021-05-23", "2021-05-24") storage_medium=SSD storage_cooldown_time=2021-05-25 00:00:00
```

### dynamic_partition.storage_medium

- **機能**: 動的パーティションの最終的なストレージメディアを指定します。有効な値は `HDD`（デフォルト）または `SSD` です。
- **備考**:
    - `SSD` に設定すると、`hot_partition_num` パラメータは無視されます。
    - この場合、すべてのパーティションが SSD ストレージを使用し、クールダウン時刻は一律で `9999-12-31 23:59:59` に設定されます。つまり、移行は行われません。

## 使用例 {#usage-example}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Table creation / Verifying storage medium distribution -->

以下の手順では、階層型ストレージに対応したテーブルを作成し、各パーティションのストレージメディアの配置を確認します。

### ステップ 1: 階層型ストレージのテーブルを作成する

目的: 直近の 2 個のパーティションを SSD に、それ以外を HDD に保存する、SSD/HDD 階層型ストレージのテーブルを作成します。

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

### ステップ 2: パーティションのストレージメディアを確認する

目的: パーティションが想定どおりに SSD と HDD に割り当てられていることを確認します。

```sql
SHOW PARTITIONS FROM tiered_table;
```

想定される結果: 合計 7 個のパーティションのうち、5 個が SSD、2 個が HDD を使用します。

```Plain
p20210517: ["2021-05-17", "2021-05-18") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
p20210518: ["2021-05-18", "2021-05-19") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
p20210519: ["2021-05-19", "2021-05-20") storage_medium=SSD storage_cooldown_time=2021-05-21 00:00:00
p20210520: ["2021-05-20", "2021-05-21") storage_medium=SSD storage_cooldown_time=2021-05-22 00:00:00
p20210521: ["2021-05-21", "2021-05-22") storage_medium=SSD storage_cooldown_time=2021-05-23 00:00:00
p20210522: ["2021-05-22", "2021-05-23") storage_medium=SSD storage_cooldown_time=2021-05-24 00:00:00
p20210523: ["2021-05-23", "2021-05-24") storage_medium=SSD storage_cooldown_time=2021-05-25 00:00:00
```

## FAQ {#faq}

<!-- Knowledge type: FAQ -->

### Q1: `hot_partition_num` が効かない場合は？

`dynamic_partition.storage_medium = HDD` も設定されているか確認してください。ホットパーティションの設定が有効になるのは、最終的なメディアが HDD の場合だけです。

### Q2: SSD ストレージだけを使用できますか？

はい。`dynamic_partition.storage_medium` を `SSD` に設定すると、すべてのパーティションが SSD を使用し、クールダウンに伴う移行は行われません。この場合、`hot_partition_num` を設定する必要はありません。

### Q3: クールダウン時刻に達した後、データはどのように移行されますか？

パーティションの `storage_cooldown_time` に達すると、システムがパーティションのデータを SSD から HDD に自動的に移行します。手動操作は不要です。

### Q4: 階層型ストレージと、オブジェクトストレージなどへのホット・コールドデータのアーカイブはどう違いますか？

SSD/HDD 階層型ストレージは、異なるローカルディスクメディア間でデータを移動するもので、短期から中期のホット・コールド分離に適しています。過去のデータをオブジェクトストレージ（S3、HDFS など）へアーカイブする場合は、ホット・コールド階層型ストレージのドキュメントを参照してください。

## トラブルシューティング {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Table creation failure / Partition creation failure -->

| エラーの症状 | 考えられる原因 | 対処方法 |
| ------------ | -------------- | -------- |
| パーティションの作成に失敗する | ストレージパスの下に SSD デバイスがない | BE ノードに SSD のストレージパスを設定するか、HDD のみを使用する設定に切り替える |
| `hot_partition_num` が効かない | `storage_medium = HDD` が設定されていない | `dynamic_partition.storage_medium = HDD` も設定する |
| すべてのパーティションが SSD を使用し、HDD に移行されない | `storage_medium` が `SSD` に設定されている | `storage_medium` を `HDD` に変更し、`hot_partition_num` を設定する |
| データが想定どおりに HDD へ移行されない | `storage_cooldown_time` に達していない | クールダウン時刻に達するまで待つか、時刻の設定が正しいか確認する |
