---
{
  "title": "一時パーティション",
  "description": "Dorisはパーティションtableへの一時パーティションの追加をサポートしています。",
  "language": "ja"
}
---
Dorisは、パーティション化されたtableに一時的なパーティションを追加することをサポートしています。一時的なパーティションは、通常のクエリでは取得されず、特別なクエリ文を通してのみクエリできる点で、通常のパーティションとは異なります。

- 一時的なパーティションのパーティション列は通常のパーティションと同じであり、変更することはできません。

- すべての一時的なパーティションのパーティション範囲は重複できませんが、一時的なパーティションと通常のパーティションの範囲は重複できます。

- 一時的なパーティションの名前は、通常のパーティションや他の一時的なパーティションの名前と重複することはできません。

**一時的なパーティションの主な利用シナリオ:**

- **アトミックな上書き操作**: ユーザーは、古いデータを削除してから新しいデータをインポートする間のデータ損失なしに、パーティションのデータを書き換えることができます。この場合、一時的なパーティションを作成し、新しいデータを一時的なパーティションにインポートし、replace操作を通して元のパーティションをアトミックに置き換えることができます。パーティション化されていないtableでのアトミックな上書き操作については、[replace table documentation](../../data-operate/delete/atomicity-replace)を参照してください。

- **バケット数の変更**: パーティション作成時に不適切なバケット数が使用された場合、指定された新しいバケット数で新しい一時的なパーティションを作成できます。その後、`INSERT INTO`コマンドを使用して通常のパーティションのデータを一時的なパーティションにインポートし、replace操作を通して元のパーティションをアトミックに置き換えることができます。

- **パーティションのマージまたは分割**: ユーザーは、2つのパーティションをマージしたり、大きなパーティションを複数の小さなパーティションに分割するなど、パーティション範囲を変更できます。新しい一時的なパーティションを作成し、`INSERT INTO`コマンドを使用して通常のパーティションのデータを一時的なパーティションにインポートし、replace操作を通して元のパーティションをアトミックに置き換えることができます。

## 一時的なパーティションの追加

`ALTER TABLE ADD TEMPORARY PARTITION`文を使用して一時的なパーティションを追加します:

```sql
ALTER TABLE tbl1 ADD TEMPORARY PARTITION tp1 VALUES LESS THAN("2020-02-01");

ALTER TABLE tbl2 ADD TEMPORARY PARTITION tp1 VALUES [("2020-01-01"), ("2020-02-01"));

ALTER TABLE tbl1 ADD TEMPORARY PARTITION tp1 VALUES LESS THAN("2020-02-01")
("replication_num" = "1")
DISTRIBUTED BY HASH(k1) BUCKETS 5;

ALTER TABLE tbl3 ADD TEMPORARY PARTITION tp1 VALUES IN ("Beijing", "Shanghai");

ALTER TABLE tbl4 ADD TEMPORARY PARTITION tp1 VALUES IN ((1, "Beijing"), (1, "Shanghai"));

ALTER TABLE tbl3 ADD TEMPORARY PARTITION tp1 VALUES IN ("Beijing", "Shanghai")
("replication_num" = "1")
DISTRIBUTED BY HASH(k1) BUCKETS 5;
```
## Drop Temporary パーティション

`ALTER TABLE DROP TEMPORARY PARTITION`文を使用して一時パーティションを削除します：

```sql
ALTER TABLE tbl1 DROP TEMPORARY PARTITION tp1;
```
## Replace Regular パーティション

`ALTER TABLE REPLACE PARTITION`文を使用して、通常のパーティションを一時的なパーティションで置き換えます：

```sql
ALTER TABLE tbl1 REPLACE PARTITION (p1) WITH TEMPORARY PARTITION (tp1);

ALTER TABLE tbl1 REPLACE PARTITION (p1, p2) WITH TEMPORARY PARTITION (tp1, tp2, tp3);

ALTER TABLE tbl1 REPLACE PARTITION (p1, p2) WITH TEMPORARY PARTITION (tp1, tp2)
PROPERTIES (
  "strict_range" = "false",
  "use_temp_partition_name" = "true"
);
```
replace操作には2つの特別なオプションパラメータがあります：

**1. `strict_range`**

デフォルトはtrueです。

Rangeパーティションの場合、このパラメータがtrueのとき、置換されるすべての通常パーティションの範囲の和集合は、置換する一時パーティションの範囲の和集合と完全に同一である必要があります。falseに設定された場合、置換後に新しい通常パーティションの範囲が重複しないことを保証するだけで済みます。

Listパーティションの場合、このパラメータは常にtrueです。置換されるすべての通常パーティションの列挙値は、置換する一時パーティションの列挙値と完全に同一である必要があります。

**例 1**

```sql
-- The range of partitions p1, p2, p3 to be replaced (=> union):
[10, 20), [20, 30), [40, 50) => [10, 30), [40, 50)

-- The range of replacing partitions tp1, tp2 (=> union):
[10, 30), [40, 45), [45, 50) => [10, 30), [40, 50)

-- The union of ranges is the same, so tp1 and tp2 can replace p1, p2, p3.
```
**例2**

```sql
-- The range of partition p1 to be replaced (=> union):
[10, 50) => [10, 50)

-- The range of replacing partitions tp1, tp2 (=> union):
[10, 30), [40, 50) => [10, 30), [40, 50)

-- The union of ranges is not the same. If strict_range is true, tp1 and tp2 cannot replace p1. If it is false, and the ranges of the two partitions after replacement [10, 30), [40, 50) do not overlap with other regular partitions, they can replace p1.
```
**例 3**

```sql
-- The enumeration values of partitions p1, p2 to be replaced (=> union):
(1, 2, 3), (4, 5, 6) => (1, 2, 3, 4, 5, 6)

-- The enumeration values of replacing partitions tp1, tp2, tp3 (=> union):
(1, 2, 3), (4), (5, 6) => (1, 2, 3, 4, 5, 6)

-- The union of enumeration values is the same, so tp1, tp2, tp3 can replace p1, p2.
```
**例4**

```sql
-- The enumeration values of partitions p1, p2, p3 to be replaced (=> union):
(("1","beijing"), ("1", "shanghai")), (("2","beijing"), ("2", "shanghai")), (("3","beijing"), ("3", "shanghai")) => (("1","beijing"), ("1", "shanghai"), ("2","beijing"), ("2", "shanghai"), ("3","beijing"), ("3", "shanghai"))

-- The enumeration values of replacing partitions tp1, tp2 (=> union):
(("1","beijing"), ("1", "shanghai")), (("2","beijing"), ("2", "shanghai"), ("3","beijing"), ("3", "shanghai")) => (("1","beijing"), ("1", "shanghai"), ("2","beijing"), ("2", "shanghai"), ("3","beijing"), ("3", "shanghai"))

-- The union of enumeration values is the same, so tp1, tp2 can replace p1, p2, p3.
```
**2. `use_temp_partition_name`**

デフォルトは false です。

このパラメータが false で、置換対象のパーティション数と置換するパーティション数が同じ場合、置換後のパーティション名は変更されません。

true の場合、置換後のパーティション名は置換するパーティションの名前になります。例は以下の通りです：

**例 1**

```sql
ALTER TABLE tbl1 REPLACE PARTITION (p1) WITH TEMPORARY PARTITION (tp1);
```
- `use_temp_partition_name`はデフォルトでfalseに設定されているため、置換後はパーティション名はp1のまま残りますが、データとプロパティはtp1のものに置き換えられます。
- `use_temp_partition_name`がtrueの場合、置換後はパーティション名はtp1となり、p1は存在しなくなります。

**例2**

```sql
ALTER TABLE tbl1 REPLACE PARTITION (p1, p2) WITH TEMPORARY PARTITION (tp1);
```
- `use_temp_partition_name`のデフォルト値はfalseですが、置換対象のパーティション数と置換するパーティション数が異なるため、このパラメータは無効です。置換後、パーティション名はtp1となり、p1とp2は存在しなくなります。

:::tip
**replace操作の説明:**

パーティション置換が成功した後、置換されたパーティションは削除され、復元することはできません。
:::

## 一時パーティションのインポート

一時パーティションのインポートを指定する構文は、インポート方法によって若干異なります。例は以下の通りです:

```sql
INSERT INTO tbl TEMPORARY PARTITION(tp1, tp2, ...) SELECT ....
curl --location-trusted -u root: -H "label:123" -H "temporary_partitions: tp1, tp2, ..." -T testData http://host:port/api/testDb/testTbl/_stream_load    
LOAD LABEL example_db.label1
(
DATA INFILE("hdfs://hdfs_host:hdfs_port/user/palo/data/input/file")
INTO TABLE my_table
TEMPORARY PARTITION (tp1, tp2, ...)
...
)
WITH BROKER hdfs ("username"="hdfs_user", "password"="hdfs_password");
CREATE ROUTINE LOAD example_db.test1 ON example_tbl
COLUMNS(k1, k2, k3, v1, v2, v3 = k1 * 100),
TEMPORARY PARTITIONS(tp1, tp2, ...),
WHERE k1 > 100
PROPERTIES
(...)
FROM KAFKA
(...);
```
## Query Temporary パーティション

```sql
SELECT ... FROM
tbl1 TEMPORARY PARTITION(tp1, tp2, ...)
JOIN
tbl2 TEMPORARY PARTITION(tp1, tp2, ...)
ON ...
WHERE ...;
```
## 他の操作との関係

**DROP**

- Drop操作を使用してデータベースやTableを直接削除した後、そのデータベースやTableはRecoverコマンドを使用して復旧できますが（制限時間内）、一時パーティションは復旧されません。

- Alterコマンドを使用して通常のパーティションを削除した後、そのパーティションはRecoverコマンドを使用して復旧できます（制限時間内）。この操作は一時パーティションとは関係ありません。

- Alterコマンドを使用して一時パーティションを削除した後、その一時パーティションはRecoverコマンドを使用して復旧することはできません。

**TRUNCATE**

- Truncateコマンドを使用してTableを空にすると、そのTableの一時パーティションが削除され、復旧することはできません。

- Truncateコマンドを使用して通常のパーティションを空にしても、一時パーティションには影響しません。

- Truncateコマンドは一時パーティションを空にするために使用することはできません。

**ALTER**

- Tableに一時パーティションがある場合、Alterコマンドを使用してそのTableに対してSchema Change、Rollup、またはその他の変更操作を実行することはできません。

- Tableが変更操作中の場合、そのTableに一時パーティションを追加することはできません。

```
