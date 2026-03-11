---
{
  "title": "更新",
  "language": "ja",
  "description": "このステートメントはデータを更新するために使用されます。UPDATEステートメントは現在UNIQUE KEYモデルのみをサポートしています。"
}
---
## 詳細

このステートメントはデータの更新に使用されます。UPDATE ステートメントは現在 UNIQUE KEY モデルのみをサポートしています。

UPDATE 操作は現在 Value カラムの更新のみをサポートしています。Key カラムの更新については [Using FlinkCDC to update Key column](../../../../ecosystem/flink-doris-connector.md#use-flink-cdc-to-update-key-column) を参照してください。

#### Syntax

```sql
[cte]
UPDATE target_table [table_alias]
    SET assignment_list
    [ FROM additional_tables]
    WHERE condition
```
#### 必須パラメータ

+ target_table: 更新するデータの対象テーブル。'db_name.table_name'の形式で指定可能
+ assignment_list: 更新する対象列。'col_name = value, col_name = value'の形式で指定
+ where condition: 更新対象の条件。trueまたはfalseを返す式を指定可能

#### オプションパラメータ

+ cte: Common Table Expression。例: 'WITH a AS SELECT * FROM tbl'
+ table_alias: テーブルのエイリアス
+ FROM additional_tables: 更新する行の選択や新しい値の設定に使用する1つ以上のテーブルを指定。対象テーブルをここで使用する場合は、明示的にエイリアスを指定する必要があります。

#### 注意

現在のUPDATE文は、UNIQUE KEYモデルでの行更新のみをサポートしています。

## 例

`test`テーブルはuniqueモデルテーブルで、k1、k2、v1、v2の4つの列を含みます。k1、k2はキー、v1、v2は値で、集約方法はReplaceです。

1. 'test'テーブルでk1 =1、k2 =2の条件を満たすv1列を1に更新

```sql
UPDATE test SET v1 = 1 WHERE k1=1 and k2=2;
```
2. 'test'テーブルのk1=1の列のv1列を1だけインクリメントする

```sql
UPDATE test SET v1 = v1+1 WHERE k1=1;
```
3. `t2`と`t3`の結合結果を使用して`t1`を更新する

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
期待される結果は、テーブルt1でid = 1の行のみを更新することです

```
+----+----+----+--------+------------+
| id | c1 | c2 | c3     | c4         |
+----+----+----+--------+------------+
| 1  | 10 | 1  | 1000.0 | 2000-01-01 |
| 2  | 2  | 2  |    2.0 | 2000-01-02 |
| 3  | 3  | 3  |    3.0 | 2000-01-03 |
+----+----+----+--------+------------+
```
4. cteを使用する

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
## キーワード

    UPDATE

## ベストプラクティス
