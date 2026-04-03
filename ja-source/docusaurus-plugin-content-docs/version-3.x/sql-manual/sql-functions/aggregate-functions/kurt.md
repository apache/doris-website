---
{
  "title": "KURT,KURT_POP,KURTOSIS",
  "description": "KURTOSIS関数は、expr式の尖度を返します。この関数で使用される数式は、4次中心モーメント / ((分散)^2) - 3です。",
  "language": "ja"
}
---
## 説明

KURTOSIS関数は、expr式の[尖度](https://en.wikipedia.org/wiki/Kurtosis)を返します。
この関数で使用される数式は`4-th centrol moment / ((variance)^2) - 3`です。

## エイリアス

KURT_POP,KURTOSIS

## 構文

```sql
KURTOSIS(<expr>)
```
## パラメータ

| パラメータ | デスクリプション |
| -- | -- |
| `<expr>` | 取得する必要がある式 |

## Return Value

DOUBLE型の値を返します。特殊なケース:
- 分散がゼロの場合、NULLを返します。

## Example

```sql
select * from statistic_test;
```
```text
+-----+------+------+
| tag | val1 | val2 |
+-----+------+------+
|   1 |  -10 |   -10|
|   2 |  -20 |  NULL|
|   3 |  100 |  NULL|
|   4 |  100 |  NULL|
|   5 | 1000 |  1000|
+-----+------+------+
```
```sql
select kurt(val1), kurt(val2) from statistic_test;
```
```text
+-------------------+--------------------+
| kurt(val1)        | kurt(val2)         |
+-------------------+--------------------+
| 0.162124583734851 | -1.3330994719286338 |
+-------------------+--------------------+
```
```sql
// Each group just has one row, result is NULL
select kurt(val1), kurt(val2) from statistic_test group by tag;
```
```text
+------------+------------+
| kurt(val1) | kurt(val2) |
+------------+------------+
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
+------------+------------+
```
