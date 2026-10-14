---
{
    "title": "UPDATE",
    "language": "ja",
    "description": "この文はデータの更新に使用します。UPDATE 文は現在、UNIQUE KEY モデルのみをサポートしています。"
}
---

## 説明

この文はデータの更新に使用します。UPDATE 文は現在、UNIQUE KEY モデルのみをサポートしています。

UPDATE 操作では現在、Value カラムの更新のみをサポートしています。Key カラムの更新については、[FlinkCDC を使用した Key カラムの更新](../../../../connection-integration/data-integration/flink-doris-connector.md#updating-key-columns-with-flink-cdc)を参照してください。
#### 構文

```sql
[cte]
UPDATE target_table [table_alias]
    SET assignment_list
    [ FROM additional_tables]
    [WHERE condition]
    [ORDER BY column [ASC | DESC] [NULLS FIRST | NULLS LAST] [, ...]]
    [LIMIT [offset,] count]
```

#### 必須パラメータ

+ target_table: 更新対象のテーブル。'db_name.table_name' の形式でも指定できます。
+ assignment_list: 更新対象のカラムと値。'col_name = value, col_name = value' の形式で指定します。

#### 任意パラメータ

+ cte: 共通テーブル式（CTE）。例: 'WITH a AS SELECT * FROM tbl'
+ table_alias: テーブルのエイリアス。
+ FROM additional_tables: 更新対象の行の選択や新しい値の設定に使用する、一つ以上のテーブルを指定します。ここで更新対象のテーブルを使用する場合は、明示的にエイリアスを付けてください。
+ WHERE condition: 更新対象を決める条件。真または偽を返す式を指定します。
+ ORDER BY column: 行を更新する順序を指定します。通常は LIMIT と組み合わせて、更新対象の行を制御します。
+ LIMIT [offset,] count: 更新する行数を制限します。ORDER BY と組み合わせた場合は、並べ替え後の先頭 `count` 行を更新します。`offset` を指定した場合は、先頭の `offset` 行をスキップしてから更新します。ORDER BY を指定せずに使用すると、更新対象の行は非決定的になります。

#### 注意事項

現在の UPDATE 文は、UNIQUE KEY モデルの行の更新のみをサポートしています。

`WHERE` と `LIMIT` のどちらも指定しない場合は、テーブルのすべての行が更新されます。`WHERE` 句を省略する前に、意図した更新範囲を必ず確認してください。

## 例

`test` テーブルは、k1、k2、v1、v2 の四つのカラムを持つ UNIQUE KEY モデルのテーブルです。k1 と k2 は Key カラム、v1 と v2 は Value カラムで、集約方法は Replace です。

1. 'test' テーブルで k1 =1 , k2 =2 の条件を満たす行の v1 カラムを 1 に更新します。

```sql
UPDATE test SET v1 = 1 WHERE k1=1 and k2=2;
```

2. 'test' テーブルで k1=1 の行の v1 カラムを 1 増やします。

```sql
UPDATE test SET v1 = v1+1 WHERE k1=1;
```

3. `t2` と `t3` の結合結果を使用して `t1` を更新します。

```sql
-- create t1, t2, t3 tables
CREATE TABLE t1
  (id INT, c1 BIGINT, c2 STRING, c3 DOUBLE, c4 DATE)
UNIQUE KEY (id)
DISTRIBUTED BY HASH (id)
PROPERTIES('replication_num'='1', "function_column.sequence_col" = "c4");

CREATE TABLE t2
  (id INT, c1 BIGINT, c2 STRING, c3 DOUBLE, c4 DATE)
DISTRIBUTED BY HASH (id)
PROPERTIES('replication_num'='1');

CREATE TABLE t3
  (id INT)
DISTRIBUTED BY HASH (id)
PROPERTIES('replication_num'='1');

-- insert data
INSERT INTO t1 VALUES
  (1, 1, '1', 1.0, '2000-01-01'),
  (2, 2, '2', 2.0, '2000-01-02'),
  (3, 3, '3', 3.0, '2000-01-03');

INSERT INTO t2 VALUES
  (1, 10, '10', 10.0, '2000-01-10'),
  (2, 20, '20', 20.0, '2000-01-20'),
  (3, 30, '30', 30.0, '2000-01-30'),
  (4, 4, '4', 4.0, '2000-01-04'),
  (5, 5, '5', 5.0, '2000-01-05');

INSERT INTO t3 VALUES
  (1),
  (4),
  (5);

-- update t1
UPDATE t1
  SET t1.c1 = t2.c1, t1.c3 = t2.c3 * 100
  FROM t2 INNER JOIN t3 ON t2.id = t3.id
  WHERE t1.id = t2.id;
```

期待される結果は、t1 テーブルの id = 1 の行のみが更新されることです。

```
+----+----+----+--------+------------+
| id | c1 | c2 | c3     | c4         |
+----+----+----+--------+------------+
| 1  | 10 | 1  | 1000.0 | 2000-01-01 |
| 2  | 2  | 2  |    2.0 | 2000-01-02 |
| 3  | 3  | 3  |    3.0 | 2000-01-03 |
+----+----+----+--------+------------+
```

4. cte を使用します。

```sql
create table orders(
    o_orderkey bigint,
    o_totalprice decimal(15, 2)
) unique key(o_orderkey)
distributed by hash(o_orderkey) buckets 1 
properties (
    "replication_num" = "1"
);

insert into orders values
(1, 34.1),
(2, 432.8);

create table lineitem(
    l_linenumber int,
    o_orderkey bigint,
    l_discount  decimal(15, 2)
) unique key(l_linenumber)
distributed by hash(l_linenumber) buckets 1 
properties (
    "replication_num" = "1"
);

insert into lineitem values
(1, 1, 1.23),
(2, 1, 3.21),
(3, 2, 18.08),
(4, 2, 23.48);

with discount_orders as (
    select * from orders 
    where o_totalprice > 100
)
update lineitem  set l_discount = l_discount*0.9
from discount_orders 
where lineitem.o_orderkey = discount_orders.o_orderkey;
```

5. ORDER BY と LIMIT を使用して、k1 > 0 の行のうち v1 の値が最も大きい先頭 3 行の v1 カラムを 0 に更新します。

```sql
UPDATE test SET v1 = 0 WHERE k1 > 0 ORDER BY v1 DESC LIMIT 3;
```

6. ORDER BY、LIMIT、オフセットを使用して、k1 順の先頭 10 行をスキップし、続く 5 行を更新します。

```sql
UPDATE test SET v1 = 100 ORDER BY k1 ASC LIMIT 10, 5;
```

## キーワード

    UPDATE

## ベストプラクティス

