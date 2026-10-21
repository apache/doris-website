---
{
    "title": "시계열 최근접 이웃 매칭을 위한 ASOF JOIN",
    "language": "ko",
    "description": "ASOF JOIN은 시계열 데이터에서 최근접 이웃 매칭을 수행합니다. 왼쪽 테이블의 각 행에 대해 지정된 방향에서 시간상 가장 가까운 오른쪽 테이블의 행을 찾으며, 윈도 함수가 필요하지 않습니다.",
    "keywords": [
        "ASOF JOIN",
        "시계열 JOIN",
        "최근접 이웃 매칭",
        "MATCH_CONDITION",
        "시점 쿼리",
        "Doris 시계열 쿼리",
        "as of join"
    ]
}
---

<!-- Knowledge type: Capability definition + Operational example -->
<!-- Applicable scenarios: Time-series data analysis / Quote-trade matching / Event snapshot alignment -->

시계열 데이터를 분석할 때는 주어진 이벤트와 "시간상 가장 가까운" 레코드를 다른 테이블에서 찾아야 하는 경우가 많습니다. 예를 들면 다음과 같습니다.

- 각 주식 거래가 발생한 시점의 최신 호가를 찾습니다.
- 각 주문을 주문 시점에 적용되던 가격 또는 재고 스냅샷과 매칭합니다.
- 각 이벤트 로그 항목을 이전 또는 다음 상태 변경과 연결합니다.

일반 JOIN으로 이러한 쿼리를 구현하려면 보통 서브쿼리와 윈도 함수(예: `ROW_NUMBER()`)가 필요하므로 SQL이 복잡해지고 실행 비용도 커집니다. **ASOF JOIN**은 이러한 "시계열 최근접 이웃 매칭" 시나리오를 위해 Doris가 제공하는 전용 JOIN 유형으로, 하나의 간결한 문장으로 쿼리를 표현할 수 있습니다.

ASOF JOIN은 datetime 컬럼을 기준으로 매칭합니다. 일반적인 등가 JOIN과 달리 값이 정확히 같을 필요는 없습니다. 대신 왼쪽 테이블의 각 행에 대해 `MATCH_CONDITION`으로 지정한 방향에서 조건을 만족하는 가장 가까운 오른쪽 테이블의 행을 선택합니다.

> 여기서 "가장 가깝다"는 시간 차이의 절댓값이 가장 작다는 뜻이 아닙니다. `MATCH_CONDITION`으로 지정한 방향에서 조건을 만족하는 가장 가까운 행을 뜻합니다.

ASOF JOIN은 두 가지 하위 유형을 제공합니다.

| 유형 | 설명 | 매칭되지 않는 행 처리 |
| --- | --- | --- |
| `ASOF JOIN` / `ASOF LEFT JOIN` | 왼쪽 외부 ASOF JOIN | 오른쪽 컬럼을 NULL로 채움 |
| `ASOF INNER JOIN` | 내부 ASOF JOIN | 결과에서 해당 행을 제외함 |

## 구문 {#syntax}

<!-- Knowledge type: Syntax reference -->

```sql
SELECT <select_list>
FROM <left_table>
ASOF [LEFT | INNER] JOIN <right_table>
    MATCH_CONDITION(<left_datetime_expr> <comparison_operator> <right_datetime_expr>)
    { ON <left_table.col> = <right_table.col> [AND ...]
    | USING (<column_name> [, ...]) }
```

주요 사항:

- `ASOF JOIN`은 `ASOF LEFT JOIN`과 동일합니다. 왼쪽 테이블에서 매칭되지 않는 행은 유지되며, 오른쪽 컬럼은 NULL로 채워집니다.
- `ASOF INNER JOIN`은 왼쪽 테이블에서 매칭되지 않는 행을 제외합니다.
- `<comparison_operator>`는 `>=`, `>`, `<=`, `<` 중 하나여야 합니다.

## 매개변수 {#parameters}

<!-- Knowledge type: Parameter reference -->

| 매개변수 | 필수 여부 | 설명 |
| --- | --- | --- |
| `left_table` | 예 | 왼쪽 테이블(프로브 테이블)입니다. 이 테이블의 모든 행을 평가합니다. |
| `right_table` | 예 | 오른쪽 테이블(빌드 테이블)입니다. 가장 가까운 매칭 행을 찾는 데 사용합니다. |
| `MATCH_CONDITION` | 예 | 최근접 이웃 매칭 규칙을 정의합니다. 양쪽은 각각 해당 테이블의 컬럼을 참조해야 하며, 두 컬럼의 타입은 모두 `DATEV2`, `DATETIMEV2`, `TIMESTAMP_NS` 또는 `TIMESTAMPTZ`여야 합니다. 표현식을 사용할 수 있습니다. 지원하는 연산자는 `>=`, `>`, `<=`, `<`입니다. |
| `ON` / `USING` 절 | 예 | 그룹화 키로 사용할 하나 이상의 등가 키를 정의합니다. 매칭은 같은 그룹 안에서만 수행됩니다. `ON`은 하나 이상의 등가(`=`) 조건과 표현식(예: `SUBSTRING(l.code, 1, 3) = r.prefix`)을 지원합니다. `USING`은 이름이 같은 하나 이상의 컬럼을 지원합니다. |

## 매칭 규칙 {#matching-rules}

<!-- Knowledge type: Behavior rules -->

매칭 방향은 `MATCH_CONDITION`의 비교 연산자에 따라 결정됩니다.

| 연산자 | 매칭 동작 | 일반적인 사용 사례 |
| --- | --- | --- |
| `>=` | 왼쪽 테이블의 각 행에 대해, 오른쪽 테이블에서 왼쪽 값 **이하**인 값 중 **가장 큰** 값을 가진 행을 찾음 | 이벤트 시각과 같거나 그 이전인 최신 스냅샷 또는 호가 찾기 |
| `>` | 왼쪽 테이블의 각 행에 대해, 오른쪽 테이블에서 왼쪽 값**보다 작은** 값 중 **가장 큰** 값을 가진 행을 찾음 | 이벤트 시각보다 엄격히 이전인 최신 스냅샷 또는 호가 찾기 |
| `<=` | 왼쪽 테이블의 각 행에 대해, 오른쪽 테이블에서 왼쪽 값 **이상**인 값 중 **가장 작은** 값을 가진 행을 찾음 | 현재 시각과 같거나 그 이후인 다음 이벤트 또는 스냅샷 찾기 |
| `<` | 왼쪽 테이블의 각 행에 대해, 오른쪽 테이블에서 왼쪽 값**보다 큰** 값 중 **가장 작은** 값을 가진 행을 찾음 | 현재 시각보다 엄격히 이후인 다음 이벤트 또는 스냅샷 찾기 |

다음 규칙에 특히 주의하세요.

1. `MATCH_CONDITION`의 컬럼 타입은 `DATEV2`, `DATETIMEV2`, `TIMESTAMP_NS` 또는 `TIMESTAMPTZ`여야 합니다.
2. `MATCH_CONDITION` 안에서는 표현식을 사용할 수 있습니다. 예를 들어 `MATCH_CONDITION(l.ts >= r.ts + INTERVAL 1 HOUR)` 또는 `MATCH_CONDITION(l.ts >= DATE_ADD(r.ts, INTERVAL 3 HOUR))`를 사용할 수 있습니다.
3. 등가 키 절은 `ON` 또는 `USING`으로 작성할 수 있습니다. `ON`을 사용할 때는 등가(`=`) 조건을 `AND`로 연결하는 것만 허용됩니다. 부등 조건(예: `>`, `OR`)과 리터럴 비교(예: `l.grp = 1`)는 `ON` 절에서 허용되지 않습니다.
4. 매칭 컬럼이나 등가 키 컬럼의 NULL 값은 매칭되지 않습니다. 왼쪽 테이블 행의 매칭 컬럼이 NULL이거나, 같은 그룹에 조건을 만족하는 오른쪽 테이블 행이 없으면 오른쪽 컬럼을 NULL로 채우거나(LEFT JOIN) 해당 행을 제외합니다(INNER JOIN).
5. 오른쪽 테이블의 여러 행이 같은 그룹화 키와 같은 매칭 컬럼 값을 가지며 모두 매칭 조건을 만족하면, 그중 하나를 반환합니다(결과는 비결정적입니다).

4.1.5부터 ASOF JOIN의 `ON` 절에 있는 등가 키에는 일반 `=`만 사용할 수 있으며, NULL 안전 등가 연산자 `<=>`는 허용되지 않습니다. 이 제한은 일반 JOIN에서 `<=>`의 동작에 영향을 주지 않습니다.

## 예제 {#examples}

<!-- Knowledge type: Operational example -->
<!-- Applicable scenarios: Quote-trade matching / Order-price matching / Multi-table time-series alignment -->

아래 예제는 `trades` 테이블과 `quotes` 테이블을 `symbol`로 그룹화하고 시간상 가까운 행끼리 매칭하는 일반적인 시나리오를 다룹니다.

### 데이터 준비 {#data-preparation}

```sql
CREATE TABLE trades (
    trade_id INT,
    symbol VARCHAR(10),
    trade_time DATETIME,
    price DECIMAL(10, 2),
    quantity INT
) DISTRIBUTED BY HASH(trade_id) BUCKETS 3
PROPERTIES("replication_num" = "1");

CREATE TABLE quotes (
    quote_id INT,
    symbol VARCHAR(10),
    quote_time DATETIME,
    bid_price DECIMAL(10, 2),
    ask_price DECIMAL(10, 2)
) DISTRIBUTED BY HASH(quote_id) BUCKETS 3
PROPERTIES("replication_num" = "1");

INSERT INTO trades VALUES
(1, 'AAPL', '2024-01-01 10:00:05', 150.50, 100),
(2, 'AAPL', '2024-01-01 10:00:15', 151.00, 200),
(3, 'AAPL', '2024-01-01 10:00:25', 150.75, 150),
(4, 'GOOG', '2024-01-01 10:00:10', 2800.00, 50),
(5, 'GOOG', '2024-01-01 10:00:20', 2805.00, 75),
(6, 'MSFT', '2024-01-01 10:00:08', 380.00, 120);

INSERT INTO quotes VALUES
(1, 'AAPL', '2024-01-01 10:00:00', 150.00, 150.10),
(2, 'AAPL', '2024-01-01 10:00:10', 150.40, 150.60),
(3, 'AAPL', '2024-01-01 10:00:20', 150.90, 151.10),
(4, 'GOOG', '2024-01-01 10:00:05', 2795.00, 2800.00),
(5, 'GOOG', '2024-01-01 10:00:15', 2802.00, 2808.00),
(6, 'MSFT', '2024-01-01 10:00:00', 378.00, 380.00),
(7, 'MSFT', '2024-01-01 10:00:10', 379.50, 381.00);
```

### 예제 1: 각 거래의 최신 호가 찾기 (>=) {#example-1-find-the-most-recent-quote-for-each-trade-}

시나리오: 각 거래에 대해, 같은 `symbol`에서 `quote_time`이 `trade_time` 이하인 최신 호가를 찾습니다.

```sql
SELECT t.trade_id, t.symbol, t.trade_time, t.price,
       q.quote_id, q.quote_time, q.bid_price, q.ask_price
FROM trades t
ASOF LEFT JOIN quotes q
    MATCH_CONDITION(t.trade_time >= q.quote_time)
    ON t.symbol = q.symbol
ORDER BY t.trade_id;
```

```text
+----------+--------+---------------------+--------+----------+---------------------+-----------+-----------+
| trade_id | symbol | trade_time          | price  | quote_id | quote_time          | bid_price | ask_price |
+----------+--------+---------------------+--------+----------+---------------------+-----------+-----------+
|        1 | AAPL   | 2024-01-01 10:00:05 | 150.50 |        1 | 2024-01-01 10:00:00 |    150.00 |    150.10 |
|        2 | AAPL   | 2024-01-01 10:00:15 | 151.00 |        2 | 2024-01-01 10:00:10 |    150.40 |    150.60 |
|        3 | AAPL   | 2024-01-01 10:00:25 | 150.75 |        3 | 2024-01-01 10:00:20 |    150.90 |    151.10 |
|        4 | GOOG   | 2024-01-01 10:00:10 | 2800.00 |        4 | 2024-01-01 10:00:05 |   2795.00 |   2800.00 |
|        5 | GOOG   | 2024-01-01 10:00:20 | 2805.00 |        5 | 2024-01-01 10:00:15 |   2802.00 |   2808.00 |
|        6 | MSFT   | 2024-01-01 10:00:08 | 380.00 |        6 | 2024-01-01 10:00:00 |    378.00 |    380.00 |
+----------+--------+---------------------+--------+----------+---------------------+-----------+-----------+
```

예를 들어 거래 #1 (AAPL, 10:00:05)은 호가 #1 (AAPL, 10:00:00)과 매칭됩니다. 이 호가가 같은 `symbol`에서 거래 시각과 같거나 그 이전인 가장 최신 호가이기 때문입니다.

### 예제 2: 각 거래 이후의 다음 호가 찾기 (<=) {#example-2-find-the-next-quote-after-each-trade-}

시나리오: 매칭 방향을 반대로 바꾸어 각 거래 이후에 발생하는 다음 호가를 찾습니다.

```sql
SELECT t.trade_id, t.symbol, t.trade_time, t.price,
       q.quote_id, q.quote_time, q.bid_price
FROM trades t
ASOF LEFT JOIN quotes q
    MATCH_CONDITION(t.trade_time <= q.quote_time)
    ON t.symbol = q.symbol
ORDER BY t.trade_id;
```

```text
+----------+--------+---------------------+--------+----------+---------------------+-----------+
| trade_id | symbol | trade_time          | price  | quote_id | quote_time          | bid_price |
+----------+--------+---------------------+--------+----------+---------------------+-----------+
|        1 | AAPL   | 2024-01-01 10:00:05 | 150.50 |        2 | 2024-01-01 10:00:10 |    150.40 |
|        2 | AAPL   | 2024-01-01 10:00:15 | 151.00 |        3 | 2024-01-01 10:00:20 |    150.90 |
|        3 | AAPL   | 2024-01-01 10:00:25 | 150.75 |     NULL | NULL                |      NULL |
|        4 | GOOG   | 2024-01-01 10:00:10 | 2800.00 |        5 | 2024-01-01 10:00:15 |   2802.00 |
|        5 | GOOG   | 2024-01-01 10:00:20 | 2805.00 |     NULL | NULL                |      NULL |
|        6 | MSFT   | 2024-01-01 10:00:08 | 380.00 |        7 | 2024-01-01 10:00:10 |    379.50 |
+----------+--------+---------------------+--------+----------+---------------------+-----------+
```

거래 #3 (AAPL, 10:00:25) 이후에는 호가 데이터가 없으므로 오른쪽 컬럼은 NULL을 반환합니다.

### 예제 3: INNER JOIN으로 매칭되지 않는 행 제외하기 {#example-3-use-inner-join-to-exclude-unmatched-rows}

시나리오: 매칭되는 거래만 필요하며, NULL 행이 후속 처리로 전달되지 않아야 합니다.

```sql
SELECT t.trade_id, t.symbol, t.trade_time, t.price,
       q.quote_id, q.quote_time, q.bid_price
FROM trades t
ASOF INNER JOIN quotes q
    MATCH_CONDITION(t.trade_time >= q.quote_time)
    ON t.symbol = q.symbol
ORDER BY t.trade_id;
```

```text
+----------+--------+---------------------+--------+----------+---------------------+-----------+
| trade_id | symbol | trade_time          | price  | quote_id | quote_time          | bid_price |
+----------+--------+---------------------+--------+----------+---------------------+-----------+
|        1 | AAPL   | 2024-01-01 10:00:05 | 150.50 |        1 | 2024-01-01 10:00:00 |    150.00 |
|        2 | AAPL   | 2024-01-01 10:00:15 | 151.00 |        2 | 2024-01-01 10:00:10 |    150.40 |
|        3 | AAPL   | 2024-01-01 10:00:25 | 150.75 |        3 | 2024-01-01 10:00:20 |    150.90 |
|        4 | GOOG   | 2024-01-01 10:00:10 | 2800.00 |        4 | 2024-01-01 10:00:05 |   2795.00 |
|        5 | GOOG   | 2024-01-01 10:00:20 | 2805.00 |        5 | 2024-01-01 10:00:15 |   2802.00 |
|        6 | MSFT   | 2024-01-01 10:00:08 | 380.00 |        6 | 2024-01-01 10:00:00 |    378.00 |
+----------+--------+---------------------+--------+----------+---------------------+-----------+
```

이 데이터셋에서는 모든 거래에 매칭되는 호가가 있으므로 결과가 예제 1과 같습니다. 매칭되는 호가가 없는 거래가 있다면 해당 행은 제외됩니다.

### 예제 4: 여러 등가 조건으로 그룹화하기 {#example-4-group-by-multiple-equality-conditions}

시나리오: `product_id`와 `region`을 모두 기준으로 그룹별 매칭을 수행하고, 각 주문에 대해 같은 상품 및 지역에서 가장 최근에 적용된 가격을 찾습니다.

```sql
SELECT o.order_id, o.product_id, o.region, o.order_time,
       p.price, p.effective_time
FROM orders o
ASOF LEFT JOIN prices p
    MATCH_CONDITION(o.order_time >= p.effective_time)
    ON o.product_id = p.product_id AND o.region = p.region
ORDER BY o.order_id;
```

### 예제 5: MATCH_CONDITION에서 표현식 사용하기 {#example-5-use-expressions-in-match_condition}

시나리오: 오른쪽 타임스탬프가 왼쪽 타임스탬프보다 적어도 1시간 이전인 경우에만 매칭을 허용합니다.

```sql
SELECT l.id, l.ts, r.id AS rid, r.ts AS rts, r.data
FROM left_table l
ASOF LEFT JOIN right_table r
    MATCH_CONDITION(l.ts >= r.ts + INTERVAL 1 HOUR)
    ON l.grp = r.grp
ORDER BY l.id;
```

날짜 및 시간 함수도 지원합니다.

```sql
MATCH_CONDITION(l.ts >= DATE_ADD(r.ts, INTERVAL 3 HOUR))
MATCH_CONDITION(DATE_SUB(l.ts, INTERVAL 1 HOUR) >= r.ts)
```

### 예제 6: 다단계 ASOF JOIN {#example-6-multi-level-asof-join}

ASOF JOIN은 다른 ASOF JOIN 또는 일반 JOIN과 연속해서 연결할 수 있습니다.

각 주문을 해당 시점의 적용 가격 및 재고 스냅샷과 연결합니다.

```sql
SELECT o.order_id, o.order_time,
       p.price, p.effective_time AS price_time,
       i.stock_level, i.snapshot_time AS inv_time
FROM orders o
ASOF LEFT JOIN prices p
    MATCH_CONDITION(o.order_time >= p.effective_time)
    ON o.product_id = p.product_id AND o.region = p.region
ASOF LEFT JOIN inventory i
    MATCH_CONDITION(o.order_time >= i.snapshot_time)
    ON o.product_id = i.product_id AND o.region = i.region
ORDER BY o.order_id;
```

ASOF JOIN은 일반 JOIN과 함께 사용할 수도 있습니다.

```sql
SELECT o.order_id, prod.product_name,
       o.order_time, p.price
FROM orders o
INNER JOIN products prod ON o.product_id = prod.product_id
ASOF LEFT JOIN prices p
    MATCH_CONDITION(o.order_time >= p.effective_time)
    ON o.product_id = p.product_id AND o.region = p.region
ORDER BY o.order_id;
```

### 예제 7: ASOF JOIN과 집계 함께 사용하기 {#example-7-asof-join-with-aggregation}

시나리오: `symbol`별 거래 수를 세고, 매칭된 호가의 매수 가격 평균을 계산합니다.

```sql
SELECT t.symbol,
       COUNT(*) AS trade_count,
       AVG(q.bid_price) AS avg_bid
FROM trades t
ASOF LEFT JOIN quotes q
    MATCH_CONDITION(t.trade_time >= q.quote_time)
    ON t.symbol = q.symbol
GROUP BY t.symbol
ORDER BY t.symbol;
```

### 예제 8: 양방향 매칭으로 이전 및 이후 레코드 찾기 {#example-8-bidirectional-matching-to-find-records-before-and-after}

시나리오: 각 주문에 대해 이전 적용 가격과 다음 적용 가격을 모두 찾습니다.

```sql
SELECT o.order_id, o.order_time,
       p_before.price AS price_before,
       p_before.effective_time AS time_before,
       p_after.price AS price_after,
       p_after.effective_time AS time_after
FROM orders o
ASOF LEFT JOIN prices p_before
    MATCH_CONDITION(o.order_time >= p_before.effective_time)
    ON o.product_id = p_before.product_id AND o.region = p_before.region
ASOF LEFT JOIN prices p_after
    MATCH_CONDITION(o.order_time <= p_after.effective_time)
    ON o.product_id = p_after.product_id AND o.region = p_after.region
ORDER BY o.order_id;
```

### 예제 9: 절대적인 최근접 매칭이 아닌 방향에 따른 매칭 {#example-9-directional-matching-not-absolute-nearest}

ASOF JOIN은 `MATCH_CONDITION`으로 지정한 방향에서만 검색합니다. **왼쪽과 오른쪽 레코드 간 시간 차이의 절댓값은 비교하지 않습니다.**

"이전" 방향으로 검색:

```sql
WITH left_events AS (
    SELECT 1 AS event_id, 'AAPL' AS symbol, CAST('2024-01-01 10:00:06' AS DATETIME) AS event_time
),
right_events AS (
    SELECT 1 AS right_id, 'AAPL' AS symbol, CAST('2024-01-01 10:00:00' AS DATETIME) AS ref_time
    UNION ALL
    SELECT 2 AS right_id, 'AAPL' AS symbol, CAST('2024-01-01 10:00:08' AS DATETIME) AS ref_time
)
SELECT l.event_id, l.event_time, r.right_id, r.ref_time
FROM left_events l
ASOF LEFT JOIN right_events r
    MATCH_CONDITION(l.event_time >= r.ref_time)
    ON l.symbol = r.symbol;
```

```text
+----------+---------------------+----------+---------------------+
| event_id | event_time          | right_id | ref_time            |
+----------+---------------------+----------+---------------------+
|        1 | 2024-01-01 10:00:06 |        1 | 2024-01-01 10:00:00 |
+----------+---------------------+----------+---------------------+
```

`10:00:08`은 왼쪽 시각과 2초 차이밖에 나지 않고 `10:00:00`은 6초 차이가 나지만, `MATCH_CONDITION(l.event_time >= r.ref_time)`은 왼쪽 타임스탬프와 같거나 그 이전인 오른쪽 테이블 레코드만 매칭할 수 있으므로 결과는 `10:00:00`입니다.

"이후" 방향 검색은 반대로 동작합니다.

```sql
WITH left_events AS (
    SELECT 1 AS event_id, 'AAPL' AS symbol, CAST('2024-01-01 10:00:06' AS DATETIME) AS event_time
),
right_events AS (
    SELECT 1 AS right_id, 'AAPL' AS symbol, CAST('2024-01-01 10:00:00' AS DATETIME) AS ref_time
    UNION ALL
    SELECT 2 AS right_id, 'AAPL' AS symbol, CAST('2024-01-01 10:00:08' AS DATETIME) AS ref_time
)
SELECT l.event_id, l.event_time, r.right_id, r.ref_time
FROM left_events l
ASOF LEFT JOIN right_events r
    MATCH_CONDITION(l.event_time <= r.ref_time)
    ON l.symbol = r.symbol;
```

```text
+----------+---------------------+----------+---------------------+
| event_id | event_time          | right_id | ref_time            |
+----------+---------------------+----------+---------------------+
|        1 | 2024-01-01 10:00:06 |        2 | 2024-01-01 10:00:08 |
+----------+---------------------+----------+---------------------+
```

### 예제 10: 중복 매칭 값으로 인한 비결정적 결과 {#example-10-duplicate-matching-values-lead-to-non-deterministic-results}

오른쪽 테이블의 여러 행이 같은 그룹화 키와 같은 매칭 값을 가지면 ASOF JOIN은 그중 어떤 행이든 반환할 수 있습니다. 이는 `TIMESTAMPTZ` 타입에도 적용됩니다.

```sql
WITH left_events AS (
    SELECT 1 AS event_id, 'AAPL' AS symbol,
           CAST('2024-01-01 10:00:05 +00:00' AS TIMESTAMPTZ) AS event_time
),
right_events AS (
    SELECT 1 AS right_id, 'AAPL' AS symbol,
           CAST('2024-01-01 10:00:00 +00:00' AS TIMESTAMPTZ) AS ref_time, 'snapshot_a' AS tag
    UNION ALL
    SELECT 2 AS right_id, 'AAPL' AS symbol,
           CAST('2024-01-01 10:00:00 +00:00' AS TIMESTAMPTZ) AS ref_time, 'snapshot_b' AS tag
)
SELECT l.event_id, r.right_id, r.ref_time, r.tag
FROM left_events l
ASOF LEFT JOIN right_events r
    MATCH_CONDITION(l.event_time >= r.ref_time)
    ON l.symbol = r.symbol;
```

```text
+----------+----------+---------------------------+------------+
| event_id | right_id | ref_time                  | tag        |
+----------+----------+---------------------------+------------+
|        1 |        1 | 2024-01-01 10:00:00+00:00 | snapshot_a |
+----------+----------+---------------------------+------------+
```

쿼리는 `right_id = 2`이고 `tag = snapshot_b`인 행을 반환할 수도 있습니다. 비즈니스 로직에서 결정적 결과가 필요하다면 ASOF JOIN을 수행하기 전에 오른쪽 테이블의 중복을 제거하거나 사전 집계하세요.

## 윈도 함수를 사용한 동등한 쿼리로 재작성 {#equivalent-rewrite-using-window-functions}

<!-- Knowledge type: Comparison -->

ASOF JOIN은 의미상 다음 `LEFT JOIN` + `ROW_NUMBER()` 패턴과 동일하지만, 실행 성능은 훨씬 더 좋습니다.

```sql
-- Equivalent to: ASOF LEFT JOIN ... MATCH_CONDITION(l.ts >= r.ts)
SELECT id, rid, val FROM (
    SELECT l.id, r.id AS rid, r.val,
           ROW_NUMBER() OVER (PARTITION BY l.id ORDER BY r.ts DESC) AS rn
    FROM left_table l
    LEFT JOIN right_table r
        ON l.grp = r.grp AND l.ts >= r.ts
) t
WHERE rn = 1;
```

## 권장 사항 {#best-practices}

<!-- Knowledge type: Usage recommendations -->

- **시계열 데이터의 시점 쿼리에 우선적으로 사용하세요.** 팩트 테이블의 각 행에 대해 참조 테이블에서 가장 최근의 레코드(또는 가장 가까운 레코드)를 찾아야 할 때 ASOF JOIN이 가장 자연스럽고 효율적인 방법입니다.
- **그룹화에 적합한 등가 키를 추가하세요.** `ON` 또는 `USING` 절에 그룹화 키를 포함하세요. 그룹을 더 정밀하게 나눌수록 검색 범위가 줄어들어 성능이 좋아집니다.
- **적절한 비교 연산자를 선택하세요.** 타임스탬프가 같은 행도 매칭에 포함하려면 `>=`를 사용하고, 타임스탬프가 같은 행을 엄격히 제외하려면 `>`를 사용하세요. 반대 방향에서도 마찬가지입니다.
- **매칭되지 않는 행이 필요하지 않다면 `ASOF INNER JOIN`을 우선적으로 사용하세요.** NULL 행이 생성되지 않으므로 후속 처리가 간단해집니다.
- **결정적 결과가 필요하면 오른쪽 테이블의 중복을 제거하세요.** 오른쪽 테이블에 그룹화 키와 매칭 컬럼 값이 같은 행이 여러 개 있으면 ASOF JOIN은 그중 어떤 행이든 반환할 수 있습니다.
- **시간 오프셋 매칭에는 표현식을 사용하세요.** 예를 들어 `MATCH_CONDITION(l.ts >= r.ts + INTERVAL 1 HOUR)`는 최소 1시간의 간격을 요구합니다.
