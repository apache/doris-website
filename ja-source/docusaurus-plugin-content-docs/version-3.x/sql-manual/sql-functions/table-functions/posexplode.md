---
{
  "title": "POSEXPLODE",
  "description": "posexplode table関数は、配列カラムを複数行に展開し、各要素の位置を示すカラムを追加します。",
  "language": "ja"
}
---
## 説明

`posexplode`table関数は、配列カラムを複数の行に展開し、各要素の位置を示すカラムを追加して、struct型を返します。LATERAL VIEWと組み合わせて使用する必要があり、複数のLATERAL VIEWをサポートします。新しいオプティマイザーでのみサポートされています。

`posexplode_outer`は`posexplode`と似ていますが、NULL値の処理が異なります。

## 構文

```sql
POSEXPLODE(<arr>)
POSEXPLODE_OUTER(<arr>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<arr>` | 展開される配列 |

## Return Value

配列がNULLまたは空の場合、posexplode_outerはNULLを返します。
`posexplode`と`posexplode_outer`の両方とも、配列内のNULL要素を含みます。

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
