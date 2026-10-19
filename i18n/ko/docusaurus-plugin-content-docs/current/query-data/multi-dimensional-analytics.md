---
{
    "title": "다차원 집계 분석",
    "language": "ko",
    "description": "ROLLUP, CUBE, GROUPING SETS를 사용해 하나의 SQL 문으로 다차원 집계 분석을 수행하려면 어떻게 해야 할까요? 이 문서에서는 구문과 예제를 소개하고 각각에 적합한 사용 시나리오를 비교합니다.",
    "keywords": [
        "ROLLUP",
        "CUBE",
        "GROUPING SETS",
        "GROUPING 함수",
        "GROUPING_ID",
        "다차원 집계",
        "GROUP BY 확장",
        "소계 및 총계",
        "계층별 요약"
    ]
}
---

<!-- Knowledge type: Feature description + SQL syntax -->
<!-- Applicable scenario: Multi-dimensional reports, hierarchical summarization, cross-dimensional analysis -->

매출 보고서나 운영 분석, 시장 조사에서는 "세부 차원별 소계", "서로 다른 차원 조합의 합계", "총계"를 모두 반환하는 단일 쿼리가 필요한 경우가 많습니다. 여러 `GROUP BY` 쿼리를 `UNION ALL`로 연결하면 SQL이 길어질 뿐 아니라 기본 테이블을 여러 번 스캔하므로 비효율적입니다.

Doris는 다차원 집계를 위해 `GROUP BY` 절을 확장하는 세 가지 구문을 제공합니다. 이 구문들은 하나의 SQL 문으로 여러 수준의 요약 결과를 생성하며, 의미상 `UNION ALL`로 여러 집계 쿼리를 연결하는 것과 동일합니다.

| 구문 | 적용 시나리오 | 출력되는 요약 조합 |
| --- | --- | --- |
| **ROLLUP** | 시간, 지역, 범주처럼 자연스러운 계층 구조가 있는 차원을 따라 단계별로 집계 | 지정한 컬럼 순서에 따라 가장 세분화된 수준부터 총계까지 순차적으로 집계 |
| **CUBE** | 서로 독립적인 여러 차원에 대해 모든 차원 조합을 분석 | 모든 차원 부분집합의 모든 조합 |
| **GROUPING SETS** | 일부 특정 차원 조합만 필요하여 전체 CUBE 계산 비용을 피하려는 경우 | 사용자가 명시적으로 지정한 그룹 집합 |

이 문서에서는 "시나리오 -> 구문 -> 예제" 순서로 세 가지 구문을 소개하고, 함께 사용하는 `GROUPING` 및 `GROUPING_ID` 함수로 소계 행을 식별하고 두 종류의 NULL 값을 구분하는 방법을 설명합니다.

## ROLLUP: 계층에 따른 단계별 요약 {#rollup-hierarchical-level-by-level-summary}

<!-- Knowledge type: SQL syntax -->
<!-- Applicable scenario: Dimensions with hierarchical relationships, such as time, geography, or category -->

### 적용 시나리오 {#applicable-scenario}

`ROLLUP`은 계층 구조가 있는 차원을 단계별로 집계할 때 적합합니다. 지정한 컬럼 순서를 따라 가장 세분화된 수준부터 최상위 수준까지 데이터를 순차적으로 요약합니다. 예를 들면 다음과 같습니다.

- 시간 차원: `ROLLUP(year, month, day)`
- 지역 차원: `ROLLUP(country, province, city)`

매출 데이터에 `ROLLUP`을 사용하면 지역과 시간을 기준으로 집계하여 각 지역의 월별 매출, 각 지역의 총매출, 전체 총매출을 구할 수 있습니다.

### 구문 {#syntax}

```sql
SELECT … GROUP BY ROLLUP(grouping_column_reference_list)
```

### 예제 {#example}

다음 쿼리는 연도 및 월별 매출을 분석합니다.

```sql
SELECT
        YEAR(d_date),
        MONTH(d_date),
        SUM(ss_net_paid) AS total_sum
FROM
        store_sales,
        date_dim d1
WHERE
        d1.d_date_sk = ss_sold_date_sk
        AND YEAR(d_date) IN (2001, 2002)
        AND MONTH(d_date) IN (1, 2, 3)
GROUP BY
        ROLLUP(YEAR(d_date), MONTH(d_date))
ORDER BY
        YEAR(d_date), MONTH(d_date);
```

이 쿼리는 시간 계층을 따라 단계별로 집계하여 각 연도의 월별 매출 소계, 각 연도의 연간 매출 소계, 전체 매출 총계를 계산합니다. 쿼리 결과는 다음과 같습니다.

```sql
+--------------+---------------+-------------+
| YEAR(d_date) | MONTH(d_date) | total_sum   |
+--------------+---------------+-------------+
|         NULL |          NULL | 54262669.17 |
|         2001 |          NULL | 26640320.46 |
|         2001 |             1 |  9982165.83 |
|         2001 |             2 |  8454915.34 |
|         2001 |             3 |  8203239.29 |
|         2002 |          NULL | 27622348.71 |
|         2002 |             1 | 11260654.35 |
|         2002 |             2 |  7722750.61 |
|         2002 |             3 |  8638943.75 |
+--------------+---------------+-------------+
9 rows in set (0.08 sec)
```

## CUBE: 모든 차원 조합 요약 {#cube-full-cross-dimensional-summary}

<!-- Knowledge type: SQL syntax -->
<!-- Applicable scenario: Comprehensive multi-dimensional analysis across multiple independent dimensions -->

### 적용 시나리오 {#applicable-scenario-1}

`CUBE`는 단일 차원의 서로 다른 계층을 나타내는 컬럼보다 서로 독립적인 여러 차원 컬럼을 사용하는 쿼리에 가장 적합합니다. 대표적인 사용 사례는 월, 지역, 제품의 모든 조합을 요약하는 것입니다. 이들은 서로 독립적인 세 가지 차원이며, 가능한 모든 소계 조합을 분석하는 경우가 매우 많습니다.

반면 연도, 월, 일을 교차 집계하면 시간 차원 자체에 자연스러운 계층 구조가 있으므로 불필요한 값이 많이 생성됩니다. 대부분의 분석에서는 "월-일별 이익"과 같은 소계가 필요하지 않으며, "일 년 동안 매월 16일의 총매출은 얼마인가"를 묻는 사용자도 비교적 드뭅니다. 이와 같은 계층형 차원은 `ROLLUP`으로 처리하는 것이 더 적합합니다.

### 구문 {#syntax-1}

```sql
SELECT … GROUP BY CUBE(grouping_column_reference_list)
```

### 예제 {#example-1}

```sql
SELECT
        YEAR(d_date),
        i_category,
        ca_state,
        SUM(ss_net_paid) AS total_sum
FROM
        store_sales,
        date_dim d1,
        item,
        customer_address ca
WHERE
        d1.d_date_sk = ss_sold_date_sk
        AND i_item_sk = ss_item_sk
        AND ss_addr_sk = ca_address_sk
        AND i_category IN ("Books", "Electronics")
        AND YEAR(d_date) IN (1998, 1999)
        AND ca_state IN ("LA", "AK")
GROUP BY CUBE(YEAR(d_date), i_category, ca_state)
ORDER BY YEAR(d_date), i_category, ca_state;
```

이 쿼리의 결과에는 다음 집계가 포함됩니다.

- 전체 매출 총계.
- 연도별 매출 소계, 범주별 상품 매출 소계, 주별 매출 소계.
- 각 연도의 범주별 매출 소계, 각 주의 제품별 매출 소계, 각 연도의 주별 매출 소계, 각 연도 및 주의 범주별 제품 매출 소계.

```sql
+--------------+-------------+----------+------------+
| YEAR(d_date) | i_category  | ca_state | total_sum  |
+--------------+-------------+----------+------------+
|         NULL | NULL        | NULL     | 8690374.60 |
|         NULL | NULL        | AK       | 2675198.33 |
|         NULL | NULL        | LA       | 6015176.27 |
|         NULL | Books       | NULL     | 4238177.69 |
|         NULL | Books       | AK       | 1310791.36 |
|         NULL | Books       | LA       | 2927386.33 |
|         NULL | Electronics | NULL     | 4452196.91 |
|         NULL | Electronics | AK       | 1364406.97 |
|         NULL | Electronics | LA       | 3087789.94 |
|         1998 | NULL        | NULL     | 4369656.14 |
|         1998 | NULL        | AK       | 1402539.19 |
|         1998 | NULL        | LA       | 2967116.95 |
|         1998 | Books       | NULL     | 2213703.82 |
|         1998 | Books       | AK       |  719911.29 |
|         1998 | Books       | LA       | 1493792.53 |
|         1998 | Electronics | NULL     | 2155952.32 |
|         1998 | Electronics | AK       |  682627.90 |
|         1998 | Electronics | LA       | 1473324.42 |
|         1999 | NULL        | NULL     | 4320718.46 |
|         1999 | NULL        | AK       | 1272659.14 |
|         1999 | NULL        | LA       | 3048059.32 |
|         1999 | Books       | NULL     | 2024473.87 |
|         1999 | Books       | AK       |  590880.07 |
|         1999 | Books       | LA       | 1433593.80 |
|         1999 | Electronics | NULL     | 2296244.59 |
|         1999 | Electronics | AK       |  681779.07 |
|         1999 | Electronics | LA       | 1614465.52 |
+--------------+-------------+----------+------------+
27 rows in set (0.21 sec)
```

## GROUPING 함수: 소계 행 식별 {#grouping-function-identifying-subtotal-rows}

<!-- Knowledge type: SQL function -->
<!-- Applicable scenario: Distinguish subtotal rows from real NULLs and filter results by aggregation level -->

`ROLLUP`과 `CUBE`를 사용할 때는 결과 집합에서 다음 두 가지 문제를 해결해야 합니다.

1. **소계 행을 식별하는 방법**: 결과 행 중 소계를 나타내는 행을 프로그래밍 방식으로 감지하고, 해당 소계가 어느 집계 수준에 해당하는지 정확히 파악해야 합니다. 이는 "총계 대비 비율"을 계산하는 등의 시나리오에서 매우 흔히 필요합니다.
2. **두 종류의 NULL을 구분하는 방법**: 쿼리 결과에 테이블에 실제로 저장된 NULL 값과 `ROLLUP` 또는 `CUBE` 연산으로 생성된 NULL 값이 함께 포함되어 있다면, 둘을 구분할 방법이 필요합니다.

`GROUPING` 및 `GROUPING_ID` 함수는 `GROUPING SETS`와 함께 사용하여 이러한 문제를 효과적으로 해결합니다.

### GROUPING {#grouping}

#### 원리 {#principle}

`GROUPING`은 단일 컬럼을 인수로 받습니다.

- `1`: 값이 `ROLLUP` 또는 `CUBE` 연산으로 생성된 NULL인 경우에 반환합니다(즉, 해당 행이 소계 행인 경우).
- `0`: 테이블에 원래 존재하는 NULL 값을 포함한 그 밖의 모든 값에 대해 반환합니다.

예제:

```sql
SELECT
        year(d_date),
        month(d_date),
        sum(ss_net_paid) AS total_sum,
        grouping(year(d_date)),
        grouping(month(d_date))
FROM
        store_sales,
        date_dim d1
WHERE
        d1.d_date_sk = ss_sold_date_sk
        AND year(d_date) IN (2001, 2002)
        AND month(d_date) IN (1, 2, 3)
GROUP BY
        ROLLUP(year(d_date), month(d_date))
ORDER BY
        year(d_date), month(d_date);
```

집계 수준별 `GROUPING` 함수의 값은 다음과 같습니다.

- `(year(d_date), month(d_date))` 그룹: 결과는 `(0, 0)`이며, 연도 및 월별로 집계한 상세 행입니다.
- `(year(d_date))` 그룹: 결과는 `(0, 1)`이며, 연도별로 집계한 소계 행입니다.
- `()` 그룹: 결과는 `(1, 1)`이며, 총계 행입니다.

쿼리 결과는 다음과 같습니다.

```sql
+--------------+---------------+-------------+------------------------+-------------------------+
| year(d_date) | month(d_date) | total_sum   | Grouping(year(d_date)) | Grouping(month(d_date)) |
+--------------+---------------+-------------+------------------------+-------------------------+
|         NULL |          NULL | 54262669.17 |                      1 |                       1 |
|         2001 |          NULL | 26640320.46 |                      0 |                       1 |
|         2001 |             1 |  9982165.83 |                      0 |                       0 |
|         2001 |             2 |  8454915.34 |                      0 |                       0 |
|         2001 |             3 |  8203239.29 |                      0 |                       0 |
|         2002 |          NULL | 27622348.71 |                      0 |                       1 |
|         2002 |             1 | 11260654.35 |                      0 |                       0 |
|         2002 |             2 |  7722750.61 |                      0 |                       0 |
|         2002 |             3 |  8638943.75 |                      0 |                       0 |
+--------------+---------------+-------------+------------------------+-------------------------+
9 rows in set (0.06 sec)
```

#### 사용법 1: HAVING에서 집계 수준 필터링 {#usage-1-filtering-aggregation-levels-in-having}

`GROUPING` 함수로 특정 집계 수준의 결과만 필터링할 수 있습니다. 다음 예제에서는 "전체 매출 총계", "연도별 집계 매출", "주별 집계 매출"만 남깁니다.

```sql
SELECT
        year(d_date),
        i_category,
        ca_state,
        sum(ss_net_paid) AS total_sum
FROM
        store_sales,
        date_dim d1,
        item,
        customer_address ca
WHERE
        d1.d_date_sk = ss_sold_date_sk
        AND i_item_sk = ss_item_sk
        AND ss_addr_sk = ca_address_sk
        AND i_category IN ("Books", "Electronics")
        AND year(d_date) IN (1998, 1999)
        AND ca_state IN ("LA", "AK")
GROUP BY CUBE(year(d_date), i_category, ca_state)
HAVING grouping(year(d_date)) = 1 AND grouping(i_category) = 1 AND grouping(ca_state) = 1
    OR grouping(year(d_date)) = 0 AND grouping(i_category) = 1 AND grouping(ca_state) = 1
    OR grouping(year(d_date)) = 1 AND grouping(i_category) = 1 AND grouping(ca_state) = 0
ORDER BY year(d_date), i_category, ca_state;
```

쿼리 결과는 다음과 같습니다.

```sql
+---------------------+------------+----------+------------+
| year(`d1`.`d_date`) | i_category | ca_state | total_sum  |
+---------------------+------------+----------+------------+
|                NULL | NULL       | NULL     | 8690374.60 |
|                NULL | NULL       | AK       | 2675198.33 |
|                NULL | NULL       | LA       | 6015176.27 |
|                1998 | NULL       | NULL     | 4369656.14 |
|                1999 | NULL       | NULL     | 4320718.46 |
+---------------------+------------+----------+------------+
5 rows in set (0.13 sec)
```

#### 사용법 2: IF와 결합하여 가독성 개선 {#usage-2-combining-with-if-to-improve-readability}

소계 행의 NULL 값을 더 직관적인 문자열로 바꾸면 결과를 읽기 쉬워집니다.

```sql
SELECT
        IF(grouping(year(d_date)) = 1, "Multi-year sum", year(d_date)) AS year,
        IF(grouping(i_category) = 1, "Multi-category sum", i_category) AS category,
        sum(ss_net_paid) AS total_sum
FROM
        store_sales,
        date_dim d1,
        item,
        customer_address ca
WHERE
        d1.d_date_sk = ss_sold_date_sk
        AND i_item_sk = ss_item_sk
        AND ss_addr_sk = ca_address_sk
        AND i_category IN ("Books", "Electronics")
        AND year(d_date) IN (1998, 1999)
        AND ca_state IN ("LA", "AK")
GROUP BY CUBE(year(d_date), i_category)
```

쿼리 결과는 다음과 같습니다.

```sql
+----------------+--------------------+------------+
| year           | category           | total_sum  |
+----------------+--------------------+------------+
| 1998           | Books              | 2213703.82 |
| 1998           | Electronics        | 2155952.32 |
| 1999           | Electronics        | 2296244.59 |
| 1999           | Books              | 2024473.87 |
| 1998           | Multi-category sum | 4369656.14 |
| 1999           | Multi-category sum | 4320718.46 |
| Multi-year sum | Books              | 4238177.69 |
| Multi-year sum | Electronics        | 4452196.91 |
| Multi-year sum | Multi-category sum | 8690374.60 |
+----------------+--------------------+------------+
9 rows in set (0.09 sec)
```

### GROUPING_ID {#grouping_id}

#### 적용 시나리오 {#applicable-scenario-2}

`GROUPING_ID`와 `GROUPING`은 모두 다차원 집계 쿼리(예: `ROLLUP` 및 `CUBE`)를 보조하며, 서로 다른 수준의 집계 결과를 구분하는 데 사용됩니다.

어떤 행의 집계 수준을 `GROUPING`으로 식별하려면 각 `GROUP BY` 컬럼에 대해 함수를 개별적으로 계산해야 하므로 SQL이 길어집니다. 단일 컬럼의 결과만으로는 집계 수준을 구분하기에 충분하지 않기 때문입니다. `GROUPING_ID`는 `GROUPING`보다 더 강력합니다. 여러 컬럼을 인수로 받아, 해당 컬럼 전체의 집계 상태를 이진수의 각 비트로 한 번에 나타내는 정수를 반환합니다.

계산 결과를 테이블이나 구체화된 뷰에 저장할 때 `GROUPING` 함수로 여러 집계 수준을 나타내면 저장 공간을 더 많이 사용합니다. 이 경우에는 `GROUPING_ID`가 더 적합합니다.

`CUBE(a, b)`를 예로 들면, `GROUPING_ID`와 `GROUPING`의 대응 관계는 다음과 같습니다.

| 집계 수준 | 비트 벡터 | GROUPING_ID | GROUPING(a) | GROUPING(b) |
| ----------- | ---------- | ----------- | ----------- | ----------- |
| a, b        | 0 0        | 0           | 0           | 0           |
| a           | 0 1        | 1           | 0           | 1           |
| b           | 1 0        | 2           | 1           | 0           |
| 총계 | 1 1        | 3           | 1           | 1           |

#### 구문 및 예제 {#syntax-and-example}

```sql
SELECT
    year(d_date),
    i_category,
    SUM(ss_net_paid) AS total_sum,
    GROUPING(year(d_date)),
    GROUPING(i_category),
    GROUPING_ID(year(d_date), i_category)
FROM
    store_sales,
    date_dim d1,
    item,
    customer_address ca
WHERE
    d1.d_date_sk = ss_sold_date_sk
    AND i_item_sk = ss_item_sk
    AND ss_addr_sk = ca_address_sk
    AND i_category IN ('Books', 'Electronics')
    AND year(d_date) IN (1998, 1999)
    AND ca_state IN ('LA', 'AK')
GROUP BY CUBE(year(d_date), i_category);
```

쿼리 결과는 다음과 같습니다.

```sql
+--------------+-------------+------------+------------------------+----------------------+---------------------------------------+
| year(d_date) | i_category  | total_sum  | GROUPING(year(d_date)) | GROUPING(i_category) | GROUPING_ID(year(d_date), i_category) |
+--------------+-------------+------------+------------------------+----------------------+---------------------------------------+
| 1998         | Electronics | 2155952.32 | 0                      | 0                    | 0                                     |
| 1998         | Books       | 2213703.82 | 0                      | 0                    | 0                                     |
| 1999         | Electronics | 2296244.59 | 0                      | 0                    | 0                                     |
| 1999         | Books       | 2024473.87 | 0                      | 0                    | 0                                     |
| 1998         | NULL        | 4369656.14 | 0                      | 1                    | 1                                     |
| 1999         | NULL        | 4320718.46 | 0                      | 1                    | 1                                     |
| NULL         | Electronics | 4452196.91 | 1                      | 0                    | 2                                     |
| NULL         | Books       | 4238177.69 | 1                      | 0                    | 2                                     |
| NULL         | NULL        | 8690374.60 | 1                      | 1                    | 3                                     |
+--------------+-------------+------------+------------------------+----------------------+---------------------------------------+
9 rows in set (0.12 sec)
```

## GROUPING SETS: 그룹 조합을 정확하게 지정 {#grouping-sets-specifying-grouping-combinations-precisely}

<!-- Knowledge type: SQL syntax -->
<!-- Applicable scenario: Only a few specific dimension combinations are of interest, avoiding the cost of a full CUBE -->

### 적용 시나리오 {#applicable-scenario-3}

전체 `CUBE`를 계산하는 대신 지정한 몇 가지 그룹 조합만 집계하려면 `GROUPING SETS`를 `GROUP BY` 절에 사용합니다. 여러 차원에서 계산할 조합을 정확하게 지정할 수 있어 불필요한 오버헤드를 피할 수 있습니다.

`CUBE` 쿼리는 일반적으로 더 많은 리소스를 사용하므로, 일부 차원만 필요한 경우에는 `GROUPING SETS`로 실행 효율을 높일 수 있습니다.

### 구문 {#syntax-2}

```sql
SELECT … GROUP BY GROUPING SETS(grouping_column_reference_list)
```

### 예제 {#example-2}

다음과 같은 결과가 필요하다고 가정합니다.

- 각 연도의 제품 범주별 매출 소계
- 각 연도의 주별 매출 소계
- 각 연도 및 주의 제품별 매출 소계

`GROUPING SETS`를 사용하여 이러한 차원 조합을 명시적으로 지정할 수 있습니다.

```sql
SELECT
    YEAR(d_date),
    i_category,
    ca_state,
    SUM(ss_net_paid) AS total_sum
FROM
    store_sales,
    date_dim d1,
    item,
    customer_address ca
WHERE
    d1.d_date_sk = ss_sold_date_sk
    AND i_item_sk = ss_item_sk
    AND ss_addr_sk = ca_address_sk
    AND i_category IN ('Books', 'Electronics')
    AND YEAR(d_date) IN (1998, 1999)
    AND ca_state IN ('LA', 'AK')
GROUP BY GROUPING SETS(
    (YEAR(d_date), i_category),
    (YEAR(d_date), ca_state),
    (YEAR(d_date), ca_state, i_category)
)
ORDER BY YEAR(d_date), i_category, ca_state;
```

쿼리 결과는 다음과 같습니다.

```sql
+--------------+-------------+----------+------------+
| YEAR(d_date) | i_category  | ca_state | total_sum  |
+--------------+-------------+----------+------------+
| 1998         | NULL        | AK       | 1402539.19 |
| 1998         | NULL        | LA       | 2967116.95 |
| 1998         | Books       | NULL     | 2213703.82 |
| 1998         | Books       | AK       |  719911.29 |
| 1998         | Books       | LA       | 1493792.53 |
| 1998         | Electronics | NULL     | 2155952.32 |
| 1998         | Electronics | AK       |  682627.90 |
| 1998         | Electronics | LA       | 1473324.42 |
| 1999         | NULL        | AK       | 1272659.14 |
| 1999         | NULL        | LA       | 3048059.32 |
| 1999         | Books       | NULL     | 2024473.87 |
| 1999         | Books       | AK       |  590880.07 |
| 1999         | Books       | LA       | 1433593.80 |
| 1999         | Electronics | NULL     | 2296244.59 |
| 1999         | Electronics | AK       |  681779.07 |
| 1999         | Electronics | LA       | 1614465.52 |
+--------------+-------------+----------+------------+
16 rows in set (0.11 sec)
```

위 쿼리는 `CUBE`를 실행한 뒤 `grouping_id`로 지정한 집계 조합만 남기는 다음 쿼리와 의미상 동일하며, 불필요한 계산을 피할 수 있습니다.

```sql
SELECT
    SUM(ss_net_paid) AS total_sum,
    YEAR(d_date),
    i_category,
    ca_state
FROM
    store_sales,
    date_dim d1,
    item,
    customer_address ca
WHERE
    d1.d_date_sk = ss_sold_date_sk
    AND i_item_sk = ss_item_sk
    AND ss_addr_sk = ca_address_sk
    AND i_category IN ('Books', 'Electronics')
    AND YEAR(d_date) IN (1998, 1999)
    AND ca_state IN ('LA', 'AK')
GROUP BY CUBE(YEAR(d_date), ca_state, i_category)
HAVING grouping_id(YEAR(d_date), ca_state, i_category) = 0
    OR grouping_id(YEAR(d_date), ca_state, i_category) = 2
    OR grouping_id(YEAR(d_date), ca_state, i_category) = 1;
```

:::info 참고
`CUBE`는 가능한 모든 집계 수준(이 예제에서는 여덟 가지)을 계산하지만, 실제로는 그중 일부만 필요할 수 있습니다.
:::

### 의미적 동등 관계 {#semantic-equivalences}

`GROUPING SETS`는 다차원 집계의 더 기본적인 형태입니다. `ROLLUP`과 `CUBE`는 모두 `GROUPING SETS`로 확장할 수 있습니다.

#### GROUPING SETS와 GROUP BY UNION ALL {#grouping-sets-and-group-by-union-all}

다음은 `GROUPING SETS` 문입니다.

```sql
SELECT k1, k2, SUM(k3) FROM t GROUP BY GROUPING SETS ((k1, k2), (k1), (k2), ());
```

이는 여러 `GROUP BY` 쿼리를 `UNION ALL`로 연결한 다음 쿼리와 동일합니다.

```sql
SELECT k1, k2, SUM(k3) FROM t GROUP BY k1, k2
UNION ALL
SELECT k1, NULL, SUM(k3) FROM t GROUP BY k1
UNION ALL
SELECT NULL, k2, SUM(k3) FROM t GROUP BY k2
UNION ALL
SELECT NULL, NULL, SUM(k3) FROM t;
```

`UNION ALL`로 연결한 쿼리는 더 길고 기본 테이블을 여러 번 스캔하므로 작성과 실행 모두 효율이 떨어집니다.

#### GROUPING SETS와 ROLLUP {#grouping-sets-and-rollup}

`ROLLUP`은 `GROUPING SETS`를 확장한 구문입니다. 예를 들어 다음 쿼리는:

```sql
SELECT a, b, c, SUM(d) FROM tab1 GROUP BY ROLLUP(a, b, c);
```

다음 `GROUPING SETS`와 동일합니다.

```sql
GROUPING SETS (
    (a, b, c),
    (a, b),
    (a),
    ()
);
```

#### GROUPING SETS와 CUBE {#grouping-sets-and-cube}

`CUBE(a, b, c)`는 다음 `GROUPING SETS`와 동일합니다.

```sql
GROUPING SETS (
    (a, b, c),
    (a, b),
    (a, c),
    (a),
    (b, c),
    (b),
    (c),
    ()
);
```

## 부록 {#appendix}

테이블 생성문과 데이터 파일은 [분석 함수(윈도우 함수)](./window-function.md)의 부록을 참조하세요.
