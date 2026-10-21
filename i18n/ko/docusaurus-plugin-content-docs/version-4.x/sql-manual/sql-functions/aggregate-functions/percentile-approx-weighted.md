---
{
    "title": "PERCENTILE_APPROX_WEIGHTED",
    "language": "ko",
    "description": "PERCENTILEAPPROXWEIGHTED 함수는 가중 근사 백분위수를 계산합니다,"
}
---

## 설명 {#description}

`PERCENTILE_APPROX_WEIGHTED` 함수는 가중 근사 백분위수를 계산하며, 주로 값의 중요도를 고려해야 하는 상황에서 사용합니다. `PERCENTILE_APPROX`에 가중치를 적용한 버전으로, 각 값에 가중치를 지정할 수 있습니다.

주요 특징:
1. 가중치 지원: 각 값에 가중치를 할당할 수 있으며, 이 가중치는 최종 백분위수 계산에 영향을 줍니다.
2. 메모리 효율성: 고정 크기의 메모리를 사용하므로 카디널리티가 낮은 컬럼(데이터 양은 많지만 서로 다른 요소의 수는 적음)을 처리할 때도 메모리 사용량을 낮게 유지합니다.
3. 정밀도 조정: 압축 매개변수를 통해 정밀도와 성능 간의 균형을 조절할 수 있습니다.

## 구문 {#syntax}

```sql
PERCENTILE_APPROX_WEIGHTED(<col>, <weight>, <p> [, <compression>])
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<col>` | 백분위수를 계산할 컬럼입니다. 지원 타입: Double |
| `<weight>` | 가중치 컬럼으로, 값은 양수여야 합니다. 지원 타입: Double |
| `<p>` | 백분위수 값으로, 범위는 `[0.0, 1.0]`입니다. 예를 들어 `0.99`는 `99`번째 백분위수를 나타냅니다. |
| `<compression>` | 선택적 매개변수이며, 지원 타입은 Double입니다. 압축률을 지정하며, 범위는 `[2048, 10000]`입니다. 값이 클수록 정밀도가 높아지지만 메모리 사용량도 증가합니다. 지정하지 않거나 범위를 벗어나면 `10000`을 사용합니다. |

## 반환 값 {#return-value}

계산된 가중 근사 백분위수를 나타내는 `DOUBLE` 타입의 값을 반환합니다.
그룹에 유효한 데이터가 없으면 `NULL`을 반환합니다.

## 예제 {#examples}

```sql
-- Create sample table
CREATE TABLE weighted_scores (
    student_id INT,
    score DECIMAL(10, 2),
    weight INT
) DUPLICATE KEY(student_id)
DISTRIBUTED BY HASH(student_id) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

-- Insert example data
INSERT INTO weighted_scores VALUES
(1, 85.5, 1),   -- Normal homework score, weight 1
(2, 90.0, 2),   -- Important homework score, weight 2
(3, 75.5, 1),
(4, 95.5, 3),   -- Very important homework, weight 3
(5, 88.0, 2),
(6, 92.5, 2),
(7, 78.0, 1),
(8, 89.5, 2),
(9, 94.0, 3),
(10, 83.5, 1);

-- Calculate weighted scores distribution
SELECT 
    -- Calculate 90th percentile for different compression ratios
    percentile_approx_weighted(score, weight, 0.9) as p90_default,          -- Default compression ratio
    percentile_approx_weighted(score, weight, 0.9, 2048) as p90_fast,       -- Lower compression ratio, faster
    percentile_approx_weighted(score, weight, 0.9, 10000) as p90_accurate   -- Higher compression ratio, more accurate
FROM weighted_scores;
```

```text
+------------------+------------------+------------------+
| p90_default      | p90_fast         | p90_accurate     |
+------------------+------------------+------------------+
| 95.3499984741211 | 95.3499984741211 | 95.3499984741211 |
+------------------+------------------+------------------+
```


```sql
select percentile_approx_weighted(if(score>95,score,null), weight, 0.9) from weighted_scores;
```

NULL이 아닌 입력만 고려합니다.

```text
+------------------------------------------------------------------+
| percentile_approx_weighted(if(score>95,score,null), weight, 0.9) |
+------------------------------------------------------------------+
|                                                             95.5 |
+------------------------------------------------------------------+
```

```sql
select percentile_approx_weighted(score, weight, 0.9, null) from weighted_scores;
```

모든 입력값이 NULL이면 함수는 NULL을 반환합니다.

```text
+------------------------------------------------------+
| percentile_approx_weighted(score, weight, 0.9, null) |
+------------------------------------------------------+
|                                                 NULL |
+------------------------------------------------------+
```
