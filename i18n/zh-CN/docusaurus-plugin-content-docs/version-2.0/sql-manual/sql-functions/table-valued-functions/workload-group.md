---
{
    "title": "WORKLOAD_GROUPS",
    "language": "zh-CN"
}
---

## `workload_groups`

### Name

workload_groups

:::caution
已废弃。自 2.1.1 起，此表函数移到 information_schema.workload_groups 表。
:::

## 描述

表函数，生成 workload_groups 临时表，可以查看当前用户具有权限的资源组信息。

该函数用于from子句中。

## 语法
`workload_groups()`

workload_groups()表结构：
```
mysql> desc function workload_groups();
+-------+-------------+------+-------+---------+-------+
| Field | Type        | Null | Key   | Default | Extra |
+-------+-------------+------+-------+---------+-------+
| Id    | BIGINT      | No   | false | NULL    | NONE  |
| Name  | STRING      | No   | false | NULL    | NONE  |
| Item  | STRING      | No   | false | NULL    | NONE  |
| Value | STRING      | No   | false | NULL    | NONE  |
+-------+-------------+------+-------+---------+-------+
```

## 举例
```
mysql> select * from workload_groups()\G
+-------+--------+--------------+-------+
| Id    | Name   | Item         | Value |
+-------+--------+--------------+-------+
| 11001 | normal | memory_limit | 100%  |
| 11001 | normal | cpu_share    | 10    |
+-------+--------+--------------+-------+
```

### keywords

    workload_groups
