---
{
    "title": "DELETE",
    "language": "zh-CN",
    "description": "该语句用于按条件删除指定 table（base index）partition 中的数据。"
}
---

## 描述

该语句用于按条件删除指定 table（base index）partition 中的数据。

该操作会同时删除和此 base index 相关的 rollup index 的数据。

## 语法

语法一：该语法只能指定过滤谓词

```SQL
DELETE FROM table_name [table_alias] [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
WHERE
column_name op { value | value_list } [ AND column_name op { value | value_list } ...];
```

语法二：该语法只能在 UNIQUE KEY 模型表上使用

```sql
[cte]
DELETE FROM table_name [table_alias]
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    [USING additional_tables]
    WHERE condition
```

#### Required Parameters

+ table_name: 指定需要删除数据的表
+ column_name: 属于 table_name 的列
+ op: 逻辑比较操作符，可选类型包括：=, >, <, >=, <=, !=, in, not in
+ value | value_list: 做逻辑比较的值或值列表
+ WHERE condition: 指定一个用于选择删除行的条件

#### Optional Parameters

+ cte: 通用表达式。可以是 'WITH a AS SELECT * FROM tbl' 形式
+ PARTITION partition_name | PARTITIONS (partition_name [, partition_name]): 指定执行删除数据的分区名，如果表不存在此分区，则报错
+ table_alias: 表的别名
+ USING additional_tables: 如果需要在 WHERE 语句中使用其他的表来帮助识别需要删除的行，则可以在 USING 中指定这些表或者查询。

#### Note

1. 使用聚合类的表模型（AGGREGATE、UNIQUE）只能指定 key 列上的条件。
2. 当选定的 key 列不存在于某个 rollup 中时，无法进行 delete。
3. 语法一中，条件之间只能是“与”的关系。若希望达成“或”的关系，需要将条件分写在两个 DELETE 语句中。
4. 语法一中，如果为分区表，需要指定分区，如果不指定，doris 会从条件中推断出分区。两种情况下，doris 无法从条件中推断出分区：1) 条件中不包含分区列；2) 分区列的 op 为 not in。如果分区表不是 Unique 表，当分区表未指定分区，或者无法从条件中推断分区的时候，需要设置会话变量 delete_without_partition 为 true，此时 delete 会应用到所有分区。
5. 该语句可能会降低执行后一段时间内的查询效率。影响程度取决于语句中指定的删除条件的数量。指定的条件越多，影响越大。

## 示例

1. 删除 my_table partition p1 中 k1 列值为 3 的数据行
    
    ```sql
    DELETE FROM my_table PARTITION p1
        WHERE k1 = 3;
    ```
    
2. 删除 my_table partition p1 中 k1 列值大于等于 3 且 k2 列值为 "abc" 的数据行
    
    ```sql
    DELETE FROM my_table PARTITION p1
    WHERE k1 >= 3 AND k2 = "abc";
    ```
    
3. 删除 my_table partition p1, p2 中 k1 列值大于等于 3 且 k2 列值为 "abc" 的数据行
    
    ```sql
    DELETE FROM my_table PARTITIONS (p1, p2)
    WHERE k1 >= 3 AND k2 = "abc";
    ```

4. 使用`t2`和`t3`表连接的结果，删除`t1`中的数据，删除的表只支持 unique 模型

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
   
   -- 删除 t1 中的数据
   DELETE FROM t1
     USING t2 INNER JOIN t3 ON t2.id = t3.id
     WHERE t1.id = t2.id;
   ```
   
   预期结果为，删除了`t1`表`id`为`1`的列
   
   ```
   +----+----+----+--------+------------+
   | id | c1 | c2 | c3     | c4         |
   +----+----+----+--------+------------+
   | 2  | 2  | 2  |    2.0 | 2000-01-02 |
   | 3  | 3  | 3  |    3.0 | 2000-01-03 |
   +----+----+----+--------+------------+
   ```

5. 使用 cte 关联删除

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
   delete from lineitem
   using discount_orders
   where lineitem.o_orderkey = discount_orders.o_orderkey;
   ```

## 关键词

    DELETE

### 最佳实践

