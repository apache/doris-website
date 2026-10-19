---
{
    "title": "VAR_SAMP,VARIANCE_SAMP",
    "language": "ko",
    "description": "VARSAMP 함수는 지정된 표현식의 표본 분산을 계산합니다. VARIANCE(모분산)와 달리 VARSAMP는 n-1을 제수로 사용합니다."
}
---

## 설명 {#description}

VAR_SAMP 함수는 지정된 표현식의 표본 분산을 계산합니다. VARIANCE(모분산)와 달리 VAR_SAMP는 n-1을 제수로 사용하며, 이렇게 계산한 값은 통계학에서 모분산의 불편 추정값으로 간주됩니다.

## 별칭 {#alias}

- VARIANCE_SAMP

## 구문 {#syntax}

```sql
VAR_SAMP(<expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr>` | 표본 분산을 계산할 열 또는 표현식입니다. Double 타입을 지원합니다. |

## 반환 값 {#return-value}
계산된 표본 분산을 나타내는 Double 값을 반환합니다.
그룹에 유효한 데이터가 없으면 NULL을 반환합니다.

## 예제 {#examples}
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
