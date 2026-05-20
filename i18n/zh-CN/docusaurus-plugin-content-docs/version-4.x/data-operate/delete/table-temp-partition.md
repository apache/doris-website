---
{
    "title": "临时分区",
    "language": "zh-CN",
    "description": "Doris 临时分区使用指南：通过临时分区实现原子覆盖写、修改分桶数、合并或分割分区，保障分区数据切换零中断。",
    "keywords": [
        "Doris 临时分区",
        "Temporary Partition",
        "原子覆盖写",
        "REPLACE PARTITION",
        "修改分桶数",
        "分区合并",
        "分区分割"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 数据原子覆盖 / 分区结构调整 / 分桶数修改 -->

**临时分区**（Temporary Partition）是 Doris 分区表中独立于正式分区的一类分区。它不会被常规查询命中，需要通过特定语法显式访问，主要用于在不影响线上读写的前提下完成数据的原子切换与分区结构调整。

## 适用场景

| 场景 | 说明 | 关键能力 |
| --- | --- | --- |
| 原子覆盖写 | 重写某分区数据，且不希望出现"删除旧数据 → 导入新数据"之间的数据缺失窗口 | `REPLACE PARTITION` 原子替换 |
| 修改分桶数 | 已有分区分桶数设置不合理，需要调整分桶 | 临时分区指定新分桶数后替换 |
| 合并 / 分割分区 | 调整分区粒度，将多个分区合并为一个，或将一个大分区拆分为多个 | 通过 `INSERT INTO` 重新分布数据后替换 |

> 提示：对于**非分区表**的原子覆盖写，请参考 [替换表文档](../../data-operate/delete/atomicity-replace)。

## 核心约束

临时分区与正式分区共享同一表结构，但具有以下独立性：

- 临时分区的**分区列**与正式分区相同，且不可修改。
- 所有**临时分区之间**的分区范围不可重叠。
- 临时分区与**正式分区**的范围**可以重叠**。
- 临时分区的名称不能与正式分区或其他临时分区重复。

## 操作流程总览

典型使用流程包含以下四步：

1. **添加**临时分区（指定范围 / 枚举值 / 分桶数）
2. **导入**数据到临时分区（`INSERT INTO` / Stream Load / Broker Load / Routine Load）
3. **替换**正式分区（`REPLACE PARTITION`，原子操作）
4. （可选）**删除**未使用的临时分区

---

## 添加临时分区

使用 `ALTER TABLE ADD TEMPORARY PARTITION` 语句创建临时分区。支持 Range 分区与 List 分区，并可独立指定副本数与分桶规则。

```sql
-- Range 分区：LESS THAN 形式
ALTER TABLE tbl1 ADD TEMPORARY PARTITION tp1 VALUES LESS THAN("2020-02-01");

-- Range 分区：固定区间形式
ALTER TABLE tbl2 ADD TEMPORARY PARTITION tp1 VALUES [("2020-01-01"), ("2020-02-01"));

-- Range 分区：自定义副本数与分桶
ALTER TABLE tbl1 ADD TEMPORARY PARTITION tp1 VALUES LESS THAN("2020-02-01")
("replication_num" = "1")
DISTRIBUTED BY HASH(k1) BUCKETS 5;

-- List 分区：单列枚举
ALTER TABLE tbl3 ADD TEMPORARY PARTITION tp1 VALUES IN ("Beijing", "Shanghai");

-- List 分区：多列枚举
ALTER TABLE tbl4 ADD TEMPORARY PARTITION tp1 VALUES IN ((1, "Beijing"), (1, "Shanghai"));

-- List 分区：自定义副本数与分桶
ALTER TABLE tbl3 ADD TEMPORARY PARTITION tp1 VALUES IN ("Beijing", "Shanghai")
("replication_num" = "1")
DISTRIBUTED BY HASH(k1) BUCKETS 5;
```

## 导入数据到临时分区

不同导入方式指定临时分区的语法略有差异：

```sql
-- INSERT INTO
INSERT INTO tbl TEMPORARY PARTITION(tp1, tp2, ...) SELECT ...;
```

```bash
# Stream Load
curl --location-trusted -u root: \
     -H "label:123" \
     -H "temporary_partitions: tp1, tp2, ..." \
     -T testData \
     http://host:port/api/testDb/testTbl/_stream_load
```

```sql
-- Broker Load
LOAD LABEL example_db.label1
(
    DATA INFILE("hdfs://hdfs_host:hdfs_port/user/palo/data/input/file")
    INTO TABLE my_table
    TEMPORARY PARTITION (tp1, tp2, ...)
    ...
)
WITH BROKER hdfs ("username"="hdfs_user", "password"="hdfs_password");

-- Routine Load
CREATE ROUTINE LOAD example_db.test1 ON example_tbl
COLUMNS(k1, k2, k3, v1, v2, v3 = k1 * 100),
TEMPORARY PARTITIONS(tp1, tp2, ...),
WHERE k1 > 100
PROPERTIES (...)
FROM KAFKA (...);
```

## 查询临时分区

临时分区不会被常规 SQL 检索到，必须通过 `TEMPORARY PARTITION` 关键字显式声明：

```sql
SELECT ... FROM
    tbl1 TEMPORARY PARTITION(tp1, tp2, ...)
JOIN
    tbl2 TEMPORARY PARTITION(tp1, tp2, ...)
ON ...
WHERE ...;
```

## 替换正式分区

使用 `ALTER TABLE REPLACE PARTITION` 将正式分区原子性替换为临时分区。

```sql
-- 等数量替换
ALTER TABLE tbl1 REPLACE PARTITION (p1) WITH TEMPORARY PARTITION (tp1);

-- 多对多替换
ALTER TABLE tbl1 REPLACE PARTITION (p1, p2) WITH TEMPORARY PARTITION (tp1, tp2, tp3);

-- 替换并指定参数
ALTER TABLE tbl1 REPLACE PARTITION (p1, p2) WITH TEMPORARY PARTITION (tp1, tp2)
PROPERTIES (
    "strict_range" = "false",
    "use_temp_partition_name" = "true"
);
```

### 替换参数说明

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `strict_range` | `true` | 控制替换前后分区范围 / 枚举值的匹配严格度（详见下文） |
| `use_temp_partition_name` | `false` | 控制替换后正式分区的命名方式 |

#### `strict_range`

- **Range 分区**：
    - `true`：被替换的正式分区**范围并集**必须与替换的临时分区范围并集**完全相同**。
    - `false`：仅需保证替换后新的正式分区之间范围不重叠即可。
- **List 分区**：恒为 `true`。被替换的正式分区**枚举值并集**必须与替换的临时分区枚举值并集完全相同。

**示例 1：Range 范围并集相同（合法）**

```sql
-- 待替换分区 p1, p2, p3 的范围 (=> 并集)：
[10, 20), [20, 30), [40, 50) => [10, 30), [40, 50)

-- 替换分区 tp1, tp2 的范围 (=> 并集)：
[10, 30), [40, 45), [45, 50) => [10, 30), [40, 50)

-- 范围并集相同，可使用 tp1、tp2 替换 p1、p2、p3。
```

**示例 2：Range 范围并集不同（依赖 strict_range）**

```sql
-- 待替换分区 p1 的范围 (=> 并集)：
[10, 50) => [10, 50)

-- 替换分区 tp1, tp2 的范围 (=> 并集)：
[10, 30), [40, 50) => [10, 30), [40, 50)

-- strict_range = true：禁止替换。
-- strict_range = false：若替换后的 [10, 30)、[40, 50) 不与其他正式分区重叠，则允许替换。
```

**示例 3：List 单列枚举值并集相同**

```sql
-- 待替换分区 p1, p2 的枚举值 (=> 并集)：
(1, 2, 3), (4, 5, 6) => (1, 2, 3, 4, 5, 6)

-- 替换分区 tp1, tp2, tp3 的枚举值 (=> 并集)：
(1, 2, 3), (4), (5, 6) => (1, 2, 3, 4, 5, 6)

-- 枚举值并集相同，可使用 tp1、tp2、tp3 替换 p1、p2。
```

**示例 4：List 多列枚举值并集相同**

```sql
-- 待替换分区 p1, p2, p3 的枚举值 (=> 并集)：
(("1","beijing"), ("1", "shanghai")),
(("2","beijing"), ("2", "shanghai")),
(("3","beijing"), ("3", "shanghai"))
=> (("1","beijing"), ("1", "shanghai"), ("2","beijing"), ("2", "shanghai"), ("3","beijing"), ("3", "shanghai"))

-- 替换分区 tp1, tp2 的枚举值 (=> 并集)：
(("1","beijing"), ("1", "shanghai")),
(("2","beijing"), ("2", "shanghai"), ("3","beijing"), ("3", "shanghai"))
=> (("1","beijing"), ("1", "shanghai"), ("2","beijing"), ("2", "shanghai"), ("3","beijing"), ("3", "shanghai"))

-- 枚举值并集相同，可使用 tp1、tp2 替换 p1、p2、p3。
```

#### `use_temp_partition_name`

控制替换完成后正式分区的命名行为：

| 场景 | `use_temp_partition_name = false`（默认） | `use_temp_partition_name = true` |
| --- | --- | --- |
| 待替换分区数 = 替换分区数 | 保留原正式分区名（仅数据与属性被替换） | 使用临时分区名作为新正式分区名 |
| 待替换分区数 ≠ 替换分区数 | 参数无效，强制使用临时分区名 | 使用临时分区名 |

**示例 1：等数量替换**

```sql
ALTER TABLE tbl1 REPLACE PARTITION (p1) WITH TEMPORARY PARTITION (tp1);
```

- `use_temp_partition_name = false`（默认）：替换后分区名仍为 `p1`，但数据和属性来自 `tp1`。
- `use_temp_partition_name = true`：替换后分区名变为 `tp1`，`p1` 不再存在。

**示例 2：不等数量替换**

```sql
ALTER TABLE tbl1 REPLACE PARTITION (p1, p2) WITH TEMPORARY PARTITION (tp1);
```

- 由于待替换分区数（2）≠ 替换分区数（1），`use_temp_partition_name` 参数无效。
- 替换后分区名为 `tp1`，原 `p1` 与 `p2` 均不再存在。

:::tip 替换操作说明
分区替换成功后，**被替换的正式分区将被删除且不可恢复**。请务必先在临时分区中校验数据正确性后再执行替换。
:::

## 删除临时分区

使用 `ALTER TABLE DROP TEMPORARY PARTITION` 删除已不再需要的临时分区：

```sql
ALTER TABLE tbl1 DROP TEMPORARY PARTITION tp1;
```

> 注意：临时分区被删除后**无法通过 `RECOVER` 命令恢复**。

---

## 与其他操作的关系

### DROP 操作

| 操作 | 对临时分区的影响 | 是否可恢复 |
| --- | --- | --- |
| `DROP DATABASE` / `DROP TABLE` | 库或表中的临时分区被一并删除 | 库 / 表本身可在限定时间内通过 `RECOVER` 恢复，但**临时分区不会被恢复** |
| `ALTER ... DROP PARTITION`（正式分区） | 与临时分区无关 | 正式分区可在限定时间内通过 `RECOVER` 恢复 |
| `ALTER ... DROP TEMPORARY PARTITION` | 删除指定临时分区 | **不可恢复** |

### TRUNCATE 操作

| 操作 | 影响 |
| --- | --- |
| `TRUNCATE TABLE` | 表的临时分区**会被删除且不可恢复** |
| `TRUNCATE TABLE ... PARTITION`（清空正式分区） | 不影响临时分区 |
| 对临时分区执行 `TRUNCATE` | **不支持** |

### ALTER 操作

- 当表存在临时分区时，**无法执行** Schema Change、Rollup 等变更操作。
- 当表正在执行变更操作时，**无法新增**临时分区。

---

## FAQ

**Q1：临时分区会被普通的 `SELECT` 查询命中吗？**

不会。临时分区只能通过 `TEMPORARY PARTITION(...)` 子句显式访问，常规查询、报表、视图均不会读取临时分区数据。

**Q2：临时分区的副本数和分桶数必须与正式分区一致吗？**

不需要。这正是临时分区的核心价值之一——可以为新分区指定不同的 `replication_num` 和 `BUCKETS`，再通过 `REPLACE PARTITION` 完成原子切换。

**Q3：如何实现"零数据缺失"的分区数据重写？**

执行顺序：
1. `ALTER TABLE ... ADD TEMPORARY PARTITION` 创建临时分区。
2. 通过 `INSERT INTO` 或导入任务将新数据写入临时分区。
3. 校验临时分区数据正确性。
4. `ALTER TABLE ... REPLACE PARTITION ... WITH TEMPORARY PARTITION ...` 完成原子替换。

整个过程中正式分区始终对外可读。

**Q4：替换失败或数据不正确怎么办？**

替换前数据仍位于临时分区，正式分区不受影响。如发现数据问题，可使用 `ALTER TABLE ... DROP TEMPORARY PARTITION` 删除临时分区并重新导入。**一旦执行替换成功，原正式分区数据无法恢复**。

**Q5：可以对一张表同时添加多个临时分区吗？**

可以。只要保证临时分区之间的范围 / 枚举值不重叠，名称不重复即可。

## 常见错误

| 报错 / 现象 | 可能原因 | 解决方案 |
| --- | --- | --- |
| 添加临时分区失败：分区已存在 | 名称与现有正式分区或临时分区重复 | 修改临时分区名 |
| 添加临时分区失败：范围重叠 | 与已有临时分区范围 / 枚举值重叠 | 调整范围或先删除冲突的临时分区 |
| 替换失败：`strict_range` 校验不通过 | Range 分区的范围并集不一致 | 确认并集相同，或显式设置 `strict_range = false` |
| 替换失败：List 分区枚举值不一致 | List 分区 `strict_range` 恒为 `true` | 调整临时分区使其枚举值并集与正式分区完全相同 |
| 无法执行 Schema Change | 表中存在临时分区 | 先删除或替换所有临时分区 |
| 临时分区被误删 | `RECOVER` 不支持恢复临时分区 | 重新创建并导入数据 |

## 相关文档

- [非分区表的原子覆盖写：替换表](../../data-operate/delete/atomicity-replace)
