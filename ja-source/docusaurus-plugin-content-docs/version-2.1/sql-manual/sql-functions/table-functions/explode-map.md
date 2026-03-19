---
{
  "title": "EXPLODE_MAP",
  "language": "ja",
  "description": "explodemap関数はmap（マッピング型）を受け取り、それを複数の行に展開します。各行にはキーと値のペアが含まれます。"
}
---
## 説明

`explode_map`関数はmap（マッピング型）を受け取り、複数の行に展開します。各行にはキーと値のペアが含まれます。通常はLATERAL VIEWと組み合わせて使用され、複数のlateral viewをサポートできます。新しいオプティマイザーでのみサポートされています。

`explode_map`と`explode_map_outer`の主な違いは、null値の処理方法にあります。

## 構文

```sql
EXPLODE_MAP(map<k,v>)
EXPLODE_MAP_OUTER(map<k,v>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `map<k,v>` | map型 |

## 戻り値

mapが空でない、またはNULLでない場合、`explode_map`と`explode_map_outer`の戻り値は同じです。

データが空またはNULLの場合：

`explode_map` 空でないmap型のみを処理します。mapが空またはNULLの場合、`explode_map`は行を返しません。
`explode_map_outer` mapが空またはNULLの場合、explode_map_outerは空またはNULLのmapを持つレコードを保持し、NULL値を持つ行を返します。

## 例

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
