---
{
    "title": "自增列",
    "language": "zh-CN",
    "description": "Doris 自增列（AUTO_INCREMENT）自动为每行生成唯一 BIGINT 值，简化主键生成、字典编码与高效分页等场景的数据写入。"
}
---

<!-- 知识类型: Feature 概念 + 操作步骤 + 应用场景 -->

在 Doris 中，自增列（Auto Increment Column）是一种自动生成唯一数字值的功能，常用于为每一行数据生成唯一的标识符，如主键。每当插入新记录时，自增列会自动分配一个递增的值，避免了手动指定数字的繁琐操作。使用 Doris 自增列，可以确保数据的唯一性和一致性，简化数据插入过程，减少人为错误，并提高数据管理的效率。这使得自增列成为处理需要唯一标识的场景（如用户 ID 等）时的理想选择。

## 核心特性

### 写入行为

对于具有自增列的表，Doris 处理数据写入的方式如下：

| 写入情形                         | 处理方式                                  |
| -------------------------------- | ----------------------------------------- |
| 写入数据**不包含**自增列         | Doris 自动生成并填充该列的唯一值          |
| 写入数据**包含**自增列且值为空   | Doris 用系统生成的唯一值替换空值          |
| 写入数据**包含**自增列且值非空   | 用户提供的值保持不变                      |

:::caution 重要
用户提供的非空值可能会破坏自增列的唯一性。
:::

### 唯一性

Doris 保证自增列中生成的值具有**表级唯一性**。但是：

- **保证唯一性**：这仅适用于系统生成的值。
- **用户提供的值**：Doris 不会验证或强制执行用户在自增列中指定的值的唯一性，这可能导致重复条目。

### 聚集性

Doris 生成的自增值通常是**密集的**，但有一些考虑：

- **潜在的间隙**：由于性能优化，可能会出现间隙。每个后端节点（BE）会预分配一块唯一值以提高效率，这些块在节点之间不重叠。
- **非时间顺序值**：Doris 不保证后续写入生成的值大于早期写入的值。

:::info 注意
自增值不能用于推断写入的时间顺序。
:::

## 创建自增列

<!-- 知识类型: 语法 + 约束 -->

### 语法说明

要使用自增列，需要在建表 [CREATE-TABLE](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE) 时为对应的列添加 `AUTO_INCREMENT` 属性：

- 如果未指定起始值，则默认起始值为 `1`。
- 通过 `AUTO_INCREMENT(start_value)` 可在建表时手动指定自增列起始值。

### 约束和限制

1. 仅 Duplicate 模型表和 Unique 模型表可以包含自增列。
2. 一张表最多只能包含一个自增列。
3. 自增列的类型必须是 `BIGINT`，且必须为 `NOT NULL`。
4. 自增列手动指定的起始值必须大于等于 0。

### 建表示例

**示例 1：Duplicate 模型表，key 列为自增列**

```sql
CREATE TABLE `demo`.`tbl` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `value` BIGINT NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

**示例 2：Duplicate 模型表，key 列为自增列，起始值为 100**

```sql
CREATE TABLE `demo`.`tbl` (
    `id` BIGINT NOT NULL AUTO_INCREMENT(100),
    `value` BIGINT NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

**示例 3：Duplicate 模型表，value 列为自增列**

```sql
CREATE TABLE `demo`.`tbl` (
    `uid` BIGINT NOT NULL,
    `name` BIGINT NOT NULL,
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `value` BIGINT NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`uid`, `name`)
DISTRIBUTED BY HASH(`uid`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

**示例 4：Unique 模型表，key 列为自增列**

```sql
CREATE TABLE `demo`.`tbl` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` varchar(65533) NOT NULL,
    `value` int(11) NOT NULL
) ENGINE=OLAP
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

**示例 5：Unique 模型表，value 列为自增列**

```sql
CREATE TABLE `demo`.`tbl` (
    `text` varchar(65533) NOT NULL,
    `id` BIGINT NOT NULL AUTO_INCREMENT
) ENGINE=OLAP
UNIQUE KEY(`text`)
DISTRIBUTED BY HASH(`text`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

## 数据写入

<!-- 适用场景: 普通导入 / 部分列更新 -->

### 普通导入

以下表为例：

```sql
CREATE TABLE `demo`.`tbl` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` varchar(65533) NOT NULL,
    `value` int(11) NOT NULL
) ENGINE=OLAP
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

#### 场景 1：INSERT INTO 不指定自增列

使用 `insert into` 语句导入并且不指定自增列 `id` 时，`id` 列会被自动填充生成的值：

```sql
insert into tbl(name, value) values("Bob", 10), ("Alice", 20), ("Jack", 30);

select * from tbl order by id;
+------+-------+-------+
| id   | name  | value |
+------+-------+-------+
|    1 | Bob   |    10 |
|    2 | Alice |    20 |
|    3 | Jack  |    30 |
+------+-------+-------+
```

#### 场景 2：Stream Load 不指定自增列

类似地，使用 stream load 导入文件 `test.csv` 且不指定自增列 `id`，`id` 列会被自动填充生成的值。

`test.csv` 内容：

```text
Tom,40
John,50
```

执行导入命令：

```shell
curl --location-trusted -u user:passwd \
    -H "columns:name,value" \
    -H "column_separator:," \
    -T ./test.csv \
    http://{host}:{port}/api/{db}/tbl/_stream_load
```

查询结果：

```sql
select * from tbl order by id;
+------+-------+-------+
| id   | name  | value |
+------+-------+-------+
|    1 | Bob   |    10 |
|    2 | Alice |    20 |
|    3 | Jack  |    30 |
|    4 | Tom   |    40 |
|    5 | John  |    50 |
+------+-------+-------+
```

#### 场景 3：INSERT INTO 指定自增列且包含 NULL

使用 `insert into` 导入时指定自增列 `id`，则该列数据中的 `null` 值会被生成的值替换：

```sql
insert into tbl(id, name, value) values(null, "Doris", 60), (null, "Nereids", 70);

select * from tbl order by id;
+------+---------+-------+
| id   | name    | value |
+------+---------+-------+
|    1 | Bob     |    10 |
|    2 | Alice   |    20 |
|    3 | Jack    |    30 |
|    4 | Tom     |    40 |
|    5 | John    |    50 |
|    6 | Doris   |    60 |
|    7 | Nereids |    70 |
+------+---------+-------+
```

### 部分列更新

在对一张包含自增列的 merge-on-write Unique 表进行部分列更新时，行为根据自增列是否为 key 列而有所不同：

| 自增列位置  | 更新行为                                                                                                       |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| **key 列**  | 用户必须显式指定 key 列，部分列更新的目标列必须包含自增列；导入行为与普通的部分列更新相同                      |
| **非 key 列** | 未指定自增列时，其值从表中原有的数据行中进行补齐；指定自增列时，`null` 值被生成值替换、非 `null` 值保持不变，再以部分列更新语义插入 |

#### 示例 1：自增列作为 key 列

```sql
CREATE TABLE `demo`.`tbl2` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` varchar(65533) NOT NULL,
    `value` int(11) NOT NULL DEFAULT "0"
) ENGINE=OLAP
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3",
    "enable_unique_key_merge_on_write" = "true"
);

insert into tbl2(id, name, value) values(1, "Bob", 10), (2, "Alice", 20), (3, "Jack", 30);

select * from tbl2 order by id;
+------+-------+-------+
| id   | name  | value |
+------+-------+-------+
|    1 | Bob   |    10 |
|    2 | Alice |    20 |
|    3 | Jack  |    30 |
+------+-------+-------+

set enable_unique_key_partial_update=true;
set enable_insert_strict=false;
insert into tbl2(id, name) values(1, "modified"), (4, "added");

select * from tbl2 order by id;
+------+----------+-------+
| id   | name     | value |
+------+----------+-------+
|    1 | modified |    10 |
|    2 | Alice    |    20 |
|    3 | Jack     |    30 |
|    4 | added    |     0 |
+------+----------+-------+
```

#### 示例 2：自增列作为非 key 列

```sql
CREATE TABLE `demo`.`tbl3` (
    `id` BIGINT NOT NULL,
    `name` varchar(100) NOT NULL,
    `score` BIGINT NOT NULL,
    `aid` BIGINT NOT NULL AUTO_INCREMENT
) ENGINE=OLAP
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3",
    "enable_unique_key_merge_on_write" = "true"
);

insert into tbl3(id, name, score) values(1, "Doris", 100), (2, "Nereids", 200), (3, "Bob", 300);

select * from tbl3 order by id;
+------+---------+-------+------+
| id   | name    | score | aid  |
+------+---------+-------+------+
|    1 | Doris   |   100 |    0 |
|    2 | Nereids |   200 |    1 |
|    3 | Bob     |   300 |    2 |
+------+---------+-------+------+

set enable_unique_key_partial_update=true;
set enable_insert_strict=false;
insert into tbl3(id, score) values(1, 999), (2, 888);

select * from tbl3 order by id;
+------+---------+-------+------+
| id   | name    | score | aid  |
+------+---------+-------+------+
|    1 | Doris   |   999 |    0 |
|    2 | Nereids |   888 |    1 |
|    3 | Bob     |   300 |    2 |
+------+---------+-------+------+

insert into tbl3(id, aid) values(1, 1000), (3, 500);

select * from tbl3 order by id;
+------+---------+-------+------+
| id   | name    | score | aid  |
+------+---------+-------+------+
|    1 | Doris   |   999 | 1000 |
|    2 | Nereids |   888 |    1 |
|    3 | Bob     |   300 |  500 |
+------+---------+-------+------+
```

## 典型应用场景

<!-- 适用场景: 字典编码 / 高效分页 -->

### 场景一：字典编码

**适用业务**：在用户画像场景中使用 bitmap 做人群分析时需要构建用户字典，每个用户对应一个唯一的整数字典值，聚集的字典值可以获得更好的 bitmap 性能。

以离线 uv、pv 分析场景为例，操作步骤如下。

#### 步骤 1：创建用户行为明细表

假设有如下用户行为表存放明细数据：

```sql
CREATE TABLE `demo`.`dwd_dup_tbl` (
    `user_id` varchar(50) NOT NULL,
    `dim1` varchar(50) NOT NULL,
    `dim2` varchar(50) NOT NULL,
    `dim3` varchar(50) NOT NULL,
    `dim4` varchar(50) NOT NULL,
    `dim5` varchar(50) NOT NULL,
    `visit_time` DATE NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`user_id`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 32
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

#### 步骤 2：利用自增列创建字典表

```sql
CREATE TABLE `demo`.`dictionary_tbl` (
    `user_id` varchar(50) NOT NULL,
    `aid` BIGINT NOT NULL AUTO_INCREMENT
) ENGINE=OLAP
UNIQUE KEY(`user_id`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 32
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3",
    "enable_unique_key_merge_on_write" = "true"
);
```

#### 步骤 3：导入数据建立编码映射

将存量数据中的 `user_id` 导入字典表，建立 `user_id` 到整数值的编码映射：

```sql
insert into dictionary_tbl(user_id)
select user_id from dwd_dup_tbl group by user_id;
```

或者使用如下方式仅将增量数据中的 `user_id` 导入到字典表：

```sql
insert into dictionary_tbl(user_id)
select dwd_dup_tbl.user_id from dwd_dup_tbl left join dictionary_tbl
on dwd_dup_tbl.user_id = dictionary_tbl.user_id
where dwd_dup_tbl.visit_time > '2023-12-10' and dictionary_tbl.user_id is NULL;
```

:::tip
实际场景中也可以使用 Flink Connector 把数据写入到 Doris。
:::

#### 步骤 4：建立聚合结果表

假设 `dim1`、`dim3`、`dim5` 是关心的统计维度，建立如下聚合表存放聚合结果：

```sql
CREATE TABLE `demo`.`dws_agg_tbl` (
    `dim1` varchar(50) NOT NULL,
    `dim3` varchar(50) NOT NULL,
    `dim5` varchar(50) NOT NULL,
    `user_id_bitmap` BITMAP BITMAP_UNION NOT NULL,
    `pv` BIGINT SUM NOT NULL
) ENGINE=OLAP
AGGREGATE KEY(`dim1`,`dim3`,`dim5`)
DISTRIBUTED BY HASH(`dim1`) BUCKETS 32
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

#### 步骤 5：聚合数据并查询

将数据聚合运算后存放至聚合结果表：

```sql
insert into dws_agg_tbl
select dwd_dup_tbl.dim1, dwd_dup_tbl.dim3, dwd_dup_tbl.dim5, BITMAP_UNION(TO_BITMAP(dictionary_tbl.aid)), COUNT(1)
from dwd_dup_tbl INNER JOIN dictionary_tbl on dwd_dup_tbl.user_id = dictionary_tbl.user_id
group by dwd_dup_tbl.dim1, dwd_dup_tbl.dim3, dwd_dup_tbl.dim5;
```

执行 uv、pv 查询：

```sql
select dim1, dim3, dim5, bitmap_count(user_id_bitmap) as uv, pv from dws_agg_tbl;
```

### 场景二：高效分页

**问题背景**：在页面展示数据时，往往需要做分页展示。传统的分页通常使用 SQL 中的 `limit`、`offset` + `order by` 进行查询。然而，当进行深分页查询时（offset 很大时），即使实际需要的数据行很少，该方法依然会将全部数据读取到内存中进行全量排序后再进行后续处理，这种方法比较低效。

**优化思路**：可以通过自增列给每行数据一个唯一值，在查询时记录之前页面 `unique_value` 列的最大值 `max_value`，然后使用 `where unique_value > max_value limit rows_per_page` 通过谓词下推提前过滤大量数据，从而更高效地实现分页。

#### 传统分页方式（低效）

假设有如下业务表需要进行分页展示：

```sql
CREATE TABLE `demo`.`records_tbl` (
    `user_id` int(11) NOT NULL COMMENT "",
    `name` varchar(26) NOT NULL COMMENT "",
    `address` varchar(41) NOT NULL COMMENT "",
    `city` varchar(11) NOT NULL COMMENT "",
    `nation` varchar(16) NOT NULL COMMENT "",
    `region` varchar(13) NOT NULL COMMENT "",
    `phone` varchar(16) NOT NULL COMMENT "",
    `mktsegment` varchar(11) NOT NULL COMMENT ""
) DUPLICATE KEY (`user_id`, `name`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

假设每页展示 100 条数据：

- 获取第 1 页：

    ```sql
    select * from records_tbl order by user_id, name limit 100;
    ```

- 获取第 2 页：

    ```sql
    select * from records_tbl order by user_id, name limit 100 offset 100;
    ```

#### 自增列分页方式（高效）

通过在表中添加一个自增列从而赋予每一行一个唯一标识：

```sql
CREATE TABLE `demo`.`records_tbl2` (
    `user_id` int(11) NOT NULL COMMENT "",
    `name` varchar(26) NOT NULL COMMENT "",
    `address` varchar(41) NOT NULL COMMENT "",
    `city` varchar(11) NOT NULL COMMENT "",
    `nation` varchar(16) NOT NULL COMMENT "",
    `region` varchar(13) NOT NULL COMMENT "",
    `phone` varchar(16) NOT NULL COMMENT "",
    `mktsegment` varchar(11) NOT NULL COMMENT "",
    `unique_value` BIGINT NOT NULL AUTO_INCREMENT
) DUPLICATE KEY (`user_id`, `name`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

每页展示 100 条数据：

- **查询第 1 页**：

    ```sql
    select * from records_tbl2 order by unique_value limit 100;
    ```

- **查询第 2 页**：通过程序记录下返回结果中 `unique_value` 的最大值（假设为 99），则可用如下方式查询：

    ```sql
    select * from records_tbl2 where unique_value > 99 order by unique_value limit 100;
    ```

- **直接跳转到靠后页面**：如果要直接查询一个靠后页面的内容，此时不方便直接获取之前页面数据中 `unique_value` 的最大值，例如要直接获取第 101 页的内容，则可以使用如下方式查询：

    ```sql
    select user_id, name, address, city, nation, region, phone, mktsegment
    from records_tbl2, (select unique_value as max_value from records_tbl2 order by unique_value limit 1 offset 9999) as previous_data
    where records_tbl2.unique_value > previous_data.max_value
    order by unique_value limit 100;
    ```
