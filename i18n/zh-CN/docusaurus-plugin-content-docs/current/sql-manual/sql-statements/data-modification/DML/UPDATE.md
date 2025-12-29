---
{
    "title": "UPDATE",
    "language": "zh-CN",
    "description": "该语句是为进行对数据进行更新的操作，UPDATE 语句目前仅支持 UNIQUE KEY 模型。"
}
---

## 描述

该语句是为进行对数据进行更新的操作，UPDATE 语句目前仅支持 UNIQUE KEY 模型。

UPDATE 操作目前只支持更新 Value 列，Key 列的更新可参考[使用 FlinkCDC 更新 Key 列](../../../../ecosystem/flink-doris-connector.md#使用flinkcdc更新key列)。

## 语法

```sql
[cte]
UPDATE target_table [table_alias]
    SET assignment_list
    [ FROM additional_tables]
    WHERE condition
```

#### Required Parameters

+ target_table: 待更新数据的目标表。可以是 'db_name.table_name' 形式
+ assignment_list: 待更新的目标列，形如 'col_name = value, col_name = value' 格式
+ WHERE condition: 期望更新的条件，一个返回 true 或者 false 的表达式即可

#### Optional Parameters

+ cte: 通用表达式。可以是 'WITH a AS SELECT * FROM tbl' 形式
+ table_alias: 表的别名
+ FROM additional_tables: 指定一个或多个表，用于选中更新的行，或者获取更新的值。注意，如需要在此列表中再次使用目标表，需要为其显式指定别名。

#### Note

当前 UPDATE 语句仅支持在 UNIQUE KEY 模型上的行更新。

## 示例

`test` 表是一个 unique 模型的表，包含：k1, k2, v1, v2  四个列。其中 k1, k2 是 key，v1, v2 是 value，聚合方式是 Replace。

1. 将 'test' 表中满足条件 k1 =1 , k2 =2 的 v1 列更新为 1

```sql
UPDATE test SET v1 = 1 WHERE k1=1 and k2=2;
```

2. 将 'test' 表中 k1=1 的列的 v1 列自增 1

```sql
UPDATE test SET v1 = v1+1 WHERE k1=1;
```

3. 使用`t2`和`t3`表连接的结果，更新`t1`

```sql
-- 创建 t1, t2, t3 三张表
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

-- 插入数据
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

-- 更新 t1
UPDATE t1
  SET t1.c1 = t2.c1, t1.c3 = t2.c3 * 100
  FROM t2 INNER JOIN t3 ON t2.id = t3.id
  WHERE t1.id = t2.id;
```

预期结果为，更新了`t1`表`id`为`1`的列

```
+----+----+----+--------+------------+
| id | c1 | c2 | c3     | c4         |
+----+----+----+--------+------------+
| 1  | 10 | 1  | 1000.0 | 2000-01-01 |
| 2  | 2  | 2  |    2.0 | 2000-01-02 |
| 3  | 3  | 3  |    3.0 | 2000-01-03 |
+----+----+----+--------+------------+
```

4. 使用 cte 更新表

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

## 关键词

    UPDATE
