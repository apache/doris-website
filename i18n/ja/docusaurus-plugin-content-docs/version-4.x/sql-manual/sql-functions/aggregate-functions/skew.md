---
{
  "title": "SKEW,SKEW_POP,SKEWNESS",
  "description": "expr式の歪度を返します。この関数で使用される式は、3rd central moment / ((variance)^{1.5})です。",
  "language": "ja"
}
---
## 説明

expr式の[歪度](https://en.wikipedia.org/wiki/Skewness)を返します。
この関数で使用される数式は`3rd central moment / ((variance)^{1.5})`です。

**関連コマンド**

[kurt](./kurt.md)

## エイリアス

- SKEW
- SKEW_POP

## 構文

```sql
SKEWNESS(<col>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<col>` | 歪度を計算する列で、Double型をサポートします。 |

## Return Value

`expr`式の歪度を返します。これはDouble型です。
分散がゼロの場合、NULLを返します。
グループに有効なデータがない場合、NULLを返します。

## Examples

```sql
CREATE TABLE statistic_test(
    tag int, 
    val1 double not null, 
    val2 double null
) DISTRIBUTED BY HASH(tag)
PROPERTIES (
    "replication_num"="1"
);

INSERT INTO statistic_test VALUES
(1, -10, -10),
(2, -20, NULL),
(3, 100, NULL),
(4, 100, NULL),
(5, 1000,1000);

-- NULL is ignored
SELECT 
  skew(val1), 
  skew(val2)
FROM statistic_test;
```
```text
+--------------------+------------+
| skew(val1)         | skew(val2) |
+--------------------+------------+
| 1.4337199628825619 |          0 |
+--------------------+------------+
```
```sql
-- Each group just has one row, result is NULL
SELECT 
  skew(val1), 
  skew(val2) 
FROM statistic_test
GROUP BY tag;
```
```text
+------------+------------+
| skew(val1) | skew(val2) |
+------------+------------+
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
+------------+------------+
```
