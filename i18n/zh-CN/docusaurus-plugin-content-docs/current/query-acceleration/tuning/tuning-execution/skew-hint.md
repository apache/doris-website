---
{
    "title": "Skew Hint 数据倾斜优化",
    "language": "zh-CN",
    "description": "使用 Join、DISTINCT 聚合和窗口 Skew Hint 缓解数据倾斜，并通过执行计划和 Profile 验证效果。",
    "keywords": [
        "Doris skew hint",
        "SaltJoin",
        "DISTINCT skew",
        "window skew"
    ]
}
---

Skew Hint 用于缓解少数热点键导致的单实例长尾。Doris 支持 Join 加盐、DISTINCT 聚合分桶和窗口排序三种策略，查询结果语义不变。仅在 Profile 证明数据倾斜时使用，额外复制和 Shuffle 也会增加成本。

:::note
本页三种 Hint 在 Doris 4.1.0 中已支持。请使用与部署版本对应的文档和执行计划核对实际生效情况。
:::

## 准备数据

示例需要当前数据库的建表、写入和查询权限。以下小表用于验证语法和结果，不用于展示性能收益：

```sql
CREATE TABLE skew_left (id INT, k INT, v INT)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num"="1");
CREATE TABLE skew_right (id INT, k INT, v INT)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num"="1");
INSERT INTO skew_left VALUES (1,1,10),(2,1,20),(3,2,30),(4,3,40);
INSERT INTO skew_right VALUES (1,1,100),(2,2,200);
```

## Join Skew Hint

对已知热点 Join 键，使用 `shuffle[skew(<column>(<literal>, ...))]`。热点侧随机加盐，另一侧的相应行被复制到多个盐值，再按原键和盐值进行 Shuffle Join。

- 普通 `INNER JOIN`、`LEFT JOIN` 的热点列必须来自左侧；`RIGHT JOIN` 的热点列必须来自右侧。ASOF 的 INNER/LEFT/RIGHT 变体遵循对应侧的规则，并仍需满足 ASOF 的 MATCH_CONDITION 和等值键要求。
- 列必须是 Join 等值键中的直接列引用；表达式、CAST 和不在等值条件中的列不能触发重写。只适用于 Shuffle；Mark Join、FULL/SEMI/ANTI Join 不适用。
- 一次优化处理一个指定热点列。两侧同时高度倾斜时，复制侧的热点和结果行数膨胀仍存在。

可直接写在 Join 上：

```sql
SELECT l.id AS left_id, r.id AS right_id
FROM skew_left l
JOIN[shuffle[skew(l.k(1))]] skew_right r ON l.k = r.k
ORDER BY left_id, right_id;
```

```text
left_id  right_id
1        1
2        1
3        2
```

也可以在 `LEADING` 中指定相同分布和热点：

```sql
SELECT /*+ leading(l shuffle[skew(l.k(1))] r) */
       l.id AS left_id, r.id AS right_id
FROM skew_left l JOIN skew_right r ON l.k = r.k
ORDER BY left_id, right_id;
```

```text
left_id  right_id
1        1
2        1
3        2
```

`l.k` 是热点列，`1` 是已知热点值。热点值列表必须使用与列类型兼容的字面量。实际 Join 顺序若变化，需重新确认热点列位于正确侧。

## DISTINCT 聚合 Skew Hint

将 `[skew]` 写在单参数 DISTINCT 聚合的参数前：

```sql
SELECT k, COUNT(DISTINCT [skew] id) AS distinct_ids
FROM skew_left
GROUP BY k
ORDER BY k;
```

```text
k  distinct_ids
1  2
2  1
3  1
```

支持 `COUNT`、`SUM`、`SUM0` 和单参数 `GROUP_CONCAT`。生效条件是存在 GROUP BY、同一层只有一个聚合函数和一个 DISTINCT 列参数、参数为直接列引用，且该参数不已包含在 GROUP BY 中。未满足时回退普通聚合。重写将去重工作按分组键和哈希桶分散，再按原分组键合并；它主要缓解热点组的高 NDV 内存和长尾。

## 窗口 Skew Hint

将 `[skew]` 写在窗口 PARTITION BY 关键字之后：

```sql
SELECT id, SUM(v) OVER (
    PARTITION BY [skew] k ORDER BY id
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
) AS running_sum
FROM skew_left
ORDER BY id;
```

```text
id  running_sum
1   10
2   30
3   30
4   40
```

该策略先局部排序，再按分区键 Shuffle 并归并排序，减少热点分区的重新排序成本。同一组分区键下，仅需要 Shuffle 的最底层窗口节点使用该策略，上层复用分布和顺序。没有 PARTITION BY 的全局窗口不能因此获得分区级并行；极大的单分区仍可能形成长尾。

## 参数

| 参数 | 类型 | 默认值 | 范围及作用 |
|---|---|---|---|
| `skew_rewrite_join_salt_explode_factor` | Session integer | `0` | `0` 按 BE/CPU 自动决定；`1` 到 `65535` 手动指定加盐/复制倍数。它不是表的 bucket 数 |
| `skew_rewrite_agg_bucket_num` | Session integer | `1024` | `1` 到 `65535`，控制 DISTINCT 重写的哈希桶数 |

## 验证与建议

在示例 SELECT 前加 `EXPLAIN` 检查 Hint 和新增加盐/多阶段聚合/排序节点；启用 `enable_profile=true` 比较同一 SQL 的各实例行数、时间、内存和 Shuffle 字节。Hint 不保证必然触发重写，最终计划才是依据。

热点值列表应来自实际数据。先尝试自动 Join 加盐倍数，增大倍数会复制另一侧更多行，可能增加网络和内存甚至 OOM。聚合桶数过大也会增加 Shuffle 与合并成本。窗口策略优化排序，不减少窗口必须处理的行数。不同数据分布下需重新测量。
