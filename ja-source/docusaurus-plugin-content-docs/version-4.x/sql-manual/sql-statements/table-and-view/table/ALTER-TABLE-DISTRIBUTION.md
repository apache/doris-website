---
{
  "title": "ALTER TABLE DISTRIBUTION",
  "language": "ja",
  "description": "このステートメントは、パーティションテーブルのデフォルトdistribution bucket設定を変更するために使用されます。"
}
---
## 説明

このステートメントは、パーティションテーブルのデフォルト分散バケット設定を変更するために使用されます。この操作は同期的であり、コマンドの戻りは実行の完了を示します。

このステートメントは**新しく作成されるパーティション**のデフォルトバケット数のみを変更します。既存のパーティションは元のバケット数を変更せずに保持します。

grammar:

```sql
ALTER TABLE [database.]table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(column1[, column2, ...]) BUCKETS { num | AUTO };
ALTER TABLE [database.]table MODIFY DISTRIBUTION DISTRIBUTED BY RANDOM BUCKETS { num | AUTO };
```
注意:

- `num`: 新しいパーティションに対する固定のバケット数を指定する正の整数。
- `AUTO`: データ量とクラスター設定に基づいて、システムが新しいパーティションのバケット数を自動的に決定する。
- 配布タイプ（HASHまたはRANDOM）と配布カラムは、元のテーブル定義と同じである必要があります。変更できるのはバケット数のみです。
- このステートメントは**パーティションテーブル**（RANGEまたはLISTパーティション）にのみ適用されます。パーティション化されていないテーブルはサポートされません。
- このステートメントは**Colocate**テーブルではサポートされません。
- 固定のバケット数と`AUTO`の間で自由に切り替えることができ、連続して複数回の変更を実行できます。

### AUTO PARTITIONとの相互作用

[AUTO PARTITION](../../../../table-design/data-partitioning/auto-partitioning)を使用しているテーブルの場合、`ALTER TABLE MODIFY DISTRIBUTION`を実行した後にデータ挿入によって自動的に作成される新しいパーティションは、新しいバケット設定を使用します。変更前にすでに自動作成されたパーティションは変更されません。

例えば、AUTO PARTITIONテーブルが元々`BUCKETS 5`を使用しており、それを`BUCKETS 8`に変更した場合、新しい自動パーティションの作成をトリガーするその後のINSERTは、そのパーティションに8つのバケットを割り当てます。さらにそれを`BUCKETS AUTO`に変更した場合、新しく自動作成されるパーティションのバケット数はシステムによって自動的に決定されます。

### Dynamic Partitionとの相互作用

[Dynamic Partition](../../../../table-design/data-partitioning/dynamic-partitioning)を使用しているテーブルの場合、`ALTER TABLE MODIFY DISTRIBUTION`を実行した後にdynamic partitionスケジューラによって自動的に作成される新しいパーティションは、新しいバケット設定を使用します。既存のdynamic partitionは変更されません。

Dynamic Partitionテーブルは`dynamic_partition.buckets`プロパティもサポートすることに注意してください。両方が設定されている場合、動的に作成されるパーティションには`dynamic_partition.buckets`プロパティが優先されます。dynamic partitionに対してテーブルレベルのデフォルトバケット数（`MODIFY DISTRIBUTION`で設定）を使用するには、`dynamic_partition.buckets`が明示的に設定されていないことを確認するか、`ALTER TABLE ... SET ("dynamic_partition.buckets" = "...")`を介して適切に更新してください。

## 例

1. HASH配布を持つRANGEパーティションテーブルのデフォルトバケット数を元の値から10に変更する

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 10;
```
この後、新しく追加されるパーティションは10個のバケットを使用します：

```sql
ALTER TABLE example_db.my_table ADD PARTITION p3 VALUES LESS THAN ('30');
-- p3 will have 10 buckets; existing partitions remain unchanged
```
:::info
AUTO bucket モードへの/からの切り替えは Doris 4.0.4 からサポートされています。
:::

2. 固定 bucket 数から AUTO への切り替え

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS AUTO;
```
この後、新しく作成されるパーティションのバケット数は、システムによって自動的に決定されます。

3. AUTOから固定バケット数への切り替え

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 3;
```
4. LISTパーティション化テーブルのデフォルトバケット数を変更する

```sql
ALTER TABLE example_db.my_list_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 8;
```
5. RANDOM分散を持つテーブルのデフォルトバケット数を変更する

```sql
ALTER TABLE example_db.my_random_table MODIFY DISTRIBUTION DISTRIBUTED BY RANDOM BUCKETS 12;
```
6. RANDOM分散テーブルをAUTOバケットに切り替える

```sql
ALTER TABLE example_db.my_random_table MODIFY DISTRIBUTION DISTRIBUTED BY RANDOM BUCKETS AUTO;
```
7. AUTO PARTITIONテーブル（RANGE）のデフォルトバケット数を変更する

```sql
-- Original table uses AUTO PARTITION BY RANGE with BUCKETS 5
ALTER TABLE example_db.my_auto_range_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 8;

-- New auto-created partitions from subsequent INSERT will use 8 buckets
INSERT INTO example_db.my_auto_range_table VALUES ('2024-01-03', 3);
```
8. AUTO PARTITION テーブル (LIST) のデフォルトバケット数を変更する

```sql
-- Original table uses AUTO PARTITION BY LIST with BUCKETS 4
ALTER TABLE example_db.my_auto_list_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 7;

-- New auto-created partitions from subsequent INSERT will use 7 buckets
INSERT INTO example_db.my_auto_list_table VALUES ('ccc', 3);
```
9. AUTO PARTITIONテーブルをAUTOバケットから固定に切り替え、元に戻す

```sql
-- Table originally created with BUCKETS AUTO
ALTER TABLE example_db.my_auto_auto_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 5;
-- New partitions will use 5 buckets

ALTER TABLE example_db.my_auto_auto_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS AUTO;
-- New partitions will return to system-determined bucket count
```
10. 複数の連続的な変更

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 4;
ALTER TABLE example_db.my_table ADD PARTITION p2 VALUES LESS THAN ('20');
-- p2 has 4 buckets

ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS AUTO;
ALTER TABLE example_db.my_table ADD PARTITION p3 VALUES LESS THAN ('30');
-- p3 has system-determined bucket count

ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 6;
ALTER TABLE example_db.my_table ADD PARTITION p4 VALUES LESS THAN ('40');
-- p4 has 6 buckets
```
11. エラーケース

Colocateテーブルはサポートされていません：

```sql
-- This will fail with: "Cannot change default bucket number of colocate table"
ALTER TABLE example_db.my_colocate_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 10;
```
パーティション化されていないテーブルはサポートされていません：

```sql
-- This will fail with: "Only support change partitioned table's distribution"
ALTER TABLE example_db.my_unpartitioned_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 10;
```
配布タイプを変更できません:

```sql
-- Original table uses HASH distribution; changing to RANDOM will fail
-- Error: "Cannot change distribution type"
ALTER TABLE example_db.my_hash_table MODIFY DISTRIBUTION DISTRIBUTED BY RANDOM BUCKETS 10;
```
分散列を変更できません:

```sql
-- Original table uses HASH(k1); changing to HASH(k2) will fail
-- Error: "Cannot assign hash distribution with different distribution cols"
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k2) BUCKETS 10;
```
## キーワード

```text
ALTER, TABLE, DISTRIBUTION, MODIFY DISTRIBUTION, BUCKETS, ALTER TABLE
```
