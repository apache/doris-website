---
{
  "title": "列から行へ（横方向ビュー）",
  "language": "ja",
  "description": "EXPLODE などのジェネレータ関数と組み合わせて使用し、1つ以上の行を含む仮想テーブルを生成します。"
}
---
# Column to Row (Lateral View)

`EXPLODE`などのgenerator関数と組み合わせて使用し、1つ以上の行を含む仮想テーブルを生成します。`LATERAL VIEW`は各生の入力行に対して行を適用します。

## 文法

```sql
LATERAL VIEW  generator_function ( expression [, ...] ) table_identifier AS column_identifier [, ...]
```
## パラメータ

- generator_function

   ジェネレータ関数（EXPLODE、EXPLODE_SPLIT など）。

- table_identifier

   `generator_function` のエイリアス。

- column_identifier

   出力列を参照するために使用できる `generator_function` のリスト列エイリアス。列識別子の数は、ジェネレータ関数によって返される列数と一致する必要があります。

## 例

```sql
CREATE TABLE `person` (
  `id` int(11) NULL,
  `name` text NULL,
  `age` int(11) NULL,
  `class` int(11) NULL,
  `address` text NULL
) ENGINE=OLAP
UNIQUE KEY(`id`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1",
"in_memory" = "false",
"storage_format" = "V2",
"disable_auto_compaction" = "false"
);

INSERT INTO person VALUES
    (100, 'John', 30, 1, 'Street 1'),
    (200, 'Mary', NULL, 1, 'Street 2'),
    (300, 'Mike', 80, 3, 'Street 3'),
    (400, 'Dan', 50, 4, 'Street 4');

mysql> SELECT * FROM person
    ->     LATERAL VIEW EXPLODE(ARRAY(30, 60)) tableName AS c_age;
+------+------+------+-------+----------+-------+
| id   | name | age  | class | address  | c_age |
+------+------+------+-------+----------+-------+
|  100 | John |   30 |     1 | Street 1 |    30 |
|  100 | John |   30 |     1 | Street 1 |    60 |
|  200 | Mary | NULL |     1 | Street 2 |    30 |
|  200 | Mary | NULL |     1 | Street 2 |    60 |
|  300 | Mike |   80 |     3 | Street 3 |    30 |
|  300 | Mike |   80 |     3 | Street 3 |    60 |
|  400 | Dan  |   50 |     4 | Street 4 |    30 |
|  400 | Dan  |   50 |     4 | Street 4 |    60 |
+------+------+------+-------+----------+-------+
8 rows in set (0.12 sec)

```
