---
{
    "title": "PERCENTILE_APPROX",
    "language": "ko",
    "description": "PERCENTILEAPPROX 함수는 주로 대규모 데이터셋의 근사 백분위수를 계산하는 데 사용됩니다. PERCENTILE 함수와 비교하면,"
}
---

## 설명 {#description}

`PERCENTILE_APPROX` 함수는 주로 대규모 데이터셋의 근사 백분위수를 계산하는 데 사용됩니다. `PERCENTILE` 함수와 비교하면 다음과 같은 특징이 있습니다.

1. 메모리 효율성: 고정 크기의 메모리를 사용하므로 카디널리티가 낮은 열(데이터 양은 많지만 서로 다른 요소의 수가 적은 열)을 처리할 때도 메모리 사용량을 낮게 유지합니다.
2. 성능 이점: 계산 속도가 빨라 카디널리티가 낮은 대규모 데이터셋을 처리하기에 적합합니다.
3. 정밀도 조정: 압축 매개변수를 통해 정밀도와 성능 간의 균형을 조정할 수 있습니다.


## 구문 {#syntax}

```sql
PERCENTILE_APPROX(<col>, <p> [, <compression>])
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<col>` | 백분위수를 계산할 열입니다. 지원하는 타입은 Double입니다. |
| `<p>` | 백분위수 값으로, Double 타입의 상수이며 범위는 `[0.0, 1.0]`입니다. 예를 들어 `0.99`는 99번째 백분위수를 의미합니다. 상수여야 합니다. |
| `<compression>` | 선택 사항인 압축 수준으로, Double 타입이며 범위는 `[2048, 10000]`입니다. 값이 클수록 정밀도가 높아지지만 메모리를 더 많이 사용합니다. 지정하지 않거나 범위를 벗어나면 기본값인 `10000`을 사용합니다. |

## 반환 값 {#return-value}

지정된 열의 근사 백분위수를 Double 타입으로 반환합니다.
그룹에 유효한 데이터가 없으면 NULL을 반환합니다.

## 예제 {#examples}

```sql
-- setup
CREATE TABLE response_times (
    request_id INT,
    response_time DECIMAL(10, 2)
) DUPLICATE KEY(`request_id`)
DISTRIBUTED BY HASH(`request_id`) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
INSERT INTO response_times VALUES
(1, 10.5),
(2, 15.2),
(3, 20.1),
(4, 25.8),
(5, 30.3),
(6, 35.7),
(7, 40.2),
(8, 45.9),
(9, 50.4),
(10, 100.6);
```

```sql
-- Calculate 99th percentile using different compression levels
SELECT 
    percentile_approx(response_time, 0.99) as p99_default,          -- Default compression
    percentile_approx(response_time, 0.99, 2048) as p99_fast,       -- Lower compression, faster
    percentile_approx(response_time, 0.99, 10000) as p99_accurate   -- Higher compression, more accurate
FROM response_times;
```

```text
+-------------------+-------------------+-------------------+
| p99_default       | p99_fast          | p99_accurate      |
+-------------------+-------------------+-------------------+
| 100.5999984741211 | 100.5999984741211 | 100.5999984741211 |
+-------------------+-------------------+-------------------+
```

```sql
SELECT percentile_approx(if(response_time>90,response_time,NULL), 0.5) FROM response_times;
```

NULL이 아닌 데이터만 계산에 사용됩니다.

```text
+-----------------------------------------------------------------+
| percentile_approx(if(response_time>90,response_time,NULL), 0.5) |
+-----------------------------------------------------------------+
|                                               100.5999984741211 |
+-----------------------------------------------------------------+
```

```sql
SELECT percentile_approx(NULL, 0.99) FROM response_times;
```

모든 입력 데이터가 NULL이면 NULL을 반환합니다.

```text
+-------------------------------+
| percentile_approx(NULL, 0.99)  |
+-------------------------------+
|                          NULL  |
+-------------------------------+
```
