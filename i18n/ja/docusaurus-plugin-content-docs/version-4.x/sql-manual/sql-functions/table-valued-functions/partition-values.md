---
{
    "title": "PARTITION_VALUES",
    "language": "ja",
    "description": "指定したテーブルのパーティション値の一覧を確認できる一時テーブルを生成するテーブル関数です。"
}
---

## 説明

指定したテーブルのパーティション値の一覧を確認できる一時テーブルを生成するテーブル関数です。

この関数は FROM 句で使用し、Hive テーブルのみをサポートします。

## 構文

```sql
PARTITION_VALUES(
    "catalog"="<catalog>",
    "database"="<database>",
    "table"="<table>"
)
```

## 必須パラメータ
| パラメータ       | 説明 |
|------------------|------------------------------------------|
| `<catalog>`  | クエリ対象クラスターのカタログ名を指定します。 |
| `<database>` | クエリ対象クラスターのデータベース名を指定します。 |
| `<table>`    | クエリ対象クラスターのテーブル名を指定します。 |

## 戻り値

クエリ対象テーブルのパーティションフィールドの数に応じて、返されるテーブルに列が含まれます。

## 例

hive3 カタログの multi_catalog データベースにある `text_partitioned_columns` テーブルの作成文は次のとおりです。

```sql
CREATE TABLE `text_partitioned_columns`(
  `t_timestamp` timestamp)
PARTITIONED BY (
 `t_int` int,
 `t_float` float,
 `t_string` string)
```

データは次のとおりです。

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

hive3 カタログの multi_catalog データベースにある `text_partitioned_columns` のパーティション値の一覧を表示します。

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
