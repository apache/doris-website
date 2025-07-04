---
{
    "title": "RESOURCE_GROUPS",
    "language": "zh-CN"
}
---

## `resource_groups`

### Name

<version since="dev">

resource_groups

</version>

## 描述

表函数，生成 resource_groups 临时表，可以查看当前资源组信息。

该函数用于from子句中。

## 语法
`resource_groups()`

resource_groups()表结构：
```
mysql> desc function resource_groups();
+-------+-------------+------+-------+---------+-------+
| Field | Type        | Null | Key   | Default | Extra |
+-------+-------------+------+-------+---------+-------+
| Id    | BIGINT      | No   | false | NULL    | NONE  |
| Name  | VARCHAR(64) | No   | false | NULL    | NONE  |
| Item  | VARCHAR(64) | No   | false | NULL    | NONE  |
| Value | INT         | No   | false | NULL    | NONE  |
+-------+-------------+------+-------+---------+-------+
```

## 举例
```
mysql> select * from resource_groups()\G
+-------+------------+-----------+-------+
| Id    | Name       | Item      | Value |
+-------+------------+-----------+-------+
| 10076 | group_name | cpu_share |     1 |
| 10077 | group_test | cpu_share |    10 |
+-------+------------+-----------+-------+
```

### keywords

    resource_groups