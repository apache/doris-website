---
{
    "title": "PERCENT_RANK",
    "language": "ko",
    "description": "PERCENTRANK()는 파티션 또는 결과 집합 내에서 행의 상대 순위를 계산하고 0.0부터 1.0까지의 값을 반환하는 윈도우 함수입니다."
}
---

## 설명 {#description}

PERCENT_RANK()는 파티션 또는 결과 집합 내에서 행의 상대 순위를 계산하고 0.0부터 1.0까지의 값을 반환하는 윈도우 함수입니다. 각 행의 값은 (rank - 1) / (total_rows - 1)로 계산하며, 여기서 rank는 현재 행의 순위이고 total_rows는 파티션의 전체 행 수입니다.

## 구문 {#syntax}

```sql
PERCENT_RANK()
```

## 반환 값 {#return-value}

0.0부터 1.0까지의 DOUBLE 값을 반환합니다.
- 파티션의 첫 번째 행에 대해 항상 0을 반환합니다.
- 파티션의 마지막 행에 대해 항상 1을 반환합니다.
- 동일한 값에 대해 동일한 백분율 순위를 반환합니다.

## 예제 {#examples}

```sql
CREATE TABLE test_percent_rank (
    productLine VARCHAR,
    orderYear INT,
    orderValue DOUBLE,
    percentile_rank DOUBLE
) ENGINE=OLAP
DISTRIBUTED BY HASH(`orderYear`) BUCKETS 4
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```

```sql
INSERT INTO test_percent_rank (productLine, orderYear, orderValue, percentile_rank) VALUES
('Motorcycles', 2003, 2440.50, 0.00),
('Trains', 2003, 2770.95, 0.17),
('Trucks and Buses', 2003, 3284.28, 0.33),
('Vintage Cars', 2003, 4080.00, 0.50),
('Planes', 2003, 4825.44, 0.67),
('Ships', 2003, 5072.71, 0.83),
('Classic Cars', 2003, 5571.80, 1.00),
('Motorcycles', 2004, 2598.77, 0.00),
('Vintage Cars', 2004, 2819.28, 0.17),
('Planes', 2004, 2857.35, 0.33),
('Ships', 2004, 4301.15, 0.50),
('Trucks and Buses', 2004, 4615.64, 0.67),
('Trains', 2004, 4646.88, 0.83),
('Classic Cars', 2004, 8124.98, 1.00),
('Ships', 2005, 1603.20, 0.00),
('Motorcycles', 2005, 3774.00, 0.17),
('Planes', 2005, 4018.00, 0.50),
('Vintage Cars', 2005, 5346.50, 0.67),
('Classic Cars', 2005, 5971.35, 0.83),
('Trucks and Buses', 2005, 6295.03, 1.00);
```

```sql
SELECT
    productLine,
    orderYear,
    orderValue,
    ROUND(
    PERCENT_RANK()
    OVER (
        PARTITION BY orderYear
        ORDER BY orderValue
    ),2) percentile_rank
FROM
    test_percent_rank
ORDER BY
    orderYear;
```

```text
+------------------+-----------+------------+-----------------+
| productLine      | orderYear | orderValue | percentile_rank |
+------------------+-----------+------------+-----------------+
| Motorcycles      |      2003 |     2440.5 |               0 |
| Trains           |      2003 |    2770.95 |            0.17 |
| Trucks and Buses |      2003 |    3284.28 |            0.33 |
| Vintage Cars     |      2003 |       4080 |             0.5 |
| Planes           |      2003 |    4825.44 |            0.67 |
| Ships            |      2003 |    5072.71 |            0.83 |
| Classic Cars     |      2003 |     5571.8 |               1 |
| Motorcycles      |      2004 |    2598.77 |               0 |
| Vintage Cars     |      2004 |    2819.28 |            0.17 |
| Planes           |      2004 |    2857.35 |            0.33 |
| Ships            |      2004 |    4301.15 |             0.5 |
| Trucks and Buses |      2004 |    4615.64 |            0.67 |
| Trains           |      2004 |    4646.88 |            0.83 |
| Classic Cars     |      2004 |    8124.98 |               1 |
| Ships            |      2005 |     1603.2 |               0 |
| Motorcycles      |      2005 |       3774 |             0.2 |
| Planes           |      2005 |       4018 |             0.4 |
| Vintage Cars     |      2005 |     5346.5 |             0.6 |
| Classic Cars     |      2005 |    5971.35 |             0.8 |
| Trucks and Buses |      2005 |    6295.03 |               1 |
+------------------+-----------+------------+-----------------+
```
