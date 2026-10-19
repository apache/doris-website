---
{
    "title": "개요",
    "language": "ko",
    "description": "윈도우 함수(분석 함수라고도 함)는 원래 행을 유지하면서 계산을 수행하는 특수한 내장 함수입니다."
}
---

## 설명 {#description}

[윈도우 함수](../../../query-data/window-function)(분석 함수라고도 함)는 원래 행을 유지하면서 계산을 수행하는 특수한 내장 함수입니다. 집계 함수와 달리 윈도우 함수는 다음과 같은 특징이 있습니다:

- GROUP BY로 그룹화하는 대신 특정 윈도우 범위 내에서 데이터를 처리합니다
- 결과 집합의 각 행에 대해 값을 계산합니다
- SELECT 목록에 열을 추가할 수 있습니다
- 쿼리 처리의 마지막 단계에서 실행됩니다(JOIN, WHERE, GROUP BY 이후)

윈도우 함수는 금융 및 과학 계산 분야에서 추세 분석, 이상치 계산, 데이터 버킷화에 흔히 사용됩니다.

## 구문 {#syntax}

```sql
<FUNCTION> ( [ <ARGUMENTS> ] ) OVER ( [ <windowDefinition> ] )
```

각 요소의 정의는 다음과 같습니다:
```sql
windowDefinition ::=

[ PARTITION BY <expr1> [, ...] ]
[ ORDER BY <expr2> [ ASC | DESC ] [ NULLS { FIRST | LAST } ] [, ...] ]
[ <windowFrameClause> ]
```

또한:
```sql
windowFrameClause ::=
{
  | { ROWS } <n> PRECEDING
  | { ROWS } CURRENT ROW
  | { ROWS } BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING
  | { ROWS | RANGE } UNBOUNDED PRECEDING
  | { ROWS | RANGE } BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  | { ROWS | RANGE } BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  | { ROWS } BETWEEN <n> { PRECEDING | FOLLOWING } AND <n> { PRECEDING | FOLLOWING }
  | { ROWS } BETWEEN UNBOUNDED PRECEDING AND <n> { PRECEDING | FOLLOWING }
  | { ROWS } BETWEEN <n> { PRECEDING | FOLLOWING } AND UNBOUNDED FOLLOWING
}
```

## 매개변수 {#parameters}

`<FUNCTION>`
> 윈도우 함수의 이름입니다. 모든 집계 함수와 함께 다음과 같은 특수 윈도우 함수가 포함됩니다: DENSE_RANK(), FIRST_VALUE(), LAG(), LAST_VALUE(), LEAD(), RANK(), ROW_NUMBER(), NTH_VALUE(), PERCENT_RANK(), CUME_DIST(), NTILE().

`<ARGUMENTS>`
> 선택 사항입니다. 윈도우 함수의 입력 인수입니다. 인수의 타입과 개수는 사용하는 함수에 따라 달라집니다.

`<PARTITION_BY>`
> 선택 사항입니다. GROUP BY와 유사하게 지정한 열을 기준으로 데이터를 그룹화한 다음 각 파티션 내에서 계산을 수행합니다.

`<ORDER_BY>`
> 선택 사항입니다. 각 파티션 내의 데이터를 정렬하는 데 사용됩니다. 파티션을 지정하지 않으면 전체 데이터셋을 정렬합니다. 다만 이 `ORDER BY`는 SQL 문 끝에 오는 일반적인 `ORDER BY`와 다릅니다. `OVER` 절에서 지정한 정렬은 해당 파티션 내의 데이터에만 적용되며, SQL 문 끝의 `ORDER BY`는 최종 쿼리 결과에 있는 모든 행의 순서를 제어합니다. 이 둘은 함께 사용할 수 있습니다.
> 또한 `ORDER BY`를 `OVER` 절에 명시하지 않으면 파티션 내 데이터의 순서가 임의로 정해져 최종 결과를 예측하기 어려울 수 있습니다. 정렬할 열을 명시하더라도 해당 열에 중복 값이 있으면 결과가 여전히 불안정할 수 있습니다. 구체적인 예시는 아래 [사례](#section1)를 참조하세요.

`<windowFrameClause>`
> 선택 사항입니다. 윈도우 프레임을 정의하는 데 사용됩니다. 현재 `RANGE`와 `ROWS`의 두 가지 타입을 지원합니다.
> `N PRECEDING/FOLLOWING`에서 `N`은 양의 정수이며, 현재 행을 기준으로 한 슬라이딩 윈도우 범위를 나타냅니다. 현재 이 구문은 `ROWS` 윈도우에서만 지원되므로 현재 행을 기준으로 한 물리적 오프셋을 나타냅니다. `RANGE` 타입에는 현재 몇 가지 제한이 있습니다. 반드시 `BOTH UNBOUNDED BOUNDARY` 또는 `ONE UNBOUNDED BOUNDARY AND ONE CURRENT ROW`여야 합니다. 프레임을 지정하지 않으면 기본적으로 적용되는 암시적 프레임은 `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`입니다.

## 반환 값 {#return-value}

입력 표현식과 동일한 데이터 타입을 반환합니다.

<a id="section1"></a>
## 분석 함수 데이터의 고유한 정렬 순서 {#unique-ordering-for-analytic-function-data}

**1. 반환 결과가 일관되지 않는 문제**

윈도우 함수의 `ORDER BY` 절이 데이터의 정렬 순서를 유일하게 결정하지 못하면 행의 순서가 불확정적이 됩니다. 예를 들어 `ORDER BY` 표현식의 결과에 중복 값이 있는 경우가 이에 해당합니다. 이때 쿼리를 여러 번 실행하면 해당 행들이 반환되는 순서가 달라질 수 있으므로 윈도우 함수의 결과가 일관되지 않을 수 있습니다.

다음 예시는 쿼리를 연속해서 실행할 때 서로 다른 결과가 반환되는 상황을 보여 줍니다. 이러한 불일치는 주로 `ORDER BY date_time`이 `SUM` 윈도우 함수의 정렬 순서를 유일하게 결정하지 못하기 때문에 발생합니다.

```sql
CREATE TABLE test_window_order 
    (item_id int,
    date_time date,
    sales double)
distributed BY hash(item_id)
properties("replication_num" = 1);

INSERT INTO test_window_order VALUES
(1, '2024-07-01', 100),
(2, '2024-07-01', 100),
(3, '2024-07-01', 140);

SELECT
    item_id, date_time, sales,
    sum(sales) OVER (ORDER BY date_time ROWS BETWEEN 
        UNBOUNDED PRECEDING AND CURRENT ROW) sum
FROM
    test_window_order;
```

정렬 열인 `date_time`에 중복 값이 있으므로 다음 두 가지 쿼리 결과가 나타날 수 있습니다:

```sql
+---------+------------+-------+------+
| item_id | date_time  | sales | sum  |
+---------+------------+-------+------+
|       1 | 2024-07-01 |   100 |  100 |
|       3 | 2024-07-01 |   140 |  240 |
|       2 | 2024-07-01 |   100 |  340 |
+---------+------------+-------+------+
3 rows in set (0.03 sec)
```

**2. 해결 방법**

이 문제를 해결하려면 `item_id`처럼 값이 고유한 열을 `ORDER BY` 절에 추가하여 정렬 순서가 유일하게 결정되도록 할 수 있습니다.

```sql
SELECT
        item_id,
        date_time,
        sales,
        sum(sales) OVER (
        ORDER BY item_id,
        date_time ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) sum
FROM
        test_window_order;
```

이렇게 하면 쿼리 결과가 일관되게 반환됩니다:

```sql
+---------+------------+-------+------+
| item_id | date_time  | sales | sum  |
+---------+------------+-------+------+
|       1 | 2024-07-01 |   100 |  100 |
|       2 | 2024-07-01 |   100 |  200 |
|       3 | 2024-07-01 |   140 |  340 |
+---------+------------+-------+------+
3 rows in set (0.03 sec)
```
