---
{
    "title": "Joins (JOIN)",
    "language": "en",
    "description": "Apache Doris JOIN query guide: detailed explanation of INNER/LEFT/RIGHT/FULL/SEMI/ANTI JOIN types, and the four distributed JOIN implementations: Broadcast, Shuffle, Bucket Shuffle, and Colocate.",
    "keywords": [
        "Doris JOIN",
        "SQL JOIN",
        "Hash Join",
        "Nest Loop Join",
        "Broadcast Join",
        "Shuffle Join",
        "Bucket Shuffle Join",
        "Colocate Join",
        "distributed join",
        "MPP JOIN"
    ]
}
---

<!-- Knowledge Type: Capability Overview + Architecture Decision -->
<!-- Applicable Scenario: SQL Query Authoring / JOIN Performance Tuning -->

In data analysis scenarios, business data is often split across multiple tables (for example, an orders table, a users table, and a products table). When you need to associate these tables to produce a complete analytical result, you use JOIN. This article describes the JOIN types supported by Apache Doris, along with the physical implementations and Shuffle strategies of JOIN under the MPP architecture, to help you choose the right JOIN approach for your business scenario.

## What is a JOIN

In a relational database, data is distributed across multiple tables that are related to one another through specific relationships. The SQL JOIN operation lets you combine different tables into a more complete result set based on these association conditions.

## JOIN Types Supported by Doris

<!-- Knowledge Type: Syntax Reference -->

Doris supports the following JOIN types, covering scenarios from regular associations to anti joins and semi joins:

| JOIN Type | Description |
| --- | --- |
| INNER JOIN | Compares each row of the left table against all rows of the right table using the JOIN condition, and returns rows from both tables that satisfy the JOIN condition. |
| LEFT JOIN | Builds on the INNER JOIN result set: if a row in the left table has no match in the right table, the row from the left table is still returned, with NULL values for the corresponding columns of the right table. |
| RIGHT JOIN | The opposite of LEFT JOIN: if a row in the right table has no match in the left table, the row from the right table is still returned, with NULL values for the corresponding columns of the left table. |
| FULL JOIN | Builds on the INNER JOIN result set, returning all rows from both tables. If a row has no match in the other table, the corresponding columns of that other table are filled with NULL. |
| CROSS JOIN | Has no JOIN condition, and returns the Cartesian product of the two tables: every row of the left table is combined with every row of the right table. |
| LEFT SEMI JOIN | Compares each row of the left table against all rows of the right table using the JOIN condition, and if a match exists, returns the corresponding row from the left table. |
| RIGHT SEMI JOIN | The opposite of LEFT SEMI JOIN: compares each row of the right table against all rows of the left table using the JOIN condition, and if a match exists, returns the corresponding row from the right table. |
| LEFT ANTI JOIN | Compares each row of the left table against all rows of the right table using the JOIN condition, and if no match is found, returns the corresponding row from the left table. |
| RIGHT ANTI JOIN | The opposite of LEFT ANTI JOIN: compares each row of the right table against all rows of the left table using the JOIN condition, and if no match is found, returns those rows. |
| NULL AWARE LEFT ANTI JOIN | A LEFT ANTI JOIN that handles NULL values specially. Similar to LEFT ANTI JOIN, but ignores rows in the left table whose match column is NULL. |

For the complete SQL syntax of JOIN, see [SELECT](../sql-manual/sql-statements/data-query/SELECT).

## Physical Implementations of JOIN

<!-- Knowledge Type: Architecture Decision -->

Doris supports two physical implementations of JOIN: **Hash Join** and **Nest Loop Join**. Their applicable scenarios are as follows:

- **Hash Join**: Builds a hash table on the right table based on the equi-JOIN columns, and streams data from the left table through this hash table for the JOIN computation. The limitation of this approach is that it only applies to equi-JOIN conditions.

- **Nest Loop Join**: Uses two nested loops, driven by the left table, iterating over every row of the right table for each row of the left table to evaluate the JOIN condition. It applies to all JOIN scenarios, including those that Hash Join cannot handle, such as queries involving greater-than or less-than comparisons, or those that require Cartesian product computation. However, Nest Loop Join may underperform compared to Hash Join.

## Shuffle Strategies for Hash Join

<!-- Knowledge Type: Architecture Decision -->
<!-- Applicable Scenario: JOIN Performance Tuning -->

As a distributed MPP database, Apache Doris must shuffle data during Hash Join to dispatch and partition it appropriately, ensuring the correctness of JOIN results. Doris provides four Shuffle strategies, listed in ascending order of data distribution requirements and performance potential: Broadcast Join, Partition Shuffle Join, Bucket Shuffle Join, and Colocate Join.

### Broadcast Join

As shown in the figure, the Broadcast Join process sends all data from the right table to every node participating in the JOIN computation, including the scan nodes of the left table data, while the left table data stays in place. During this process, every node receives a complete copy of the right table data (a total of T(R) data) so that all nodes have the data required to perform the JOIN.

This method applies to many general scenarios, but does not work for RIGHT OUTER, RIGHT ANTI, or RIGHT SEMI Hash Joins. Its network overhead equals the number of JOIN nodes N multiplied by the right table data size T(R).

![Implementation of Hash Join in Doris](/images/broadcast-join.jpg)

### Partition Shuffle Join

This method computes a hash value from the JOIN condition and partitions data accordingly. Specifically, the data of both the left and right tables is partitioned according to the hash value computed from the JOIN condition, and these partitions are then sent to the corresponding partition nodes (as shown in the figure).

The network overhead of this method consists of two parts: the cost of transmitting the left table data T(S) and the cost of transmitting the right table data T(R). This method only supports Hash Join, because it relies on the JOIN condition to perform the bucketing of data.

![Partition Shuffle Join](/images/partition-shuffle-join.jpg)

### Bucket Shuffle Join

When the JOIN condition includes the bucket column of the left table, the left table data stays in place, and the right table data is distributed to the nodes of the left table for the JOIN, reducing network overhead.

When the data on one side of the JOIN is already hash-distributed by the JOIN condition column, you can keep that side's data in place and distribute the data on the other side using the same JOIN condition column and the same hash distribution computation. (The "table" mentioned here is not limited to a physically stored table; it can also be the output of any operator in the SQL query, and you can flexibly choose to keep either the left or the right table's data in place while moving and distributing the other side.)

Take a Doris physical table as an example. Because its table data is itself stored in buckets through hash computation, you can directly leverage this property to optimize the data shuffle process of a JOIN operation. Suppose two tables need to be joined and the JOIN column is the bucket column of the left table. In this case, you do not need to move the left table data; you only need to distribute the right table data to the corresponding locations based on the bucket information of the left table to complete the JOIN computation (as shown in the figure).

The network overhead of this process mainly comes from moving the right table data, namely T(R).

![Bucket Shuffle Join](/images/bucket-shuffle-join.png)

### Colocate Join

Similar to Bucket Shuffle Join, if both tables participating in the JOIN happen to be hash-distributed by the JOIN condition column, the Shuffle process can be skipped, and the JOIN can be computed directly on the local node. The following uses physical tables to illustrate this briefly:

When a Doris table is created with DISTRIBUTED BY HASH, the system distributes data based on the hash distribution key during data ingestion. If the hash distribution keys of two tables happen to match the JOIN condition columns, the data of these two tables can be considered pre-distributed according to the JOIN requirements, so no additional Shuffle is needed. Therefore, in actual queries, the JOIN can be computed directly on these two tables.

:::caution Note
For scenarios that perform a JOIN immediately after scanning data, the table creation must satisfy certain conditions. For details, see the [Colocate Join restrictions](#colocate-join-restrictions) for two physical tables described later.
:::

![Colocate Join](/images/colocate-join.png)

## Comparison of the Four Shuffle Methods

<!-- Knowledge Type: Comparison Table -->
<!-- Applicable Scenario: JOIN Performance Tuning / Execution Plan Analysis -->

The following table summarizes the network overhead, supported physical operators, and applicable scenarios of the four Shuffle methods:

| Shuffle Method | Network Overhead | Physical Operator | Applicable Scenario |
| --- | --- | --- | --- |
| Broadcast | N * T(R) | Hash Join / Nest Loop Join | General |
| Shuffle | T(S) + T(R) | Hash Join | General |
| Bucket Shuffle | T(R) | Hash Join | The JOIN condition includes the bucket column of the left table, and the left table is single-partition. |
| Colocate | 0 | Hash Join | The JOIN condition includes the bucket column of the left table, and both tables belong to the same Colocate Group. |

:::info Note

- N: the number of Instances participating in the JOIN computation.
- T(relation): the number of tuples in the relation.

:::

The flexibility of the four Shuffle methods above decreases in turn, and their requirements on data distribution become progressively stricter. In most scenarios, as data distribution requirements rise, JOIN performance tends to improve. Note that if the number of buckets in a table is small, Bucket Shuffle Join or Colocate Join may suffer from low parallelism and degrade performance, potentially performing worse than Shuffle Join. This is because the Shuffle operation can balance data distribution more effectively, providing higher parallelism for downstream processing.

## Hands-on Examples of Bucket Shuffle Join and Colocate Join

<!-- Knowledge Type: Operational Example -->
<!-- Applicable Scenario: Execution Plan Analysis -->

As mentioned earlier, for Bucket Shuffle Join and Colocate Join, as long as the data distributions of the two sides participating in the JOIN satisfy specific conditions, the corresponding JOIN can be performed (here a "table" refers to a broader concept: the output of any operator in a SQL query can be regarded as a "table").

Next, two tables `t1` and `t2`, along with related SQL examples, are used to introduce Bucket Shuffle Join and Colocate Join in this broader sense. First, the CREATE TABLE statements for these two tables are as follows:

```sql
create table t1
(
    c1 bigint, 
    c2 bigint
)
DISTRIBUTED BY HASH(c1) BUCKETS 3
PROPERTIES ("replication_num" = "1");

create table t2
(
    c1 bigint, 
    c2 bigint
)
DISTRIBUTED BY HASH(c1) BUCKETS 3
PROPERTIES ("replication_num" = "1");
```

### Bucket Shuffle Join Example

In the following example, both `t1` and `t2` are processed by the GROUP BY operator and produce new tables (at this point, `tx` is hash-distributed by `c1`, while `ty` is hash-distributed by `c2`). The subsequent JOIN condition is `tx.c1 = ty.c2`, which exactly satisfies the conditions for Bucket Shuffle Join.

```sql
explain select *
from 
    (
        -- Table t1 is hash-distributed by c1, and after the group by operator, it remains hash-distributed by c1.
        select c1 as c1, sum(c2) as c2
        from t1
        group by c1 
    ) tx
join 
    (
        -- Table t2 is hash-distributed by c1, and after the group by operator, the data distribution becomes hash-distributed by c2.
        select c2 as c2, sum(c1) as c1
        from t2
        group by c2 
    ) ty
on tx.c1 = ty.c2;
```

In the Explain output below, you can see that the left child of the Hash Join node 7 is the aggregation node 6, and the right child is the Exchange node 4. This indicates that the data position of the left child after aggregation stays in place, while the data of the right child is distributed to the nodes of the left child via Bucket Shuffle, so that the subsequent Hash Join can be performed.

```sql
+------------------------------------------------------------+
| Explain String(Nereids Planner)                            |
+------------------------------------------------------------+
| PLAN FRAGMENT 0                                            |
|   OUTPUT EXPRS:                                            |
|     c1[#18]                                                |
|     c2[#19]                                                |
|     c2[#20]                                                |
|     c1[#21]                                                |
|   PARTITION: HASH_PARTITIONED: c1[#8]                      |
|                                                            |
|   HAS_COLO_PLAN_NODE: true                                 |
|                                                            |
|   VRESULT SINK                                             |
|      MYSQL_PROTOCAL                                        |
|                                                            |
|   7:VHASH JOIN(364)                                        |
|   |  join op: INNER JOIN(BUCKET_SHUFFLE)[]                 |
|   |  equal join conjunct: (c1[#12] = c2[#6])               |
|   |  cardinality=10                                        |
|   |  vec output tuple id: 8                                |
|   |  output tuple id: 8                                    |
|   |  vIntermediate tuple ids: 7                            |
|   |  hash output slot ids: 6 7 12 13                       |
|   |  final projections: c1[#14], c2[#15], c2[#16], c1[#17] |
|   |  final project output tuple id: 8                      |
|   |  distribute expr lists: c1[#12]                        |
|   |  distribute expr lists: c2[#6]                         |
|   |                                                        |
|   |----4:VEXCHANGE                                         |
|   |       offset: 0                                        |
|   |       distribute expr lists: c2[#6]                    |
|   |                                                        |
|   6:VAGGREGATE (update finalize)(342)                      |
|   |  output: sum(c2[#9])[#11]                              |
|   |  group by: c1[#8]                                      |
|   |  sortByGroupKey:false                                  |
|   |  cardinality=10                                        |
|   |  final projections: c1[#10], c2[#11]                   |
|   |  final project output tuple id: 6                      |
|   |  distribute expr lists: c1[#8]                         |
|   |                                                        |
|   5:VOlapScanNode(339)                                     |
|      TABLE: tt.t1(t1), PREAGGREGATION: ON                  |
|      partitions=1/1 (t1)                                   |
|      tablets=1/1, tabletList=491188                        |
|      cardinality=21, avgRowSize=0.0, numNodes=1            |
|      pushAggOp=NONE                                        |
|                                                            |
| PLAN FRAGMENT 1                                            |
|                                                            |
|   PARTITION: HASH_PARTITIONED: c2[#2]                      |
|                                                            |
|   HAS_COLO_PLAN_NODE: true                                 |
|                                                            |
|   STREAM DATA SINK                                         |
|     EXCHANGE ID: 04                                        |
|     BUCKET_SHFFULE_HASH_PARTITIONED: c2[#6]                |
|                                                            |
|   3:VAGGREGATE (merge finalize)(355)                       |
|   |  output: sum(partial_sum(c1)[#3])[#5]                  |
|   |  group by: c2[#2]                                      |
|   |  sortByGroupKey:false                                  |
|   |  cardinality=5                                         |
|   |  final projections: c2[#4], c1[#5]                     |
|   |  final project output tuple id: 3                      |
|   |  distribute expr lists: c2[#2]                         |
|   |                                                        |
|   2:VEXCHANGE                                              |
|      offset: 0                                             |
|      distribute expr lists:                                |
|                                                            |
| PLAN FRAGMENT 2                                            |
|                                                            |
|   PARTITION: HASH_PARTITIONED: c1[#0]                      |
|                                                            |
|   HAS_COLO_PLAN_NODE: false                                |
|                                                            |
|   STREAM DATA SINK                                         |
|     EXCHANGE ID: 02                                        |
|     HASH_PARTITIONED: c2[#2]                               |
|                                                            |
|   1:VAGGREGATE (update serialize)(349)                     |
|   |  STREAMING                                             |
|   |  output: partial_sum(c1[#0])[#3]                       |
|   |  group by: c2[#1]                                      |
|   |  sortByGroupKey:false                                  |
|   |  cardinality=5                                         |
|   |  distribute expr lists: c1[#0]                         |
|   |                                                        |
|   0:VOlapScanNode(346)                                     |
|      TABLE: tt.t2(t2), PREAGGREGATION: ON                  |
|      partitions=1/1 (t2)                                   |
|      tablets=1/1, tabletList=491198                        |
|      cardinality=10, avgRowSize=0.0, numNodes=1            |
|      pushAggOp=NONE                                        |
|                                                            |
|                                                            |
| Statistics                                                 |
|  planed with unknown column statistics                     |
+------------------------------------------------------------+
97 rows in set (0.01 sec)
```

### Colocate Join Example

In the following example, both `t1` and `t2` are processed by the GROUP BY operator and produce new tables (at this point, both `tx` and `ty` are hash-distributed by `c2`). The subsequent JOIN condition is `tx.c2 = ty.c2`, which exactly satisfies the conditions for Colocate Join.

```sql
explain select *
from 
    (
        -- Table t1 is hash-distributed by c1, and after the group by operator, the data distribution becomes hash-distributed by c2.
        select c2 as c2, sum(c1) as c1
        from t1
        group by c2 
    ) tx
join 
    (
        -- Table t2 is hash-distributed by c1, and after the group by operator, the data distribution becomes hash-distributed by c2.
        select c2 as c2, sum(c1) as c1
        from t2
        group by c2 
    ) ty
on tx.c2 = ty.c2;
```

In the Explain output below, you can see that the left child of the Hash Join node 8 is the aggregation node 7, and the right child is the aggregation node 3, with no Exchange node in between. This indicates that the data of both the left and right children stays in place after aggregation, with no data movement required, and the subsequent Hash Join can be performed locally.

```sql
+------------------------------------------------------------+
| Explain String(Nereids Planner)                            |
+------------------------------------------------------------+
| PLAN FRAGMENT 0                                            |
|   OUTPUT EXPRS:                                            |
|     c2[#20]                                                |
|     c1[#21]                                                |
|     c2[#22]                                                |
|     c1[#23]                                                |
|   PARTITION: HASH_PARTITIONED: c2[#10]                     |
|                                                            |
|   HAS_COLO_PLAN_NODE: true                                 |
|                                                            |
|   VRESULT SINK                                             |
|      MYSQL_PROTOCAL                                        |
|                                                            |
|   8:VHASH JOIN(373)                                        |
|   |  join op: INNER JOIN(PARTITIONED)[]                    |
|   |  equal join conjunct: (c2[#14] = c2[#6])               |
|   |  cardinality=10                                        |
|   |  vec output tuple id: 9                                |
|   |  output tuple id: 9                                    |
|   |  vIntermediate tuple ids: 8                            |
|   |  hash output slot ids: 6 7 14 15                       |
|   |  final projections: c2[#16], c1[#17], c2[#18], c1[#19] |
|   |  final project output tuple id: 9                      |
|   |  distribute expr lists: c2[#14]                        |
|   |  distribute expr lists: c2[#6]                         |
|   |                                                        |
|   |----3:VAGGREGATE (merge finalize)(367)                  |
|   |    |  output: sum(partial_sum(c1)[#3])[#5]             |
|   |    |  group by: c2[#2]                                 |
|   |    |  sortByGroupKey:false                             |
|   |    |  cardinality=5                                    |
|   |    |  final projections: c2[#4], c1[#5]                |
|   |    |  final project output tuple id: 3                 |
|   |    |  distribute expr lists: c2[#2]                    |
|   |    |                                                   |
|   |    2:VEXCHANGE                                         |
|   |       offset: 0                                        |
|   |       distribute expr lists:                           |
|   |                                                        |
|   7:VAGGREGATE (merge finalize)(354)                       |
|   |  output: sum(partial_sum(c1)[#11])[#13]                |
|   |  group by: c2[#10]                                     |
|   |  sortByGroupKey:false                                  |
|   |  cardinality=10                                        |
|   |  final projections: c2[#12], c1[#13]                   |
|   |  final project output tuple id: 7                      |
|   |  distribute expr lists: c2[#10]                        |
|   |                                                        |
|   6:VEXCHANGE                                              |
|      offset: 0                                             |
|      distribute expr lists:                                |
|                                                            |
| PLAN FRAGMENT 1                                            |
|                                                            |
|   PARTITION: HASH_PARTITIONED: c1[#8]                      |
|                                                            |
|   HAS_COLO_PLAN_NODE: false                                |
|                                                            |
|   STREAM DATA SINK                                         |
|     EXCHANGE ID: 06                                        |
|     HASH_PARTITIONED: c2[#10]                              |
|                                                            |
|   5:VAGGREGATE (update serialize)(348)                     |
|   |  STREAMING                                             |
|   |  output: partial_sum(c1[#8])[#11]                      |
|   |  group by: c2[#9]                                      |
|   |  sortByGroupKey:false                                  |
|   |  cardinality=10                                        |
|   |  distribute expr lists: c1[#8]                         |
|   |                                                        |
|   4:VOlapScanNode(345)                                     |
|      TABLE: tt.t1(t1), PREAGGREGATION: ON                  |
|      partitions=1/1 (t1)                                   |
|      tablets=1/1, tabletList=491188                        |
|      cardinality=21, avgRowSize=0.0, numNodes=1            |
|      pushAggOp=NONE                                        |
|                                                            |
| PLAN FRAGMENT 2                                            |
|                                                            |
|   PARTITION: HASH_PARTITIONED: c1[#0]                      |
|                                                            |
|   HAS_COLO_PLAN_NODE: false                                |
|                                                            |
|   STREAM DATA SINK                                         |
|     EXCHANGE ID: 02                                        |
|     HASH_PARTITIONED: c2[#2]                               |
|                                                            |
|   1:VAGGREGATE (update serialize)(361)                     |
|   |  STREAMING                                             |
|   |  output: partial_sum(c1[#0])[#3]                       |
|   |  group by: c2[#1]                                      |
|   |  sortByGroupKey:false                                  |
|   |  cardinality=5                                         |
|   |  distribute expr lists: c1[#0]                         |
|   |                                                        |
|   0:VOlapScanNode(358)                                     |
|      TABLE: tt.t2(t2), PREAGGREGATION: ON                  |
|      partitions=1/1 (t2)                                   |
|      tablets=1/1, tabletList=491198                        |
|      cardinality=10, avgRowSize=0.0, numNodes=1            |
|      pushAggOp=NONE                                        |
|                                                            |
|                                                            |
| Statistics                                                 |
|  planed with unknown column statistics                     |
+------------------------------------------------------------+
105 rows in set (0.06 sec)
```

## FAQ

<!-- Knowledge Type: FAQ / Restrictions -->
<!-- Applicable Scenario: JOIN Planning Failure Troubleshooting -->

Bucket Shuffle Join and Colocate Join have certain restrictions on data distribution and JOIN conditions. The following sections describe the specific restrictions of each.

### Bucket Shuffle Join Restrictions

When scanning two physical tables directly to perform a Bucket Shuffle Join, the following conditions must be met:

1. **Equi-JOIN condition**: Bucket Shuffle Join applies only to scenarios with equi-JOIN conditions, because it relies on hash computation to determine data distribution.
2. **Equi-condition that includes the bucket column**: The equi-JOIN condition must include the bucket column of both tables. When the bucket column of the left table appears in the equi-JOIN condition, the query is more likely to be planned as a Bucket Shuffle Join.
3. **Table type restriction**: Bucket Shuffle Join applies only to Doris-native OLAP tables. For external tables such as ODBC, MySQL, and ES, Bucket Shuffle Join does not take effect when they are used as the left table.
4. **Single-partition requirement**: For partitioned tables, because the data distribution may differ across partitions, Bucket Shuffle Join is only guaranteed to work when the left table is single-partition. Therefore, when executing SQL, use `WHERE` conditions whenever possible to enable the partition-pruning strategy.

### Colocate Join Restrictions

When scanning two physical tables directly, Colocate Join has stricter restrictions than Bucket Shuffle Join. In addition to all the conditions of Bucket Shuffle Join, the following requirements must also be met:

1. **Consistent bucket columns**: The type and number of bucket columns must be consistent to ensure consistent data distribution.
2. **Same Colocation Group**: The Colocation Group must be explicitly specified, and only tables in the same Colocation Group can perform a Colocate Join.
3. **Stable Group state**: During operations such as replica repair or replica balancing, the Colocation Group may be in the Unstable state. In that case, Colocate Join falls back to a regular JOIN operation.
