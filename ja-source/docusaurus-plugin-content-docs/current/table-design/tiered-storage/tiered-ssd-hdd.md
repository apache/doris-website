---
{
  "title": "SSDとHDDの階層ストレージ",
  "language": "ja",
  "description": "Dorisは異なるディスクタイプ（SSDとHDD）間での階層化ストレージをサポートします、"
}
---
Dorisは異なるディスクタイプ（SSDとHDD）間の階層ストレージをサポートし、動的パーティショニング機能と組み合わせて、ホットデータとコールドデータの特性に基づいてSSDからHDDへデータを動的に移行します。このアプローチにより、ホットデータの読み書きで高いパフォーマンスを維持しながら、ストレージコストを削減できます。

## 動的パーティショニングと階層ストレージ

テーブルの動的パーティショニングパラメータを設定することで、ユーザーはどのパーティションをSSDに格納し、コールド化後に自動的にHDDに移行するかを設定できます。

- **ホットパーティション**: 最近アクティブなパーティションで、高いパフォーマンスを確保するためにSSDに優先的に格納されます。
- **コールドパーティション**: アクセス頻度の低いパーティションで、ストレージコストを削減するために徐々にHDDに移行されます。

動的パーティショニングの詳細については、[Data Partitioning - Dynamic Partitioning](../../table-design/data-partitioning/dynamic-partitioning)を参照してください。

## パラメータ説明

### `dynamic_partition.hot_partition_num`

- **機能**:
  - 最新のパーティションのうち何個をホットパーティションとするかを指定します。これらはSSDに格納され、残りのパーティションはHDDに格納されます。

- **注意**:
  - `"dynamic_partition.storage_medium" = "HDD"`を同時に設定する必要があります。そうでなければ、このパラメータは効果がありません。
  - ストレージパスにSSDデバイスがない場合、この設定によりパーティション作成が失敗します。

**例の説明**:

現在の日付が**2021-05-20**で、日次パーティショニングの場合、動的パーティショニング設定は以下の通りです:

```sql
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.hot_partition_num" = 2
    "dynamic_partition.start" = -3
    "dynamic_partition.end" = 3
```
システムは以下のパーティションを自動的に作成し、それらのストレージメディアとクーリング時間を設定します：

  ```Plain
  p20210517：["2021-05-17", "2021-05-18") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
  p20210518：["2021-05-18", "2021-05-19") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
  p20210519：["2021-05-19", "2021-05-20") storage_medium=SSD storage_cooldown_time=2021-05-21 00:00:00
  p20210520：["2021-05-20", "2021-05-21") storage_medium=SSD storage_cooldown_time=2021-05-22 00:00:00
  p20210521：["2021-05-21", "2021-05-22") storage_medium=SSD storage_cooldown_time=2021-05-23 00:00:00
  p20210522：["2021-05-22", "2021-05-23") storage_medium=SSD storage_cooldown_time=2021-05-24 00:00:00
  p20210523：["2021-05-23", "2021-05-24") storage_medium=SSD storage_cooldown_time=2021-05-25 00:00:00
  ```
### `dynamic_partition.storage_medium`

- **機能**:
  - 動的パーティションの最終ストレージメディアを指定します。デフォルトはHDDですが、SSDを選択できます。

- **注意**:
  - SSDに設定すると、`hot_partition_num`属性は効果がなくなり、すべてのパーティションはデフォルトでSSDストレージメディアとなり、クーリング時間は9999-12-31 23:59:59になります。

## 例

### 1. dynamic_partitionでテーブルを作成する

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
        "dynamic_partition.create_history_partition"= "true",
        "dynamic_partition.start" = "-3"
    );
```
### 2. パーティションのストレージメディアを確認する

```sql
    SHOW PARTITIONS FROM tiered_table;
```
7つのパーティションが必要で、そのうち5つはストレージメディアとしてSSDを使用し、残りの2つはHDDを使用します。

```Plain
  p20210517：["2021-05-17", "2021-05-18") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
  p20210518：["2021-05-18", "2021-05-19") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
  p20210519：["2021-05-19", "2021-05-20") storage_medium=SSD storage_cooldown_time=2021-05-21 00:00:00
  p20210520：["2021-05-20", "2021-05-21") storage_medium=SSD storage_cooldown_time=2021-05-22 00:00:00
  p20210521：["2021-05-21", "2021-05-22") storage_medium=SSD storage_cooldown_time=2021-05-23 00:00:00
  p20210522：["2021-05-22", "2021-05-23") storage_medium=SSD storage_cooldown_time=2021-05-24 00:00:00
  p20210523：["2021-05-23", "2021-05-24") storage_medium=SSD storage_cooldown_time=2021-05-25 00:00:00
```
