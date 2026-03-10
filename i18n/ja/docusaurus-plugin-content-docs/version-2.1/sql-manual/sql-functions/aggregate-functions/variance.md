---
{
  "title": "VARIANCE,VAR_POP,VARIANCE_POP",
  "language": "ja",
  "description": "VARIANCE関数は、指定された式の統計分散を計算します。"
}
---
## 説明

VARIANCE関数は、指定された式の統計的分散を計算します。この関数は、数値のセットが算術平均からどの程度散らばっているかを測定します。

## エイリアス

- VAR_POP
- VARIANCE_POP

## 構文

```sql
VARIANCE(<expr>)
```
## パラメータ
| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 分散を計算する列または式。数値型である必要があります |

## 戻り値
計算された分散を表すDOUBLE値を返します。

## 例

```sql
-- Create sample table
CREATE TABLE student_scores (
    student_id INT,
    score DECIMAL(4,1)
) DISTRIBUTED BY HASH(student_id)
PROPERTIES (
    "replication_num" = "1"
);

-- Insert test data
INSERT INTO student_scores VALUES
(1, 85.5),
(2, 92.0),
(3, 78.5),
(4, 88.0),
(5, 95.5),
(6, 82.0),
(7, 90.0),
(8, 87.5);
-- Calculate variance of student scores
SELECT VARIANCE(score) as score_variance
FROM student_scores;
```
```text
+-------------------+
| score_variance    |
+-------------------+
| 25.73437499999998 |
+-------------------+
```
