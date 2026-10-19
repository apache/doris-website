---
{
    "title": "CUME_DIST",
    "language": "ko",
    "description": "CUMEDIST (Cumulative Distribution)는 정렬된 결과 집합에서 현재 행 값의 상대적 순위를 계산하는 윈도우 함수입니다."
}
---

## 설명 {#description}

CUME_DIST (Cumulative Distribution)는 정렬된 결과 집합에서 현재 행 값의 상대적 순위를 계산하는 윈도우 함수입니다. 결과 집합에서 현재 행의 누적 분포 값을 반환하며, 이 값의 범위는 0에서 1 사이입니다. 주어진 행의 누적 분포 값은 다음과 같습니다: (현재 행 값보다 작거나 같은 값을 가진 행의 수) / (윈도우 파티션 내 전체 행의 수).

## 구문 {#syntax}

```sql
CUME_DIST()
```

## 반환 값 {#return-value}

0에서 1 사이의 DOUBLE 값을 반환합니다.

## 예제 {#examples}
판매 사원 이름(sales_person), 판매 금액(sales_amount), 판매 날짜(sales_date)를 포함한 판매 데이터가 sales라는 테이블에 있다고 가정하겠습니다. 판매 날짜별로 각 판매 사원의 판매 금액에 대한 누적 백분율을 계산하려고 합니다.

<!-- setup-sql
CREATE TABLE sales (
    id INT,
    sales_person VARCHAR(32),
    sales_date DATE,
    sales_amount INT
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO sales VALUES
    (1, 'Alice', '2024-02-01', 2000),
    (2, 'Bob',   '2024-02-01', 1500),
    (3, 'Alice', '2024-02-02', 1800),
    (4, 'Bob',   '2024-02-02', 1200),
    (5, 'Alice', '2024-02-03', 2200),
    (6, 'Bob',   '2024-02-03', 1900),
    (7, 'Tom',   '2024-02-03', 2000),
    (8, 'Jerry', '2024-02-03', 2000);
-->

```sql
SELECT 
    sales_person,
    sales_date,
    sales_amount,
    CUME_DIST() OVER (PARTITION BY sales_date ORDER BY sales_amount ASC) AS cumulative_sales_percentage
FROM 
    sales;
```

sales 테이블에 다음 데이터가 있다고 가정하겠습니다:
```sql
+------+--------------+------------+--------------+
| id   | sales_person | sales_date | sales_amount |
+------+--------------+------------+--------------+
|    1 | Alice        | 2024-02-01 |         2000 |
|    2 | Bob          | 2024-02-01 |         1500 |
|    3 | Alice        | 2024-02-02 |         1800 |
|    4 | Bob          | 2024-02-02 |         1200 |
|    5 | Alice        | 2024-02-03 |         2200 |
|    6 | Bob          | 2024-02-03 |         1900 |
|    7 | Tom          | 2024-02-03 |         2000 |
|    8 | Jerry        | 2024-02-03 |         2000 |
+------+--------------+------------+--------------+
```

위 SQL 쿼리를 실행하면 판매 날짜별로 각 판매 사원의 판매 금액과 해당 금액의 누적 백분율 순위가 결과에 표시됩니다:

```text
+--------------+------------+--------------+-----------------------------+
| sales_person | sales_date | sales_amount | cumulative_sales_percentage |
+--------------+------------+--------------+-----------------------------+
| Bob          | 2024-02-01 |         1500 |                         0.5 |
| Alice        | 2024-02-01 |         2000 |                           1 |
| Bob          | 2024-02-02 |         1200 |                         0.5 |
| Alice        | 2024-02-02 |         1800 |                           1 |
| Bob          | 2024-02-03 |         1900 |                        0.25 |
| Tom          | 2024-02-03 |         2000 |                        0.75 |
| Jerry        | 2024-02-03 |         2000 |                        0.75 |
| Alice        | 2024-02-03 |         2200 |                           1 |
+--------------+------------+--------------+-----------------------------+
```
이 예제에서 CUME_DIST() 함수는 판매 날짜별로 판매 금액을 정렬한 다음, 해당 날짜에 대한 각 판매 사원의 판매 금액 누적 백분율을 계산합니다. PARTITION BY sales_date를 사용했으므로 계산은 판매 날짜별로 따로 수행되며, 서로 다른 날짜의 판매 사원별 판매 금액은 독립적으로 계산됩니다.
