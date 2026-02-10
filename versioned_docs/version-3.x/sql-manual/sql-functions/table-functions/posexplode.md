---
{
    "title": "POSEXPLODE",
    "language": "en",
    "description": "The posexplode table function expands an array column into multiple rows and adds a column indicating the position of each element,"
}
---

## Description

The `posexplode` table function expands an array column into multiple rows and adds a column indicating the position of each element, returning a struct type. It must be used with LATERAL VIEW and supports multiple LATERAL VIEWs. Only supported with the new optimizer.

`posexplode_outer` is similar to `posexplode`, except for the handling of NULL values.

## Syntax

```sql
POSEXPLODE(<arr>)
POSEXPLODE_OUTER(<arr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<arr>` | An array that is to be expanded |

## Return Value

When the array is NULL or empty, posexplode_outer returns NULL.
Both `posexplode` and `posexplode_outer` include NULL elements inside the array.

## Examples

``` sql
CREATE TABLE IF NOT EXISTS `table_test`(
            `id` INT NULL,
            `name` TEXT NULL,
            `score` array<string> NULL
          ) ENGINE=OLAP
    DUPLICATE KEY(`id`)
    COMMENT 'OLAP'
    DISTRIBUTED BY HASH(`id`) BUCKETS 1
    PROPERTIES ("replication_allocation" = "tag.location.default: 1");
```

```sql
insert into table_test values (0, "zhangsan", ["Chinese","Math","English"]),(1, "lisi", ["null"]),(2, "wangwu", ["88a","90b","96c"]),(3, "lisi2", [null]),(4, "amory", NULL);
```

```sql
select * from table_test order by id;
```

```text
+------+----------+--------------------------------+
| id   | name     | score                          |
+------+----------+--------------------------------+
|    0 | zhangsan | ["Chinese", "Math", "English"] |
|    1 | lisi     | ["null"]                       |
|    2 | wangwu   | ["88a", "90b", "96c"]          |
|    3 | lisi2    | [null]                         |
|    4 | amory    | NULL                           |
+------+----------+--------------------------------+
```

```sql
select id,name,score, k,v from table_test lateral view posexplode(score) tmp as k,v order by id;
```

```text
+------+----------+--------------------------------+------+---------+
| id   | name     | score                          | k    | v       |
+------+----------+--------------------------------+------+---------+
|    0 | zhangsan | ["Chinese", "Math", "English"] |    0 | Chinese |
|    0 | zhangsan | ["Chinese", "Math", "English"] |    1 | Math    |
|    0 | zhangsan | ["Chinese", "Math", "English"] |    2 | English |
|    1 | lisi     | ["null"]                       |    0 | null    |
|    2 | wangwu   | ["88a", "90b", "96c"]          |    0 | 88a     |
|    2 | wangwu   | ["88a", "90b", "96c"]          |    1 | 90b     |
|    2 | wangwu   | ["88a", "90b", "96c"]          |    2 | 96c     |
|    3 | lisi2    | [null]                         |    0 | NULL    |
+------+----------+--------------------------------+------+---------+
```

```sql
select id,name,score, k,v from table_test lateral view posexplode_outer(score) tmp as k,v order by id;
```

```text
+------+----------+--------------------------------+------+---------+
| id   | name     | score                          | k    | v       |
+------+----------+--------------------------------+------+---------+
|    0 | zhangsan | ["Chinese", "Math", "English"] |    0 | Chinese |
|    0 | zhangsan | ["Chinese", "Math", "English"] |    1 | Math    |
|    0 | zhangsan | ["Chinese", "Math", "English"] |    2 | English |
|    1 | lisi     | ["null"]                       |    0 | null    |
|    2 | wangwu   | ["88a", "90b", "96c"]          |    0 | 88a     |
|    2 | wangwu   | ["88a", "90b", "96c"]          |    1 | 90b     |
|    2 | wangwu   | ["88a", "90b", "96c"]          |    2 | 96c     |
|    3 | lisi2    | [null]                         |    0 | NULL    |
|    4 | amory    | NULL                           | NULL | NULL    |
+------+----------+--------------------------------+------+---------+
```