---
{
    "title": "GROUPING",
    "language": "zh-CN",
    "description": "用于在包含 CUBE、ROLLUP 或 GROUPING SETS 的 SQL 语句中，判断某个在 GROUP BY 子句中的列或表达式是否为汇总结果。当结果集中的数据行是由 CUBE、ROLLUP 或 GROUPING SETS 操作产生的汇总行时，该函数返回 1；否则返回 0。"
}
---

## 描述

用于在包含 CUBE、ROLLUP 或 GROUPING SETS 的 SQL 语句中，判断某个在 GROUP BY 子句中的列或表达式是否为汇总结果。当结果集中的数据行是由 CUBE、ROLLUP 或 GROUPING SETS 操作产生的汇总行时，该函数返回 1；否则返回 0。GROUPING 函数可在 SELECT、HAVING 和 ORDER BY 子句中使用。

ROLLUP、CUBE 或 GROUPING SETS 操作产生的汇总结果会以 NULL 作为被分组列的值，因此 GROUPING 函数通常用于区分这些 NULL 值与表中实际存在的 NULL 值。

## 语法

```sql
GROUPING( <column_expression> )
```

## 参数

| 参数                  | 说明                                          |
|-----------------------|-----------------------------------------------|
| `<column_expression>` | 在 GROUP BY 子句中包含的列或表达式。            |

## 返回值

返回 BIGINT 值。若该列或表达式对应的数据行为汇总行，则返回 1；否则返回 0。

## 举例

下面的例子使用 `camp` 列进行分组操作，并统计 `occupation` 的数量，同时利用 GROUPING 函数区分汇总行与表中实际存在的 NULL 值。

```sql
CREATE TABLE `roles` (
  role_id       INT,
  occupation    VARCHAR(32),
  camp          VARCHAR(32),
  register_time DATE
)
UNIQUE KEY(role_id)
DISTRIBUTED BY HASH(role_id) BUCKETS 1
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);

INSERT INTO `roles` VALUES
(0, 'who am I', NULL, NULL),
(1, 'mage', 'alliance', '2018-12-03 16:11:28'),
(2, 'paladin', 'alliance', '2018-11-30 16:11:28'),
(3, 'rogue', 'horde', '2018-12-01 16:11:28'),
(4, 'priest', 'alliance', '2018-12-02 16:11:28'),
(5, 'shaman', 'horde', NULL),
(6, 'warrior', 'alliance', NULL),
(7, 'warlock', 'horde', '2018-12-04 16:11:28'),
(8, 'hunter', 'horde', NULL);

SELECT 
  camp, 
  COUNT(occupation) AS occ_cnt,
  GROUPING(camp) AS grouping
FROM
  `roles`
GROUP BY
  ROLLUP(camp);
```

在上述查询中，结果集中 `camp` 列出现了两个 NULL 值。其中，第一个 NULL（GROUPING 返回 1）表示该行为 ROLLUP 操作产生的汇总行，其 `occ_cnt` 为所有 `camp` 的 `occupation` 计数；第二个 NULL（GROUPING 返回 0）表示表中实际存在的 NULL 值。

```text
+----------+---------+----------+
| camp     | occ_cnt | grouping |
+----------+---------+----------+
| NULL     |       9 |        1 |
| NULL     |       1 |        0 |
| alliance |       4 |        0 |
| horde    |       4 |        0 |
+----------+---------+----------+
```
