---
{
  "title": "STDDEV,STDDEV_POP",
  "language": "ja",
  "description": "expr式の標準偏差を返します"
}
---
## 説明

expr式の標準偏差を返します

## エイリアス

- STDDEV_POP

## 構文

```sql
STDDEV(<expr>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 標準偏差を計算する値 |

## 戻り値

expr式の標準偏差を返す

## 例

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
