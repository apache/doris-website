---
{
    "title": "NTILE",
    "language": "ko",
    "description": "NTILE()은 정렬된 데이터셋을 지정된 수의 크기가 거의 같은 버킷으로 나누는 윈도우 함수입니다."
}
---

## 설명 {#description}

NTILE()은 정렬된 데이터셋을 지정된 수의 크기가 거의 같은 버킷으로 나누는 윈도우 함수입니다. 버킷에는 1부터 지정된 버킷 수까지 순서대로 번호가 부여됩니다. 데이터를 균등하게 나눌 수 없으면 남는 레코드를 번호가 낮은 버킷에 할당하여 버킷 간 행 수 차이가 최대 1이 되도록 합니다.

## 구문 {#syntax}

```sql
NTILE( <constant_value> )
```

## 매개변수 {#parameters}
| 매개변수       | 설명                                                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| constant_value | 필수 항목입니다. 생성할 버킷 수를 지정하며, 양의 정수여야 합니다.

## 반환 값 {#return-value}

1부터 지정된 버킷 수까지의 범위에 속하는 BIGINT 타입의 버킷 번호를 반환합니다.

## 사용 시 참고 사항 {#usage-notes}

문에 NTILE 함수의 ORDER BY 절과 출력 결과의 ORDER BY 절이 모두 포함되어 있으면 두 정렬은 서로 독립적으로 수행됩니다.
- NTILE 함수의 ORDER BY는 각 행이 할당될 버킷을 결정합니다.
- 출력 결과의 ORDER BY는 결과가 표시되는 순서를 결정합니다.

## 예제 {#examples}

<!-- setup-sql
CREATE TABLE student_scores (name VARCHAR(20), score INT) DISTRIBUTED BY HASH(name) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO student_scores VALUES ('Alice',98),('Bob',95),('Charlie',90),('David',85),('Eve',82),('Frank',78),('Grace',75),('Henry',70);
-->

```sql
SELECT 
    name,
    score,
    NTILE(4) OVER (ORDER BY score DESC) as quarter
FROM student_scores;
```

```text
+----------+-------+---------+
| name     | score | quarter |
+----------+-------+---------+
| Alice    | 98    | 1       |  -- Top 25% scores
| Bob      | 95    | 1       |
| Charlie  | 90    | 2       |  -- 25-50% scores
| David    | 85    | 2       |
| Eve      | 82    | 3       |  -- 50-75% scores
| Frank    | 78    | 3       |
| Grace    | 75    | 4       |  -- Bottom 25% scores
| Henry    | 70    | 4       |
+----------+-------+---------+
```
