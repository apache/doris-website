---
{
    "title": "EXPLODE_MAP",
    "language": "en",
    "description": "The explodemap function takes a map (mapping type) and expands it into multiple rows, with each row containing a key-value pair."
}
---

## Description

The `explode_map` function takes a map (mapping type) and expands it into multiple rows, with each row containing a key-value pair. It is typically used in conjunction with LATERAL VIEW and can support multiple lateral views. It is supported only by the new optimizer.

The main difference between `explode_map` and `explode_map_outer` lies in the handling of null values.

## Syntax

```sql
EXPLODE_MAP(map<k,v>)
EXPLODE_MAP_OUTER(map<k,v>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `map<k,v>` | map type |

## Return Value

When the map is not empty or NULL, the return values of `explode_map` and `explode_map_outer` are the same.

When the data is empty or NULL:

`explode_map` Only processes non-empty map types. If the map is empty or NULL, `explode_map` will not return any rows.
`explode_map_outer` If the map is empty or NULL, explode_map_outer will retain the record with the empty or NULL map and return a row with NULL values.

## Examples


```sql
SET enable_nereids_planner=true
```

```sql
SET enable_fallback_to_original_planner=false
```

```sql
CREATE TABLE IF NOT EXISTS `sdu`(
                   `id` INT NULL,
                   `name` TEXT NULL,
                   `score` MAP<TEXT,INT> NULL
                 ) ENGINE=OLAP
                 DUPLICATE KEY(`id`)
                 COMMENT 'OLAP'
                 DISTRIBUTED BY HASH(`id`) BUCKETS 1
                 PROPERTIES ("replication_allocation" = "tag.location.default: 1");
Query OK, 0 rows affected (0.15 sec)
```

```sql
insert into sdu values (0, "zhangsan", {"Chinese":"80","Math":"60","English":"90"}), (1, "lisi", {"null":null}), (2, "wangwu", {"Chinese":"88","Math":"90","English":"96"}), (3, "lisi2", {null:null}), (4, "amory", NULL);
Query OK, 5 rows affected (0.23 sec)
{'label':'label_9b35d9d9d59147f5_bffb974881ed2133', 'status':'VISIBLE', 'txnId':'4005'}
```

```sql
select * from sdu order by id;
```

```text
+------+----------+-----------------------------------------+
| id   | name     | score                                   |
+------+----------+-----------------------------------------+
|    0 | zhangsan | {"Chinese":80, "Math":60, "English":90} |
|    1 | lisi     | {"null":null}                           |
|    2 | wangwu   | {"Chinese":88, "Math":90, "English":96} |
|    3 | lisi2    | {null:null}                             |
|    4 | amory    | NULL                                    |
+------+----------+-----------------------------------------+
```

```sql
select name, k,v from sdu lateral view explode_map(score) tmp as k,v;
```

```text
+----------+---------+------+
| name     | k       | v    |
+----------+---------+------+
| zhangsan | Chinese |   80 |
| zhangsan | Math    |   60 |
| zhangsan | English |   90 |
| lisi     | null    | NULL |
| wangwu   | Chinese |   88 |
| wangwu   | Math    |   90 |
| wangwu   | English |   96 |
| lisi2    | NULL    | NULL |
+----------+---------+------+
```

```sql
select name, k,v from sdu lateral view explode_map_outer(score) tmp as k,v;
```

```text
+----------+---------+------+
| name     | k       | v    |
+----------+---------+------+
| zhangsan | Chinese |   80 |
| zhangsan | Math    |   60 |
| zhangsan | English |   90 |
| lisi     | null    | NULL |
| wangwu   | Chinese |   88 |
| wangwu   | Math    |   90 |
| wangwu   | English |   96 |
| lisi2    | NULL    | NULL |
| amory    | NULL    | NULL |
+----------+---------+------+
```

```sql
select name, k,v,k1,v1 from sdu lateral view explode_map_outer(score) tmp as k,v lateral view explode_map(score) tmp2 as k1,v1;
```

```text
+----------+---------+------+---------+------+
| name     | k       | v    | k1      | v1   |
+----------+---------+------+---------+------+
| zhangsan | Chinese |   80 | Chinese |   80 |
| zhangsan | Chinese |   80 | Math    |   60 |
| zhangsan | Chinese |   80 | English |   90 |
| zhangsan | Math    |   60 | Chinese |   80 |
| zhangsan | Math    |   60 | Math    |   60 |
| zhangsan | Math    |   60 | English |   90 |
| zhangsan | English |   90 | Chinese |   80 |
| zhangsan | English |   90 | Math    |   60 |
| zhangsan | English |   90 | English |   90 |
| lisi     | null    | NULL | null    | NULL |
| wangwu   | Chinese |   88 | Chinese |   88 |
| wangwu   | Chinese |   88 | Math    |   90 |
| wangwu   | Chinese |   88 | English |   96 |
| wangwu   | Math    |   90 | Chinese |   88 |
| wangwu   | Math    |   90 | Math    |   90 |
| wangwu   | Math    |   90 | English |   96 |
| wangwu   | English |   96 | Chinese |   88 |
| wangwu   | English |   96 | Math    |   90 |
| wangwu   | English |   96 | English |   96 |
| lisi2    | NULL    | NULL | NULL    | NULL |
+----------+---------+------+---------+------+
```