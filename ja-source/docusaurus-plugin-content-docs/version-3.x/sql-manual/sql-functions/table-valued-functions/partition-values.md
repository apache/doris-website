---
{
  "title": "PARTITION_VALUES",
  "description": "特定のTABLEのパーティション値のリストを表示できるよう、パーティション値の一時tableを生成するtable関数。",
  "language": "ja"
}
---
## 説明

特定のTABLEのパーティション値のリストを表示することができる、パーティション値の一時tableを生成するtable関数です。

この関数はFROM句で使用され、hiveTableのみをサポートします。

## 構文

```sql
PARTITION_VALUES(
    "catalog"="<catalog>",
    "database"="<database>",
    "table"="<table>"
)
```
## 必須パラメータ
| Field               | デスクリプション                                       |
|------------------|------------------------------------------|
| `<catalog>`  | クエリ対象のクラスターのカタログ名を指定します。                     |
| `<database>` | クエリ対象のクラスターのデータベース名を指定します。                           |
| `<table>`    | クエリ対象のクラスターのTable名を指定します。                             |

## 戻り値

クエリ対象のTableには複数のパーティションフィールドがあり、それに応じてTableには複数の列が含まれます。

## 例

multi_catalogのhive3 CATALOGにおける`text_partitioned_columns`のTable作成文は以下の通りです：

```sql
CREATE TABLE `text_partitioned_columns`(
  `t_timestamp` timestamp)
PARTITIONED BY (
 `t_int` int,
 `t_float` float,
 `t_string` string)
```
データは以下の通りです：

```text
mysql> select * from text_partitioned_columns;
+----------------------------+-------+---------+----------+
| t_timestamp                | t_int | t_float | t_string |
+----------------------------+-------+---------+----------+
| 2023-01-01 00:00:00.000000 |  NULL |     0.1 | test1    |
| 2023-01-02 00:00:00.000000 |  NULL |     0.2 | test2    |
| 2023-01-03 00:00:00.000000 |   100 |     0.3 | test3    |
+----------------------------+-------+---------+----------+
```
hive3 CATALOG の multi_catalog 下にある `text_partitioned_columns` のパーティション値のリストを表示します：

```sql
select * from partition_values("catalog"="hive3", "database" = "multi_catalog","table" = "text_partitioned_columns");
```
```text
+-------+---------+----------+
| t_int | t_float | t_string |
+-------+---------+----------+
|   100 |     0.3 | test3    |
|  NULL |     0.2 | test2    |
|  NULL |     0.1 | test1    |
+-------+---------+----------+
```
