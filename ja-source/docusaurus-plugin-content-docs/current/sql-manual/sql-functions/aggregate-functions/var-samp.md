---
{
  "title": "VAR_SAMP,VARIANCE_SAMP",
  "language": "ja",
  "description": "VARSAMP関数は、指定された式の標本分散を計算します。VARIANCE（母集団分散）とは異なり、VARSAMPは除数としてn-1を使用します。"
}
---
## 説明

VAR_SAMP関数は、指定された式のサンプル分散を計算します。VARIANCE（母分散）とは異なり、VAR_SAMPは除数としてn-1を使用し、統計学において母分散の不偏推定値とされています。

## エイリアス

- VARIANCE_SAMP

## 構文

```sql
VAR_SAMP(<expr>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 標本分散を計算する列または式。Double型をサポート。 |

## 戻り値
計算された標本分散を表すDouble値を返します。
グループ内に有効なデータがない場合、NULLを返します。

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
