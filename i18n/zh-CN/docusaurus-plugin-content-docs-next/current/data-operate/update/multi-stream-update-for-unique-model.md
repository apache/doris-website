---
{
    "title": "主键模型的多流更新",
    "language": "zh-CN",
    "description": "使用 Doris Unique 模型的 Sequence Mapping 功能，解决多条数据流并发更新同一张宽表中不同列的版本控制问题。"
}
---

<!-- 知识类型: 功能特性 + 操作步骤 -->
<!-- 适用场景: 多数据流并发写入宽表 / 部分列实时更新 + 部分列按需更新 -->

## 业务场景与痛点

在数据仓库的宽表场景中，同一张表的不同列往往来自**不同的数据源**或**不同的处理链路**，常见情况如下：

- **实时流**：持续更新表中的部分字段（例如：用户行为相关列）。
- **离线流（或按需流）**：在特定时机更新表中的另外一些字段（例如：用户画像、标签相关列）。

这种场景下，多条数据流会并发写入同一张主键表，并面临两个核心问题：

| 痛点 | 说明 |
| --- | --- |
| **并发覆盖问题** | 不同数据流到达时间不同步，简单的 REPLACE 聚合无法保证每一流各自数据按版本顺序更新。 |
| **数据拼接代价高** | 在写入前等待所有列拼接完成几乎不可行，间隔时间可能很长，业务难以承受。 |

Doris Unique 模型原生支持基于 Sequence 列的版本控制，但**只能定义单个全局 Sequence 列**，无法独立控制不同数据流对各自列的更新版本。为此，Doris 提供了 **Sequence Mapping** 功能。

## 解决方案：Sequence Mapping

<!-- 知识类型: 一句话定义 -->

**Sequence Mapping** 是 Doris Unique 模型支持的一种多流并发更新机制：通过为不同的数据列指定不同的 Sequence 列，实现多条数据流各自独立的版本控制，互不干扰。

### 工作原理

假设一张 Unique 表包含如下列：

| 列名 | A | B | C | D | E | s1 | s2 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 角色 | Key | Key | Value | Value | Value | Sequence | Sequence |

- 数据流 1 写入 `A、B、C、D` 列，使用 `s1` 作为版本控制列。
- 数据流 2 写入 `A、B、E` 列，使用 `s2` 作为版本控制列。

通过这种映射关系：

- `s1` 控制 `C、D` 列的版本：仅当新到数据的 `s1` 大于已存数据的 `s1` 时，`C、D、s1` 才会被更新。
- `s2` 控制 `E` 列的版本：仅当新到数据的 `s2` 大于已存数据的 `s2` 时，`E、s2` 才会被更新。
- 两流之间**互不干扰**，查询时可读取所有列的最新数据。

## 使用示例

### 1. 创建支持 Sequence Mapping 的表

通过 `PROPERTIES` 中的 `sequence_mapping.<sequence_col>` 属性，声明 Sequence 列与受其控制的 Value 列之间的映射关系。

下面示例创建一张 Unique 表，指定 `c、d` 列依赖 `s1` 控制版本，`e` 列依赖 `s2` 控制版本：

```sql
CREATE TABLE `upsert_test` (
    `a`  bigint(20) NULL COMMENT "",
    `b`  int(11)    NULL COMMENT "",
    `c`  int(11)    NULL COMMENT "",
    `d`  int(11)    NULL COMMENT "",
    `e`  int(11)    NULL COMMENT "",
    `s1` int(11)    NULL COMMENT "",
    `s2` int(11)    NULL COMMENT ""
) ENGINE=OLAP
UNIQUE KEY(`a`, `b`)
COMMENT "OLAP"
DISTRIBUTED BY HASH(`a`, `b`) BUCKETS 1
PROPERTIES (
    "enable_unique_key_merge_on_write" = "false",
    "light_schema_change" = "true",
    "replication_num" = "1",
    "sequence_mapping.s1" = "c,d",
    "sequence_mapping.s2" = "e"
);
```

> Sequence 列支持的类型：整型、`DATE`、`DATETIME`。**列创建后不能更改类型**。

创建完成后，表结构如下：

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

### 2. 写入与查询数据

下面通过五次插入操作，演示不同 Sequence 值对各列的更新效果。

**第 1 次插入**：仅写入 `c、d、s1`，未写入 `e、s2`。

```sql
MySQL > insert into upsert_test(a, b, c, d, s1) values (1,1,2,2,2);
Query OK, 1 row affected (0.080 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    2 |    2 | NULL |    2 | NULL |
+------+------+------+------+------+------+------+
```

**第 2 次插入**：`s1=1`，小于已存的 `s1=2`，因此 `c、d、s1` 不会被更新。

```sql
MySQL > insert into upsert_test(a, b, c, d, s1) values (1,1,1,1,1);
Query OK, 1 row affected (0.048 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    2 |    2 | NULL |    2 | NULL |
+------+------+------+------+------+------+------+
```

**第 3 次插入**：写入 `e、s2`，由于此前 `s2` 为 `NULL`（视为最小值），`e、s2` 被更新。

```sql
MySQL > insert into upsert_test(a, b, e, s2) values (1,1,2,2);
Query OK, 1 row affected (0.043 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    2 |    2 |    2 |    2 |    2 |
+------+------+------+------+------+------+------+
```

**第 4 次插入**：`s1=3`，大于已存的 `s1=2`，因此 `c、d、s1` 被更新；`e、s2` 不受影响。

```sql
MySQL > insert into upsert_test(a, b, c, d, s1) values (1,1,3,3,3);
Query OK, 1 row affected (0.049 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    3 |    3 |    2 |    3 |    2 |
+------+------+------+------+------+------+------+
```

**第 5 次插入**：同时写入两组列，`s1=4`、`s2=4` 均大于已存值，所有列被更新。

```sql
MySQL > insert into upsert_test(a, b, c, d, s1, e, s2) values (1,1,5,5,4,5,4);
Query OK, 1 row affected (0.050 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    5 |    5 |    5 |    4 |    4 |
+------+------+------+------+------+------+------+
```

更新效果汇总如下：

| 操作 | 触发条件 | 更新的列 |
| --- | --- | --- |
| 第 1 次插入 | 首次写入 `c、d、s1` | `c、d、s1` |
| 第 2 次插入 | 新 `s1` < 已存 `s1` | 无更新 |
| 第 3 次插入 | 首次写入 `e、s2` | `e、s2` |
| 第 4 次插入 | 新 `s1` > 已存 `s1` | `c、d、s1` |
| 第 5 次插入 | 新 `s1`、`s2` 均大于已存值 | `c、d、s1、e、s2` |

### 3. 添加或删除列

Sequence Mapping 表支持通过 `ALTER TABLE` 动态添加或删除列与映射关系。

**初始建表**：仅含一组映射 `s1 -> c,d`。

```sql
CREATE TABLE `upsert_test` (
    `a`  bigint(20) NULL COMMENT "",
    `b`  int(11)    NULL COMMENT "",
    `c`  int(11)    NULL COMMENT "",
    `d`  int(11)    NULL COMMENT "",
    `s1` int(11)    NULL COMMENT ""
) ENGINE=OLAP
UNIQUE KEY(`a`, `b`)
COMMENT "OLAP"
DISTRIBUTED BY HASH(`a`, `b`) BUCKETS 1
PROPERTIES (
    "enable_unique_key_merge_on_write" = "false",
    "light_schema_change" = "true",
    "replication_num" = "1",
    "sequence_mapping.s1" = "c,d"
);
```

**写入初始数据**：

```sql
MySQL > insert into upsert_test(a, b, c, d, s1) values (1,1,1,1,1),(1,1,3,3,3),(1,1,2,2,2);
Query OK, 3 rows affected (0.101 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+
| a    | b    | c    | d    | s1   |
+------+------+------+------+------+
|    1 |    1 |    3 |    3 |    3 |
+------+------+------+------+------+
```

**新增列与映射**：通过 `ALTER TABLE` 同时添加 `e、s2` 列，并声明 `s2 -> e` 映射。

```sql
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

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | s1   | e    | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    3 |    3 |    3 | NULL | NULL |
+------+------+------+------+------+------+------+
```

**新映射生效后写入**：

```sql
MySQL > insert into upsert_test(a, b, e, s2) values (1,1,2,2);
Query OK, 1 row affected (0.052 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | s1   | e    | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    3 |    3 |    3 |    2 |    2 |
+------+------+------+------+------+------+------+

MySQL > insert into upsert_test(a, b, c, d, s1, e, s2) values (1,1,5,5,4,5,4);
Query OK, 1 row affected (0.050 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | s1   | e    | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    5 |    5 |    4 |    5 |    4 |
+------+------+------+------+------+------+------+
```

**删除列**：删除 Value 列 `e`，对应的映射也会随之失效；再删除 Sequence 列 `s2`。

```sql
MySQL > alter table upsert_test drop column e;
Query OK, 0 rows affected (0.006 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+
| a    | b    | c    | d    | s1   | s2   |
+------+------+------+------+------+------+
|    1 |    1 |    5 |    5 |    4 |    4 |
+------+------+------+------+------+------+

MySQL > alter table upsert_test drop column s2;
Query OK, 0 rows affected (0.005 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+
| a    | b    | c    | d    | s1   |
+------+------+------+------+------+
|    1 |    1 |    5 |    5 |    4 |
+------+------+------+------+------+
```

## 使用约束

<!-- 知识类型: 配置参数 / 使用限制 -->

使用 Sequence Mapping 时，需要注意以下约束：

| 类别 | 约束 |
| --- | --- |
| **建表配置** | 必须开启 `light_schema_change`；如果建表时未声明 `sequence_mapping` 属性，后续无法再开启。 |
| **列类型** | Sequence 列仅支持整型与时间类型（`DATE`、`DATETIME`），创建后不能更改类型。 |
| **列角色** | Sequence 列与映射列均不能作为 Key 列；所有非 Key 列必须映射到某个 Sequence 列。 |
| **映射关系** | 不同 Sequence 列的映射列**不能重叠**（例如 `d` 不能同时映射到 `s1` 与 `s2`）；映射关系建立后**不支持修改**（例如已映射到 `s1` 的列无法再改为映射到 `s2`）。 |
| **DDL 限制** | 暂不支持列重命名；暂不支持创建 Rollup。 |
| **存储模式** | 暂仅支持 MOR（Merge-on-Read）表；不支持与全局 Sequence 列同时启用；不支持批量删除操作。 |
| **导入语义** | 导入时未包含的字段会自动用默认值或 `NULL` 填充；Sequence 列在比较时，`NULL` 视为**最小值**。 |
