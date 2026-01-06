---
{
    "title": "主键模型的多流更新",
    "language": "zh-CN"
}
---

## 概览
Doris的unique表为了保证了replace的并发冲突，提供了按照sequence列更新的功能。即在相同key列下，replace聚合类型的列将按照sequence列的值进行替换，较大值可以替换较小值，反之则不可以。但在有些业务场景中，业务需要通过两条或者多条数据流，对同一个大宽表中的不同列进行更新。 比如一条数据流会实时写入，更新这张表的部分字段；另一条数据流按需执行导入，更新这张表的其他列。在更新时，这两流作业都需要保证replace的先后顺序；而且在查询时需要对所有列的数据能够进行查询。

## sequence mapping
为了解决上述的问题，doris支持了sequence mapping的功能。该功能通过指定更新列对应的sequence column映射关系来解决多流的并发更新问题。

| A | B | C | D | E | s1 | s2 |
|---|---|---|---|---|----|----|

假设上面表格是一个unique table 的所有列，AB是key，CDE是value。
"ABCD" 是一个数据流产生的数据, "ABE"  是另一个数据流产生的数据, 两个流写要到同一个table上。
但是ABCD和ABE产生、更新的数据的时机不同步（间隔时间甚至会很长），这就导致在写入数据之前完成所有列数据的拼接变的不太可能（或者需要花费很大的代价）。

我们额外加入s1和s2两列，作为sequence column来控制两流数据的更新。
s1 对C、D 两列的数据进行版本控制；s2 对E列的数据进行版本控制。两流数据在导入或者其他更新操作时，互不干扰。每一流根据自己的sequence columns来完成更新操作。

### 使用示例

**1. 创建支持sequence mapping的表**

创建支持sequence mapping的表，并指定c,d列的更新依赖s1列(sequence列)，e列的更新依赖s2列(sequence列)。
sequence列可以为整型和时间类型（DATE、DATETIME），创建后不能更改该列的类型。
```sql
CREATE TABLE `upsert_test` (
  `a` bigint(20) NULL COMMENT "",
  `b` int(11) NULL COMMENT "",
  `c` int(11) NULL COMMENT "",
  `d` int(11) NULL COMMENT "",
  `e` int(11) NULL COMMENT "",
  `s1` int(11) NULL COMMENT "",
  `s2` int(11) NULL COMMENT ""
) ENGINE=OLAP
UNIQUE KEY(`a`, `b`)
COMMENT "OLAP"
DISTRIBUTED BY HASH(`a`, `b`) BUCKETS 1
PROPERTIES (
"enable_unique_key_merge_on_write"="false",
"light_schema_change"="true", 
"replication_num" = "1",
"sequence_mapping.s1" = "c,d",
"sequence_mapping.s2" = "e"
);
```

创建好的表结构如下：
```sql
MySQL > desc upsert_test;
+-------+--------+------+-------+---------+---------+
| Field | Type   | Null | Key   | Default | Extra   |
+-------+--------+------+-------+---------+---------+
| a     | bigint | Yes  | true  | NULL    |         |
| b     | int    | Yes  | true  | NULL    |         |
| c     | int    | Yes  | false | NULL    | REPLACE |
| d     | int    | Yes  | false | NULL    | REPLACE |
| e     | int    | Yes  | false | NULL    | REPLACE |
| s1    | int    | Yes  | false | NULL    | REPLACE |
| s2    | int    | Yes  | false | NULL    | REPLACE |
+-------+--------+------+-------+---------+---------+
```

**2. 插入&查询数据**

```sql
MySQL > insert into upsert_test(a, b, c, d, s1) values (1,1,2,2,2);
Query OK, 1 row affected (0.080 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    2 |    2 | NULL |    2 | NULL |
+------+------+------+------+------+------+------+
1 row in set (0.049 sec)

MySQL > insert into upsert_test(a, b, c, d, s1) values (1,1,1,1,1);
Query OK, 1 row affected (0.048 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    2 |    2 | NULL |    2 | NULL |
+------+------+------+------+------+------+------+
1 row in set (0.021 sec)

MySQL > insert into upsert_test(a, b, e, s2) values (1,1,2,2);
Query OK, 1 row affected (0.043 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    2 |    2 |    2 |    2 |    2 |
+------+------+------+------+------+------+------+
1 row in set (0.019 sec)

MySQL > insert into upsert_test(a, b, c, d, s1) values (1,1,3,3,3);
Query OK, 1 row affected (0.049 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    3 |    3 |    2 |    3 |    2 |
+------+------+------+------+------+------+------+
1 row in set (0.019 sec)

MySQL > insert into upsert_test(a, b, c, d, s1,e,s2) values(1,1,5,5,4,5,4);
Query OK, 1 row affected (0.050 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    5 |    5 |    5 |    4 |    4 |
+------+------+------+------+------+------+------+
1 row in set (0.019 sec)
```
第一次插入时，由于e和s2没有写入，因此e和s2读出来的值为null。

第二次插入时，由于s1的值小于第一次写入的值，因此c,d,s1的值都不会变化。

第三次插入时，写入了e和s2的值，所有列都有正确的值。

第四次插入时，由于s1的值大于之前写入的值，c,d,s1都被更新。

第五次插入时，由于s1和s2都大于之前写入的值，c,d,s1,e,s2都被更新。

**3. 添加或删除列**
```sql
CREATE TABLE `upsert_test` (
                `a` bigint(20) NULL COMMENT "",
                `b` int(11) NULL COMMENT "",
                `c` int(11) NULL COMMENT "",
                `d` int(11) NULL COMMENT "",
                `s1` int(11) NULL COMMENT "",
                ) ENGINE=OLAP
                UNIQUE KEY(`a`, `b`)
                COMMENT "OLAP"
                DISTRIBUTED BY HASH(`a`, `b`) BUCKETS 1
                PROPERTIES (
                "enable_unique_key_merge_on_write" = "false",
                "light_schema_change"="true",
                "replication_num" = "1",
                "sequence_mapping.s1" = "c,d"
                );
```

```sql
MySQL > insert into upsert_test(a, b, c, d, s1) values (1,1,1,1,1),(1,1,3,3,3),(1,1,2,2,2);
Query OK, 3 rows affected (0.101 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+
| a    | b    | c    | d    | s1   |
+------+------+------+------+------+
|    1 |    1 |    3 |    3 |    3 |
+------+------+------+------+------+
1 row in set (0.057 sec)

MySQL > alter table upsert_test add column (e int(11) NULL, s2 bigint) PROPERTIES('sequence_mapping.s2' = 'e');
Query OK, 0 rows affected (0.011 sec)

MySQL > desc upsert_test;
+-------+--------+------+-------+---------+---------+
| Field | Type   | Null | Key   | Default | Extra   |
+-------+--------+------+-------+---------+---------+
| a     | bigint | Yes  | true  | NULL    |         |
| b     | int    | Yes  | true  | NULL    |         |
| c     | int    | Yes  | false | NULL    | REPLACE |
| d     | int    | Yes  | false | NULL    | REPLACE |
| s1    | int    | Yes  | false | NULL    | REPLACE |
| e     | int    | Yes  | false | NULL    | REPLACE |
| s2    | bigint | Yes  | false | NULL    | REPLACE |
+-------+--------+------+-------+---------+---------+
7 rows in set (0.003 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | s1   | e    | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    3 |    3 |    3 | NULL | NULL |
+------+------+------+------+------+------+------+
1 row in set (0.032 sec)

MySQL > insert into upsert_test(a, b, e, s2) values (1,1,2,2);
Query OK, 1 row affected (0.052 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | s1   | e    | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    3 |    3 |    3 |    2 |    2 |
+------+------+------+------+------+------+------+
1 row in set (0.020 sec)

MySQL > insert into upsert_test(a, b, c, d, s1,e,s2) values(1,1,5,5,4,5,4);
Query OK, 1 row affected (0.050 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | s1   | e    | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    5 |    5 |    4 |    5 |    4 |
+------+------+------+------+------+------+------+
1 row in set (0.022 sec)

MySQL > alter table upsert_test drop column e;
Query OK, 0 rows affected (0.006 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+
| a    | b    | c    | d    | s1   | s2   |
+------+------+------+------+------+------+
|    1 |    1 |    5 |    5 |    4 |    4 |
+------+------+------+------+------+------+
1 row in set (0.026 sec)

MySQL > alter table upsert_test drop column s2;
Query OK, 0 rows affected (0.005 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+
| a    | b    | c    | d    | s1   |
+------+------+------+------+------+
|    1 |    1 |    5 |    5 |    4 |
+------+------+------+------+------+
1 row in set (0.014 sec)
```

### 注意

1. 必须开启light schema change，暂时不支持rename列

2. sequence列可以为整型和时间类型（DATE、DATETIME），创建后不能更改该列的类型

3. 所有的mapping列之间不能重叠，比如样例中的d列不能既映射到s1又映射到s2

4. sequence列和mapping列不能为key列, 所有非key列一定需要映射到某个sequence列

5. 无法更改映射关系，比如样例中的d列已经映射到s1列，无法修改映射到s2列

6. 暂时仅支持MOR表, 不支持与sequence col同时开启，不支持批量删除操作

7. 暂时不支持创建RollUp

8. 如果新建表时没带sequence_mapping属性，后期不支持打开