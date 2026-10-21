---
{
    "title": "STDDEV_SAMP",
    "language": "ko",
    "description": "expr 표현식의 표본 표준편차를 반환합니다"
}
---

## 설명 {#description}

expr 표현식의 표본 표준편차를 반환합니다.

## 구문 {#syntax}

```sql
STDDEV_SAMP(<expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr>` | 표준편차를 계산할 값입니다. Double 타입을 지원합니다. |

## 반환 값 {#return-value}

expr 표현식의 표본 표준편차를 Double 타입으로 반환합니다.
그룹에 유효한 데이터가 없으면 NULL을 반환합니다.

### 예제 {#examples}
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

-- Calculate the sample standard deviation of all students' scores
SELECT STDDEV_SAMP(score) as score_stddev
FROM score_table;
```

```text
+-------------------+
| score_stddev      |
+-------------------+
| 4.949747468305831 |
+-------------------+
```
