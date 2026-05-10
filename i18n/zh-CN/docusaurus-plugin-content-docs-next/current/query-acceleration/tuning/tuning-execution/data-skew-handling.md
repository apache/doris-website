---
{
    "title": "数据倾斜处理：定位与优化 Doris MPP 查询单点瓶颈",
    "sidebar_label": "数据倾斜处理",
    "language": "zh-CN",
    "description": "如何在 Doris MPP 查询中发现数据倾斜并解决单线程执行瓶颈？本文通过 Profile 指标、Broadcast 与 Leading Hint 提供定位与调优方法。",
    "keywords": ["Doris 数据倾斜", "MPP 查询优化", "Join Shuffle", "Broadcast Join", "Leading Hint", "数据倾斜处理", "Profile 调优"]
}
---

<!-- 知识类型：概念 + 操作 + 案例 -->
<!-- 适用场景：Doris MPP 查询出现单点慢、Join 不均衡、计划顺序异常 -->

数据倾斜是指 Shuffle 后数据在各 BE instance 上分布不均，导致单个线程成为整体查询的瓶颈。Doris 是一个 MPP 数据库，依赖数据 Shuffle 进行并行计算加速；当 Join Key 或过滤列存在倾斜时，会出现单线程执行瓶颈，拖慢整体查询。

本文介绍如何发现这类问题，并给出常见的调优方法。

## 排查 Checklist

<!-- 知识类型：操作清单 -->
<!-- 适用场景：快速定位倾斜问题 -->

在动手优化前，建议先按以下步骤排查：

- 通过 `EXPLAIN` 查看执行计划，确认 Join 顺序与 Shuffle 方式。
- 通过 `PROFILE` 查看算子的 `ExecTime`、`ProbeRows` 等指标的 `max / avg / min`。
- 判断 `max` 与 `avg` 是否存在数量级差异（典型倾斜信号）。
- 确认倾斜来源：Join Key 分布不均，还是过滤后行数估算偏差。
- 选择对应调优手段：Broadcast Hint 或 Leading Hint。

## 倾斜场景对比

<!-- 知识类型：对比表 -->
<!-- 适用场景：快速选择优化手段 -->

| 场景 | 触发原因 | 典型现象 | 推荐手段 |
|---|---|---|---|
| Bucket 数据倾斜 | Join Key 数据分布不均，Shuffle 后单分区过大 | `ProbeRows.max` 远大于 `avg`，`ExecTime.max` 异常 | Broadcast Join Hint |
| 列数据倾斜导致左右表颠倒 | 优化器基于均匀分布假设，过滤估行偏差大 | Join 顺序选择不合理，左表行数远大于估算 | Leading Hint |

## 案例 1：Bucket 数据倾斜导致 Shuffle 方式不优

<!-- 知识类型：案例 + 操作 -->
<!-- 适用场景：Join Key 分布不均，单线程执行时间显著高于均值 -->

### 现象

当 Table 在 Join Key 上出现数据倾斜时，数据会在不同的 BE instance 间分布不均，导致单点执行瓶颈，进而拖慢整体查询时间。

### 通过 Profile 定位

观察 Hash Join 算子的 Profile：

```SQL
HASH_JOIN_OPERATOR  (id=27): 
      -  PlanInfo 
            -  join  op: INNER  JOIN(PARTITIONED)[] 
            -  equal  join  conjunct:  (customer_number  =  customer_number) 
            -  runtime  filters:  RF001[bloom]  <-  customer_number(200/256/2048) 
            -  cardinality=200         
            -  vec  output  tuple  id:  28 
            -  output  tuple  id:  28  
            -  vIntermediate  tuple  ids:  27 
            -  hash  output  slot  ids:  192  193  194  195  196  197  198  199  200  201  174  175  240  176  177  178  179  180  181  182  183  184  185  186  187  188  189  190  191 
            -  project  output  tuple  id:  28 
      -  BlocksProduced:  sum  4.883K  (4883),  avg  33,  max  39,  min  29 
      -  CloseTime:  avg  37.28us,  max  132.653us,  min  13.945us  
      -  ExecTime:  avg  166.206ms,  max  10s947.344ms,  min  8.845ms 
      -  InitTime:  avg  0ns,  max  0ns,  min  0ns  
      -  MemoryUsage:  sum  ,  avg  ,  max  ,  min 
          -  PeakMemoryUsage:  sum  11.81  MB,  avg  84.00  KB,  max  84.00  KB,  min  84.00  KB 
          -  ProbeKeyArena:  sum  11.81  MB,  avg  84.00  KB,  max  84.00  KB,  min  84.00  KB 
      -  OpenTime:  avg  194.970us,  max  497.685us,  min  93.738us  
      -  ProbeRows:  sum  23.884018M  (23884018),  avg  165.861K  (165861),  max  219.346276M  (219346276),  min  1984  (1984) 
      -  ProjectionTime:  avg  7.336ms,  max  33.540ms,  min  3.760ms 
      -  RowsProduced:  sum  28.8K  (28800),  avg  200,  max  200,  min  200 
```

从 Join 的 Profile 中 `max` 指标来看，执行时间和 ProbeRows 存在明显倾斜：

```Bash
ExecTime:  avg  166.206ms,  max  10s947.344ms,  min  8.845ms 
ProbeRows:  sum  23.884018M  (23884018),  avg  165.861K  (165861),  max  219.346276M  (219346276),  min  1984  (1984) 
```

由于数据基于 Join Key Shuffle 之后分布不均，其中一个线程处理了 2 亿行数据，而另一个线程只处理了几千行数据。

### 倾斜信号速查

| 指标 | 健康表现 | 倾斜表现 |
|---|---|---|
| `ExecTime` | `max` 接近 `avg` | `max` 远大于 `avg`（如 10s vs 166ms） |
| `ProbeRows` | 各线程数量级一致 | `max` 比 `avg` 大几个数量级 |
| `RowsProduced` | 均匀分布 | 集中在少数线程 |

### 优化方案：使用 Broadcast Join Hint

理想情况下，每个线程处理的数据量应当接近。可参考「使用 Hint 控制 Join Shuffle 方式」章节，指定 broadcast join hint，让左表不进行数据 Shuffle，从而避免 Join 列数据倾斜导致的性能瓶颈。

- **目的**：避免按 Join Key Shuffle 大表，规避单分区数据过大的问题。
- **命令**：

  ```SQL
  SELECT COUNT(*) FROM orders o JOIN [broadcast] customer c ON o.customer_number = c.customer_number;
  ```

- **说明**：使用 `[broadcast]` 后，右表 `customer` 会被广播到所有节点，左表 `orders` 不再 Shuffle，从而消除因 Join Key 倾斜导致的单点压力。

## 案例 2：列数据倾斜导致 Join 左右边颠倒

<!-- 知识类型：案例 + 操作 -->
<!-- 适用场景：过滤估行不准导致 Join 顺序不合理 -->

### 现象

Doris 优化器基于数据均匀假设估算选择率，过滤估行偏差大会影响算子的计划选择。以如下 SQL 为例：

```SQL
select count(*) 
from orders, customer 
where o_custkey = c_custkey
and o_orderdate < '1920-01-02';
```

### 原因分析

在均匀分布假设下，优化器可能认为经过 `o_orderdate < '1920-01-02'` 过滤后输出的行数会少于 `customer` 表的行数，因此可能选择 `customer` join `orders` 的连接顺序。

但若实际数据存在倾斜，导致满足条件的 `orders` 表条数多于 `customer`，则更合理的连接顺序应是 `orders` join `customer`。

### 优化方案：使用 Leading Hint

- **目的**：强制指定更合理的 Join 顺序，绕开估行误差。
- **命令**：

  ```SQL
  select /*+leading(orders customer)*/ count(*) 
  from orders, customer 
  where o_custkey = c_custkey
  and o_orderdate < '1920-01-02'
  ```

- **说明**：可参考「使用 Leading Hint 控制 Join 顺序」章节，通过 leading hint 强制生成 `customer` join `orders` 的连接顺序。

## 常见问题

<!-- 知识类型：FAQ -->
<!-- 适用场景：常见疑问与误区 -->

**Q1：如何快速判断查询是否存在数据倾斜？**

查看 Profile 中关键算子的 `ExecTime` 与 `ProbeRows`，若 `max` 显著大于 `avg`（数量级差异），即可判定存在倾斜。

**Q2：Broadcast Join 一定能解决倾斜吗？**

不一定。Broadcast 适用于右表（被广播表）足够小的场景。若右表很大，广播会带来显著的内存与网络开销，可能反而劣化性能。

**Q3：Leading Hint 与 Broadcast Hint 可以一起使用吗？**

可以。两者作用不同：Leading Hint 控制 Join 顺序，Broadcast Hint 控制 Shuffle 方式，可结合使用以应对复杂场景。

**Q4：为什么优化器没有自动选择最优计划？**

优化器基于统计信息和均匀分布假设进行估算，当列数据严重倾斜时估算会出现偏差。此时需通过 Hint 干预。

## Troubleshooting

<!-- 知识类型：问题排查 -->
<!-- 适用场景：调优后仍未解决 -->

| 问题 | 可能原因 | 处理建议 |
|---|---|---|
| 加 Broadcast Hint 后 OOM | 右表过大，广播超过内存限制 | 改用其他 Shuffle 方式或缩小右表 |
| 加 Leading Hint 后无效 | Hint 语法错误或被优化器忽略 | 通过 `EXPLAIN` 确认 Hint 是否生效 |
| Profile 中 `max` 仍远大于 `avg` | 倾斜源不在 Join 而在聚合或扫描 | 检查 Aggregate / Scan 算子的指标 |
| 多次执行结果不稳定 | 统计信息过期 | 执行 `ANALYZE TABLE` 更新统计信息 |

## 总结

<!-- 知识类型：总结 -->
<!-- 适用场景：方法论回顾 -->

数据倾斜是常见的生产场景性能问题。处理思路概括为三步：

1. **观察**：通过 `EXPLAIN` 和 `PROFILE` 输出观察计划与执行瓶颈。
2. **定位**：根据 `max / avg / min` 指标差异定位倾斜来源。
3. **调整**：使用 Broadcast Hint 或 Leading Hint 进行计划调整，规避数据倾斜对性能的影响。
