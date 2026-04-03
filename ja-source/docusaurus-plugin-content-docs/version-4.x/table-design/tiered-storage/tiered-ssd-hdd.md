---
{
  "title": "SSDとHDDの階層ストレージ",
  "language": "ja",
  "description": "Dorisは異なるディスクタイプ（SSDとHDD）間での階層ストレージをサポートしています、"
}
---
Dorisは異なるディスクタイプ（SSDとHDD）間の階層ストレージをサポートしており、動的パーティショニング機能と組み合わせて、ホットデータとコールドデータの特性に基づいてSSDからHDDへデータを動的に移行します。このアプローチにより、ホットデータの読み書きの高いパフォーマンスを維持しながら、ストレージコストを削減します。

## 動的パーティショニングと階層ストレージ

テーブルの動的パーティショニングパラメータを設定することで、ユーザーはどのパーティションをSSDに格納し、冷却後に自動的にHDDに移行するかを設定できます。

- **ホットパーティション**: 最近アクティブなパーティションで、高いパフォーマンスを確保するためにSSDに格納されることが優先されます。
- **コールドパーティション**: アクセス頻度が低いパーティションで、ストレージコストを削減するために徐々にHDDに移行されます。

動的パーティショニングの詳細については、以下を参照してください：[Data Partitioning - Dynamic Partitioning](../../table-design/data-partitioning/dynamic-partitioning)。

## パラメータ説明

### `dynamic_partition.hot_partition_num`

- **機能**:
  - 最新のパーティションのうち何個がホットパーティションかを指定します。これらはSSDに格納され、残りのパーティションはHDDに格納されます。

- **注意**:
  - `"dynamic_partition.storage_medium" = "HDD"`を同時に設定する必要があります。そうしないと、このパラメータは有効になりません。
  - ストレージパスにSSDデバイスがない場合、この設定はパーティション作成の失敗を引き起こします。

**設定例の説明**:

現在の日付を**2021-05-20**とし、日次パーティショニングで、動的パーティショニング設定は以下の通りです：

```sql
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.hot_partition_num" = 2
    "dynamic_partition.start" = -3
    "dynamic_partition.end" = 3
```
システムは以下のパーティションを自動的に作成し、そのストレージメディアとクーリング時間を設定します：

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
  - 動的パーティションの最終ストレージ媒体を指定します。デフォルトはHDDですが、SSDを選択できます。

- **注意**:
  - SSDに設定すると、`hot_partition_num`属性は無効になり、すべてのパーティションはデフォルトでSSDストレージ媒体となり、冷却時間は9999-12-31 23:59:59になります。

## 例

### 1. dynamic_partitionを使ってテーブルを作成する

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
### 3. パーティションの手動階層化

個別のパーティションの`storage_medium`プロパティを更新することで、ストレージ階層間でパーティションを手動で移動できます。例えば、パーティションをHDDストレージに移動するには：

```sql
ALTER TABLE parent_table
MODIFY PARTITION (partition_name) SET ("storage_medium" = "HDD");
```
この操作により、パーティションのストレージポリシーが更新され、それに応じてDorisがデータの再配置を実行します。

### 4. ヘテロジニアスクラスターでの手動階層化

ヘテロジニアスクラスターの設定では、ホットデータ用のSSDベースのノードとコールドデータ用のHDDベースのノードを混在してデプロイすることが一般的です。このような環境でよくある落とし穴は、location tagを使用してこれらのノードを区別しないことです。

すべてのbackendがデフォルトのlocation tagを共有している場合、DorisはパーティションをHDDに階層化できない可能性があります。これは、パーティションが最初にSSDノードに配置されており、Dorisが同じbackend上でHDDストレージメディアを見つけることができないために発生します。

この問題を回避するには：

1. **コールド（HDD）backendに個別のlocationでタグを付ける**
    
例：

```sql
ALTER SYSTEM MODIFY BACKEND "cold_node1:9050" SET ("tag.location" = "archive");
```
2. **パーティションを変更する際に、タグ付きバックエンドを明示的にターゲットにする**
    
希望するストレージメディアとレプリケーション割り当ての両方を指定します：

```sql
ALTER TABLE parent_table
MODIFY PARTITION (partition_name) SET ("storage_medium" = "HDD", "replication_allocation" = "tag.location.archive:1");
```
ロケーションタグを割り当て、パーティションのレプリケーションポリシーでそれらを参照することにより、Dorisは異種クラスター内のHDDベースのノードに適切にコールドデータを配置できます。
