---
{
  "title": "STD,STDDEV,STDDEV_POP",
  "description": "expr式の標準偏差を返します",
  "language": "ja"
}
---
## 説明

expr式の標準偏差を返します

## エイリアス

- STD
- STDDEV_POP

## 構文

```sql
STDDEV(<expr>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<expr>` | 標準偏差を計算する値。Double型をサポートします。 |

## Return Value

expr式の標本標準偏差をDouble型として返します。
グループに有効なデータがない場合は、NULLを返します。

## Examples

```sql
-- Create sample tables
CREATE TABLE score_table (
    student_id INT,
    score DOUBLE
) DISTRIBUTED BY HASH(student_id)
PROPERTIES (
    "replication_num" = "1"
);

-- Insert test data
INSERT INTO score_table VALUES
(1, 85),
(2, 90),
(3, 82),
(4, 88),
(5, 95);

-- Calculate the standard deviation of all students' scores
SELECT STDDEV(score) as score_stddev
FROM score_table;
```
```text
+-------------------+
| score_stddev      |
+-------------------+
| 4.427188724235729 |
+-------------------+
```
