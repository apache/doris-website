---
{
  "title": "COUNT",
  "description": "指定された列の非NULLレコード数、または総レコード数を返します。",
  "language": "ja"
}
---
## デスクリプション

指定されたカラム内のNULL以外のレコード数、または総レコード数を返します。

## Syntax

```sql
COUNT(DISTINCT <expr> [,<expr>,...])
COUNT(*)
COUNT(<expr>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<expr>` | 条件式（カラム名） |

## Return Value

戻り値は数値型です。exprがNULLの場合、パラメータ統計は存在しません。

## Example

```sql
select * from test_count;
```
```text
+------+------+------+
| id   | name | sex  |
+------+------+------+
|    1 | 1    |    1 |
|    2 | 2    |    1 |
|    3 | 3    |    1 |
|    4 | 0    |    1 |
|    4 | 4    |    1 |
|    5 | NULL |    1 |
+------+------+------+
```
```sql
select count(*) from test_count;
```
```text
+----------+
| count(*) |
+----------+
|        6 |
+----------+
```
```sql
select count(name) from test_insert;
```
```text
+-------------+
| count(name) |
+-------------+
|           5 |
+-------------+
```
```sql
select count(distinct sex) from test_insert;
```
```text
+---------------------+
| count(DISTINCT sex) |
+---------------------+
|                   1 |
+---------------------+
```
```sql
select count(distinct id,sex) from test_insert;
```
```text
+-------------------------+
| count(DISTINCT id, sex) |
+-------------------------+
|                       5 |
+-------------------------+
```
