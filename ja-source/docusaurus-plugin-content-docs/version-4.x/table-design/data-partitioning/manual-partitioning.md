---
{
  "title": "手動パーティショニング",
  "language": "ja",
  "description": "パーティション列は通常、古いデータと新しいデータの便利な管理のための時間列です。RANGEパーティショニングは、DATEなどの列タイプをサポートします。"
}
---
## パーティション列

- パーティション列は1つまたは複数の列として指定することができ、パーティション列はKEY列である必要があります。

- `allow_partition_column_nullable`がtrueに設定されている場合、RangeパーティションはNULLパーティション列の使用をサポートします。List パーティションはNULLパーティション列を常にサポートしません。

- パーティション列のタイプに関わらず、パーティション値を記述する際は二重引用符が必要です。

- パーティション数に理論的な上限はありません。ただし、各テーブルはデフォルトで4096パーティションに制限されています。この制限を超える場合は、FE設定パラメータ`max_multi_partition_num`および`max_dynamic_partition_num`を変更できます。

- パーティション化せずにテーブルを作成する場合、システムは自動的にテーブル名と同じ名前の全範囲パーティションを生成します。このパーティションはユーザーからは見えず、削除や変更はできません。

- パーティションを作成する際、重複する範囲は許可されません。

## RANGEパーティショニング

パーティション列は通常、古いデータと新しいデータの便利な管理のための時間列です。RANGEパーティショニングは`DATE`、`DATETIME`、`TINYINT`、`SMALLINT`、`INT`、`BIGINT`、`LARGEINT`などの列タイプをサポートします。

パーティション情報は以下の4つの記述方法をサポートします：

- `FIXED RANGE`：この方法はパーティションを左閉右開区間として定義します。

```sql
PARTITION BY RANGE(col1[, col2, ...])                                                                                                                                                                                                  
(                                                                                                                                                                                                                                      
    PARTITION partition_name1 VALUES [("k1-lower1", "k2-lower1", "k3-lower1",...), ("k1-upper1", "k2-upper1", "k3-upper1", ...)),                                                                                                      
    PARTITION partition_name2 VALUES [("k1-lower1-2", "k2-lower1-2", ...), ("k1-upper1-2", MAXVALUE, ))                                                                                                                                
)                                                                                                                                                                                                                                      
```
例えば：

```sql
PARTITION BY RANGE(`date`)
(
    PARTITION `p201701` VALUES [("2017-01-01"),  ("2017-02-01")),
    PARTITION `p201702` VALUES [("2017-02-01"), ("2017-03-01")),
    PARTITION `p201703` VALUES [("2017-03-01"), ("2017-04-01"))
)
```
- `LESS THAN`: この方法はパーティションの上限のみを定義します。下限は前のパーティションの上限によって決定されます。

```sql
PARTITION BY RANGE(col1[, col2, ...])                                                                                                                                                                                                  
(                                                                                                                                                                                                                                      
    PARTITION partition_name1 VALUES LESS THAN MAXVALUE | ("value1", "value2", ...),                                                                                                                                                     
    PARTITION partition_name2 VALUES LESS THAN MAXVALUE | ("value1", "value2", ...)                                                                                                                                                      
)                                                                                                                                                                                                                                      
```
例えば：

```sql
PARTITION BY RANGE(`date`)
(
    PARTITION `p201701` VALUES LESS THAN ("2017-02-01"),
    PARTITION `p201702` VALUES LESS THAN ("2017-03-01"),
    PARTITION `p201703` VALUES LESS THAN ("2017-04-01")
)

PARTITION BY RANGE(`date`)
(
    PARTITION `p201701` VALUES LESS THAN ("2017-02-01"),
    PARTITION `p201702` VALUES LESS THAN ("2017-03-01"),
    PARTITION `p201703` VALUES LESS THAN ("2017-04-01")
    PARTITION `other` VALUES LESS THAN (MAXVALUE)
)
```
- `BATCH RANGE`: この方式は数値または時間の範囲に基づいてパーティションをバッチ作成し、パーティションを左閉右開区間として定義し、ステップサイズを設定します。

```sql
PARTITION BY RANGE(int_col)                                                                                                                                                                                                            
(                                                                                                                                                                                                                                      
    FROM (start_num) TO (end_num) INTERVAL interval_value                                                                                                                                                                                                   
)

PARTITION BY RANGE(date_col)                                                                                                                                                                                                            
(                                                                                                                                                                                                                                      
    FROM ("start_date") TO ("end_date") INTERVAL num YEAR | num MONTH | num WEEK | num DAY ｜ 1 HOUR                                                                                                                                                                                                   
)                                                                                                                                                                                                                                    
```
例えば：

```sql
PARTITION BY RANGE(age)
(
    FROM (1) TO (100) INTERVAL 10
)

PARTITION BY RANGE(`date`)
(
    FROM ("2000-11-14") TO ("2021-11-14") INTERVAL 2 YEAR
)
```
- `MULTI RANGE`: この方法は範囲パーティショニングに基づいてパーティションをバッチ作成し、パーティションを左閉右開区間として定義します。例:

```sql
PARTITION BY RANGE(col)                                                                                                                                                                                                                
(                                                                                                                                                                                                                                      
   FROM ("2000-11-14") TO ("2021-11-14") INTERVAL 1 YEAR,                                                                                                                                                                              
   FROM ("2021-11-14") TO ("2022-11-14") INTERVAL 1 MONTH,                                                                                                                                                                             
   FROM ("2022-11-14") TO ("2023-01-03") INTERVAL 1 WEEK,                                                                                                                                                                              
   FROM ("2023-01-03") TO ("2023-01-14") INTERVAL 1 DAY,
   PARTITION p_20230114 VALUES [('2023-01-14'), ('2023-01-15'))                                                                                                                                                                                
)                                                                                                                                                                                                                                      
```
## LIST パーティショニング

LIST パーティショニングに基づくパーティション列は、`BOOLEAN`、`TINYINT`、`SMALLINT`、`INT`、`BIGINT`、`LARGEINT`、`DATE`、`DATETIME`、`CHAR`、`VARCHAR` などのデータ型をサポートします。パーティション値は列挙値です。データが対象パーティションの列挙値のいずれかである場合のみ、そのパーティションがヒットします。

パーティションは、`VALUES IN (...)` を通じて各パーティションに含まれる列挙値の指定をサポートします。

例：

```sql
PARTITION BY LIST(city)
(
    PARTITION `p_cn` VALUES IN ("Beijing", "Shanghai", "Hong Kong"),
    PARTITION `p_usa` VALUES IN ("New York", "San Francisco"),
    PARTITION `p_jp` VALUES IN ("Tokyo")
)
```
LIST パーティショニングは、マルチカラムパーティショニングもサポートしています。例えば：

```sql
PARTITION BY LIST(id, city)
(
    PARTITION p1_city VALUES IN (("1", "Beijing"), ("1", "Shanghai")),
    PARTITION p2_city VALUES IN (("2", "Beijing"), ("2", "Shanghai")),
    PARTITION p3_city VALUES IN (("3", "Beijing"), ("3", "Shanghai"))
)
```
## NULL パーティショニング

NULL パーティショニングに基づくパーティション列は、デフォルトでは not null 列である必要があります。null 列を使用する必要がある場合は、セッション変数 `allow_partition_column_nullable` を `true` に設定してください。LIST パーティショニングでは NULL パーティショニングがサポートされていますが、RANGE パーティショニングでは null 値は `less than` パーティションに割り当てられます。列は以下の通りです：

**LIST パーティショニング**

```sql
mysql> create table null_list(
    -> k0 varchar null
    -> )
    -> partition by list (k0)
    -> (
    -> PARTITION pX values in ((NULL))
    -> )
    -> DISTRIBUTED BY HASH(`k0`) BUCKETS 1
    -> properties("replication_num" = "1");
Query OK, 0 rows affected (0.11 sec)

mysql> insert into null_list values (null);
Query OK, 1 row affected (0.19 sec)

mysql> select * from null_list;
+------+
| k0   |
+------+
| NULL |
+------+
1 row in set (0.18 sec)
```
**`less than`パーティションを使用したRANGEパーティショニング**

```sql
mysql> create table null_range(
    -> k0 int null
    -> )
    -> partition by range (k0)
    -> (
    -> PARTITION p10 values less than (10),
    -> PARTITION p100 values less than (100),
    -> PARTITION pMAX values less than (maxvalue)
    -> )
    -> DISTRIBUTED BY HASH(`k0`) BUCKETS 1
    -> properties("replication_num" = "1");
Query OK, 0 rows affected (0.12 sec)

mysql> insert into null_range values (null);
Query OK, 1 row affected (0.19 sec)

mysql> select * from null_range partition(p10);
+------+
| k0   |
+------+
| NULL |
+------+
1 row in set (0.18 sec)
```
**`less than`パーティションを使用しないRANGEパーティショニング**

```sql
mysql> create table null_range2(
    -> k0 int null
    -> )
    -> partition by range (k0)
    -> (
    -> PARTITION p200 values [("100"), ("200"))
    -> )
    -> DISTRIBUTED BY HASH(`k0`) BUCKETS 1
    -> properties("replication_num" = "1");
Query OK, 0 rows affected (0.13 sec)

mysql> insert into null_range2 values (null);
ERROR 5025 (HY000): Insert has filtered data in strict mode, tracking_url=......
```
