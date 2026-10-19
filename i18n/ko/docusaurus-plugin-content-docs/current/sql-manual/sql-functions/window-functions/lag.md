---
{
    "title": "LAG",
    "language": "ko",
    "description": "LAG()는 self-join을 수행하지 않고 이전 행의 데이터에 접근하는 윈도우 함수입니다."
}
---

## 설명 {#description}

LAG()는 self-join을 수행하지 않고 이전 행의 데이터에 접근하는 윈도우 함수입니다. 파티션 내에서 현재 행보다 N행 이전에 있는 행의 값을 가져옵니다.

## 구문 {#syntax}

```sql
LAG ( <expr> [, <offset> [, <default> ] ] )
```

## 매개변수 {#parameters}
| 매개변수           | 설명                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| expr                | 값을 가져올 표현식입니다. 지원되는 타입: tinyint/smallint/int/bigint/float/double/decimal/string/date/datetime/                                                      |
| offset              | 선택 사항이며 Bigint 타입입니다. 앞쪽으로 이동할 행 수입니다. 기본값은 1입니다. |
| default             | 선택 사항이며 타입은 첫 번째 매개변수와 같습니다. 오프셋이 윈도우 범위를 벗어날 때 반환할 값입니다. 기본값은 NULL입니다.               |

## 반환 값 {#return-value}

입력 표현식과 동일한 데이터 타입을 반환합니다.

## 예제 {#examples}

<!-- setup-sql
CREATE TABLE stock_ticker (stock_symbol VARCHAR(10), closing_date DATETIME, closing_price DOUBLE) DISTRIBUTED BY HASH(stock_symbol) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO stock_ticker VALUES ('JDR','2014-09-13 00:00:00',12.86),('JDR','2014-09-14 00:00:00',12.89),('JDR','2014-09-15 00:00:00',12.94),('JDR','2014-09-16 00:00:00',12.55),('JDR','2014-09-17 00:00:00',14.03),('JDR','2014-09-18 00:00:00',14.75),('JDR','2014-09-19 00:00:00',13.98);
-->

각 영업 담당자의 현재 매출액과 전날 매출액의 차이를 계산합니다:

```sql
select stock_symbol, closing_date, closing_price,    
lag(closing_price,1, 0) over (partition by stock_symbol order by closing_date) as "yesterday closing"   
from stock_ticker   
order by closing_date;
```

```text
+--------------+---------------------+---------------+-------------------+
| stock_symbol | closing_date        | closing_price | yesterday closing |
| ------------ | ------------------- | ------------- | ----------------- |
| JDR          | 2014-09-13 00:00:00 | 12.86         | 0                 |
| JDR          | 2014-09-14 00:00:00 | 12.89         | 12.86             |
| JDR          | 2014-09-15 00:00:00 | 12.94         | 12.89             |
| JDR          | 2014-09-16 00:00:00 | 12.55         | 12.94             |
| JDR          | 2014-09-17 00:00:00 | 14.03         | 12.55             |
| JDR          | 2014-09-18 00:00:00 | 14.75         | 14.03             |
| JDR          | 2014-09-19 00:00:00 | 13.98         | 14.75             |
+--------------+---------------------+---------------+-------------------+
```
