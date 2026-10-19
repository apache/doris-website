---
{
    "title": "PERCENTILE_ARRAY",
    "language": "ko",
    "description": "PERCENTILEARRAY 함수는 정확한 백분위수 배열을 계산하며, 여러 백분위수 값을 한 번에 계산할 수 있습니다."
}
---

## 설명 {#description}

`PERCENTILE_ARRAY` 함수는 정확한 백분위수 배열을 계산하며, 여러 백분위수 값을 한 번에 계산할 수 있습니다. 이 함수는 주로 소규모 데이터 세트에 적합합니다.

주요 기능:
1. 정확한 계산: 근삿값이 아닌 정확한 백분위수 결과를 제공합니다
2. 일괄 처리: 한 번의 연산으로 여러 백분위수를 계산할 수 있습니다
3. 적용 범위: 소규모 데이터 세트를 처리하는 데 가장 적합합니다


## 구문 {#syntax}

```sql
PERCENTILE_ARRAY(<col>, <array_p>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<col>` | 정확한 백분위수를 계산할 컬럼입니다. 지원하는 타입: Double, Float, LargeInt, BigInt, Int, SmallInt, TinyInt. |
| `<array_p>` | 백분위수 배열로, 각 요소는 Array<Double> 타입의 상수여야 하며 값은 `[0.0, 1.0]` 범위에 있어야 합니다. 예: `[0.5, 0.95, 0.99]`. |

## 반환값 {#return-value}

계산된 백분위수 값을 담은 DOUBLE 타입 배열을 반환합니다.
그룹에 유효한 데이터가 없으면 빈 배열을 반환합니다.


## 예제 {#examples}

```sql
-- setup
CREATE TABLE sales_data (
    id INT,
    amount DECIMAL(10, 2)
) DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
INSERT INTO sales_data VALUES
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
SELECT percentile_array(amount, [0.25, 0.5, 0.75, 0.9]) as percentiles
FROM sales_data;
```

여러 백분위수를 계산합니다.

```text
+-----------------------------------------------------+
| percentiles                                         |
+-----------------------------------------------------+
| [21.525000000000002, 33, 44.475, 55.41999999999998] |
+-----------------------------------------------------+
```

```sql
SELECT percentile_array(if(amount>90, amount, NULL), [0.5, 0.99]) FROM sales_data;
```

NULL이 아닌 데이터만 계산에 사용합니다.

```text
+------------------------------------------------------------+
| percentile_array(if(amount>90, amount, NULL), [0.5, 0.99]) |
+------------------------------------------------------------+
| [100.6, 100.6]                                             |
+------------------------------------------------------------+
```

```sql
SELECT percentile_array(NULL, [0.5, 0.99]) FROM sales_data;
```

입력 데이터가 모두 NULL이면 빈 배열을 반환합니다.

```text
+-------------------------------------+
| percentile_array(NULL, [0.5, 0.99]) |
+-------------------------------------+
| []                                  |
+-------------------------------------+
```
