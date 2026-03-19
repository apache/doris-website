---
{
  "title": "VAR_SAMP,VARIANCE_SAMP",
  "description": "VARSAMP関数は、指定された式のサンプル分散を計算します。VARIANCE（母集団分散）とは異なり、VARSAMPは除数としてn-1を使用します。",
  "language": "ja"
}
---
## 説明

VAR_SAMP関数は、指定された式の標本分散を計算します。VARIANCE（母分散）とは異なり、VAR_SARMPは除数としてn-1を使用します。これは統計学において母分散の不偏推定値と考えられています。

## 別名

- VARIANCE_SAMP

## 構文

```sql
VAR_SAMP(<expr>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<expr>` | 標本分散を計算する列または式。数値型である必要があります |

## Return Value
計算された標本分散を表すDOUBLE値を返します。

## Examples

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

-- Calculate sample variance of student scores
SELECT 
    VAR_SAMP(score) as sample_variance,
    VARIANCE(score) as population_variance
FROM student_scores;
```
```text
+------------------+---------------------+
| sample_variance  | population_variance |
+------------------+---------------------+
| 29.4107142857143 |   25.73437500000001 |
+------------------+---------------------+
```
