---
{
  "title": "EXPLODE_SPLIT",
  "description": "explodesplit table関数は、指定された区切り文字に基づいて文字列を複数の部分文字列に分割し、各部分文字列を展開するために使用されます",
  "language": "ja"
}
---
## 説明

`explode_split`table関数は、指定された区切り文字に基づいて文字列を複数の部分文字列に分割し、各部分文字列を別々の行に展開するために使用されます。各部分文字列は個別の行として返され、通常はLATERAL VIEWと組み合わせて使用し、長い文字列を個別の部分に分解してより詳細なクエリを実行します。

`explode_split_outer`は`explode_split`と似ていますが、空の文字列やNULL文字列の処理方法が異なります。

## 構文

```sql
EXPLODE_SPLIT(<str>, <delimiter>)
EXPLODE_SPLIT_OUTER(<str>, <delimiter>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<str>` | 文字列型 |
| `<delimiter>` | 区切り文字 |

## Return Value

分割された部分文字列のシーケンスを返します。文字列が空またはNULLの場合、行は返されません。

## Examples

```sql
select * from example1 order by k1;
```
```text
+------+---------+
| k1   | k2      |
+------+---------+
|    1 |         |
|    2 | NULL    |
|    3 | ,       |
|    4 | 1       |
|    5 | 1,2,3   |
|    6 | a, b, c |
+------+---------+
```
```sql
select k1, e1 from example1 lateral view explode_split(k2, ',') tmp1 as e1 where k1 = 1 order by k1, e1;
```
```text
+------+------+
| k1   | e1   |
+------+------+
|    1 |      |
+------+------+
```
```sql
select k1, e1 from example1 lateral view explode_split(k2, ',') tmp1 as e1 where k1 = 2 order by k1, e1;
Empty set
```
```sql
select k1, e1 from example1 lateral view explode_split(k2, ',') tmp1 as e1 where k1 = 3 order by k1, e1;
```
```text
+------+------+
| k1   | e1   |
+------+------+
|    3 |      |
+------+------+
```
```sql
select k1, e1 from example1 lateral view explode_split(k2, ',') tmp1 as e1 where k1 = 4 order by k1, e1;
```
```text
+------+------+
| k1   | e1   |
+------+------+
|    4 | 1    |
+------+------+
```
```sql
select k1, e1 from example1 lateral view explode_split(k2, ',') tmp1 as e1 where k1 = 5 order by k1, e1;
```
```text
+------+------+
| k1   | e1   |
+------+------+
|    5 | 2    |
|    5 | 3    |
|    5 | 1    |
+------+------+
```
```sql
select k1, e1 from example1 lateral view explode_split(k2, ',') tmp1 as e1 where k1 = 6 order by k1, e1;
```
```text
+------+------+
| k1   | e1   |
+------+------+
|    6 |  b   |
|    6 |  c   |
|    6 | a    |
+------+------+
```
```sql
CREATE TABLE example2 (
    id INT,
    str string null
)DUPLICATE KEY(id)
DISTRIBUTED BY HASH(`id`) BUCKETS AUTO
PROPERTIES (
"replication_allocation" = "tag.location.default: 1");
```
```sql
insert into example2 values (1,''),(2,NUll),(3,"1"),(4,"1,2,3"),(5,"a,b,c");
```
```sql
select id, e1 from example2 lateral view explode_split(str, ',') tmp1 as e1 where id = 2 order by id, e1;
Empty set (0.02 sec)
```
```sql
select id, e1 from example2 lateral view explode_split_outer(str, ',') tmp1 as e1 where id = 2 order by id, e1;
```
```text
+------+------+
| id   | e1   |
+------+------+
|    2 | NULL |
+------+------+
```
