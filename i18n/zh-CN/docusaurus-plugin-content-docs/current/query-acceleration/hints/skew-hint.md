---
{
    "title": "Skew Hint",
    "language": "zh-CN",
    "description": "Skew Hint能够解决特定场景的数据倾斜的问题，本文介绍Skew Hint的适用场景和用法"
}
---

## Join Skew Hint

### 概述

`SaltJoin` 用于缓解 Join 场景中的数据倾斜问题。当 Join Key 存在已知热点值时，优化器会引入盐值列（salt column），将热点值打散到多个并行实例执行，避免单个实例成为瓶颈。

该规则的核心目标是：在 `Shuffle Join` 场景下，降低热点 Key 导致的局部过载风险，提升整体执行稳定性。

### 适用场景

1. 单侧倾斜明显：Join 两侧中有一侧的热点 Key 非常集中

2. 已知倾斜值：可通过 Hint 显式提供倾斜值列表

3. 需要走 Shuffle Join：另一侧表较大，不适合 Broadcast Join

### 支持的 Join 类型

* INNER JOIN

* LEFT JOIN

* RIGHT JOIN



### 使用方式

#### 方法一：使用注释 Hint

```sql
SELECT /*+leading(tl shuffle[skew(tl.a(1,2))] tr)*/ * 
FROM tl 
INNER JOIN tr ON tl.a = tr.a;
```



#### 方法二：使用 Join Hint 语法

```sql
SELECT * 
FROM tl 
JOIN[shuffle[skew(tl.a(1,2))]] tr ON tl.a = tr.a;
```

参数说明：

* `tl`：左表别名

* `tr`：右表别名

* `tl.a`：存在倾斜的列

* `(1,2)`：已知的倾斜值列表



示例：

创建测试表并插入数据：

```sql
-- 创建左表 tl
CREATE TABLE IF NOT EXISTS tl (
    id INT,
    a INT,
    name STRING,
    value DOUBLE
) PROPERTIES("replication_num"="1");

-- 创建右表 tr
CREATE TABLE IF NOT EXISTS tr (
    id INT,
    a INT,
    description STRING,
    amount DOUBLE
) PROPERTIES("replication_num"="1");

-- 插入左表数据（模拟数据倾斜）
INSERT INTO tl VALUES
(1, 1, 'name_1', 100.0),  -- 倾斜值 1
(2, 1, 'name_2', 200.0),  -- 倾斜值 1
(3, 1, 'name_3', 300.0),  -- 倾斜值 1
(4, 1, 'name_4', 400.0),  -- 倾斜值 1
(5, 2, 'name_5', 500.0),  -- 倾斜值 2
(6, 2, 'name_6', 600.0),  -- 倾斜值 2
(7, 2, 'name_7', 700.0),  -- 倾斜值 2
(8, 3, 'name_8', 800.0),  -- 正常值
(9, 4, 'name_9', 900.0),  -- 正常值
(10, 5, 'name_10', 1000.0); -- 正常值

-- 插入右表数据
INSERT INTO tr VALUES
(1, 1, 'desc_1', 150.0),   -- 对应倾斜值 1
(2, 1, 'desc_2', 250.0),   -- 对应倾斜值 1
(3, 2, 'desc_3', 350.0),   -- 对应倾斜值 2
(4, 2, 'desc_4', 450.0),   -- 对应倾斜值 2
(5, 3, 'desc_5', 550.0),   -- 对应正常值
(6, 4, 'desc_6', 650.0),   -- 对应正常值
(7, 5, 'desc_7', 750.0);   -- 对应正常值
```

使用salt join优化查询：

示例1:inner join优化

```sql
-- 使用 Hint 语法
SELECT /*+leading(tl shuffle[skew(tl.a(1,2))] tr)*/ 
    tl.id as tl_id,
    tl.name,
    tr.description,
    tl.value + tr.amount as total
FROM tl 
INNER JOIN tr ON tl.a = tr.a
WHERE tl.value > 300.0;

-- 使用 Join 提示语法
SELECT 
    tl.id as tl_id,
    tl.name,
    tr.description,
    tl.value + tr.amount as total
FROM tl 
JOIN[shuffle[skew(tl.a(1,2))]] tr ON tl.a = tr.a
WHERE tl.value > 300.0;
```

示例2:left join优化

```sql
-- 优化左连接中左表的倾斜问题
SELECT /*+leading(tl shuffle[skew(tl.a(1,2))] tr)*/ 
    tl.id,
    tl.a,
    tl.name,COALESCE(tr.description, 'No Match') as description
FROM tl 
LEFT JOIN tr ON tl.a = tr.a
ORDER BY tl.id;
```

示例3:right join优化

```sql
-- 优化右连接中右表的倾斜问题
SELECT /*+leading(tl shuffle[skew(tr.a(1,2))] tr)*/ 
    tr.id,
    tr.a,
    tr.description,
    COALESCE(tl.name, 'No Match') as name
FROM tl 
RIGHT JOIN tr ON tl.a = tr.a
WHERE tr.amount > 500.0;
```

### 优化原理

Join Skew Hint 的核心是对热点 Key 做“加盐重写（salting rewrite）”。

当通过 `skew(...)` 指定已知倾斜值后，优化器会在倾斜侧引入盐值列（salt），把 Join 条件从 `key` 扩展为 `(key, salt)`，将热点数据打散到多个并行实例执行，避免单实例成为热点瓶颈。

为了保证 Join 语义正确，另一侧会按相同盐值桶对对应热点 Key 进行扩展，使两侧仍可在 `(key, salt)` 上准确匹配。

简化理解为三步：

1. 识别并标记热点值

2. 倾斜侧加盐打散

3. 非倾斜侧扩展后再 Join

该策略最适合“单侧明显倾斜”的场景：可以显著降低热点侧的局部过载风险，提升整体并行度与稳定性。



### 重要限制

`SaltJoin` 只能缓解单侧热点，不能同时消除双侧同 Key 倾斜。

以左表倾斜为例，规则会在左表对热点值随机打盐，并在右表按盐值扩行，使 Join 条件从 `key` 扩展为 `(key, salt)`。这样左表热点会被打散到多个实例。

但右表并不会减少热点数据，只是为了匹配而被复制到多个盐值分区中。因此，当两侧在同一 Key 上都高度倾斜时，该规则只能降低一侧压力，无法同时解决另一侧的热点。

例如：左表有 100 行 `key=1`，右表也有 100 行 `key=1`，盐值桶数为 100。重写后左表 100 行会被分散到 100 个桶；右表会被扩展到每个桶都包含这 100 行。结果是左表负载下降，但右表每个实例仍可能处理大量 `key=1`，右侧倾斜并未被解决。



## AGG Skew Hint

### 概述

`AGG Skew Hint` 用于缓解 `DISTINCT` 聚合中的 NDV 倾斜问题。

典型场景是：`GROUP BY a` 的分组数量不大，但某个热点分组（例如 `a=1`）对应的 `DISTINCT b` 数量特别大，导致单个实例维护超大去重哈希表，出现内存压力和长尾。

该规则通过“加桶（salt bucket）+ 多阶段聚合”把热点分组内的去重计算进一步拆散，从而降低单实例负载。

### 适用场景

1. `DISTINCT` 聚合存在明显 NDV 倾斜：少数分组的去重基数异常高

2. 常规多阶段 `DISTINCT` 聚合出现倾斜、或内存高水位。

### 使用方式

```sql
SELECT a, COUNT(DISTINCT [skew] b) 
FROM t 
GROUP BY a;
```

### 当前支持的函数

目前，AGG 改写支持以下聚合函数：

* `COUNT`

* `SUM`

* `SUM0`

* `GROUP_CONCAT`

仅上述函数支持 AGG skew rewrite，其他聚合函数会回退常规计划。

### 优化原理

以 `SELECT a, COUNT(DISTINCT [skew] b) FROM t GROUP BY a` 为例，核心流程可理解为：

1. 先做一次局部去重，降低原始数据量

2. 为 `DISTINCT` 参数计算桶列（例如 `saltExpr = xxhash_32(b) % bucket_num`）

3. 按 `(a, saltExpr)` 做分布并执行 `multi_distinct_count`

4. 再按 `a` 聚合并合并各桶结果，得到最终 `COUNT(DISTINCT b)`

这样做的关键收益是：热点分组不再由单个去重哈希结构“硬扛”，而是按桶拆分后并行处理。

### 重要限制

加上Hint之后的改写是按触发条件生效的，不满足条件会自动回退到常规聚合计划。常见限制包括：

1. 必须有 `GROUP BY`

2. 目标是单参数 `DISTINCT` 聚合

3. 当 `DISTINCT` 参数已包含在 `GROUP BY` 中时，该重写通常没有收益，不会触发

### 使用建议

1. 优先在明显热点的 `DISTINCT` 聚合上使用 `[skew]`

2. 结合业务数据规模调节 `skew_rewrite_agg_bucket_num`，避免桶数过小（打散不足）或过大（调度与汇总开销上升）

3. 使用 `EXPLAIN`/`PROFILE` 对比优化前后是否明显降低了长尾实例耗时和内存峰值

## Window Skew Hint

### 概述

`Window Skew Hint` 用于缓解窗口函数在 `PARTITION BY` 键倾斜时的排序长尾问题。

当某些分区键（如用户 ID、机构 ID）高度集中时，传统窗口执行会在少数实例上堆积大量排序与窗口计算，导致整体查询被最慢实例拖慢。

### 适用场景

1. 窗口函数 `PARTITION BY` 键存在明显热点

2. 查询包含 `ORDER BY` 的窗口计算，排序阶段成为主要瓶颈

### 使用方式

在 `PARTITION BY` 子句中显式标记 `[skew]`：

```sql
SELECT 
    SUM(a) OVER(
        PARTITION BY [skew] b
        ORDER BY d
        ROWS BETWEEN UNBOUNDED PRECEDING AND 1 FOLLOWING
    ) AS w1
FROM test_skew_window;
```

### 优化原理

核心思路是把“重排序”拆成两段：

1. 先在上游做局部排序（Local Sort）

2. 再按 `PARTITION BY` 键做 Shuffle

3. 在下游执行归并排序（Merge Sort）后进行窗口计算

相比“Shuffle 后全量排序”，这种方式在倾斜分区上通常更稳定：同样要处理热点分区的数据，但排序开销从全量重排转为归并已排序数据流。

### 重要限制

1. `[skew]` 是窗口分区键级别的提示，主要作用于 `PARTITION BY` 倾斜场景

2. 该优化重点缓解排序开销，不改变窗口语义；若单个分区本身极大，仍可能出现执行长尾


### 使用建议

1. 优先在热点明显的 `PARTITION BY` 键上使用 `[skew]`

2. 结合 `PROFILE` 观察排序节点耗时、数据倾斜指标和长尾实例变化
