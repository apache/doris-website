---
{
    "title": "VARIANCE,VAR_POP,VARIANCE_POP",
    "language": "ko",
    "description": "VARIANCE 함수는 지정된 표현식의 통계적 분산을 계산합니다."
}
---

## 설명 {#description}

VARIANCE 함수는 지정된 표현식의 통계적 분산을 계산합니다. 숫자 집합이 산술 평균을 기준으로 얼마나 흩어져 있는지를 측정합니다.

## 별칭 {#alias}

- VAR_POP
- VARIANCE_POP

## 구문 {#syntax}

```sql
VARIANCE(<expr>)
```

## 매개변수 {#parameters}
| 매개변수 | 설명 |
| -- | -- |
| `<expr>` | 분산을 계산할 열 또는 표현식으로, Double 타입을 지원합니다. |

## 반환 값 {#return-value}
계산된 분산을 나타내는 Double 값을 반환합니다.
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
