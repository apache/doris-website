---
{
"title": "EXPLODE_MAP",
"language": "zh-CN"
}
---

## 描述

`explode_mpa` 函数接受一个 map (映射类型)，将 map（映射类型）展开成多个行，每行包含一个键值对。通常与 LATERAL VIEW 配合使用，可以支持多个 Lateral view。仅支持新优化器。

`explode_map` 和 `explode_map_outer` 区别主要在于空值处理。

## 语法
```sql
EXPLODE_MAP(map<k,v>)
EXPLODE_MAP_OUTER(map<k,v>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `map<k,v>` | map 类型 |

## 返回值

当 map 不为空或 NULL 时，`explode_map` 和 `explode_map_outer` 的返回值相同。

当数据为空或 NULL 时：

`explode_map` 只处理包含元素的 map。如果 map 是空的或为 NULL，explode_map 不会返回任何行。

`explode_map_outer` 如果 map 是空的或为 NULL，会保留空 map 或 NULL 的记录，返回的行将包含 NULL 值。

## 举例

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