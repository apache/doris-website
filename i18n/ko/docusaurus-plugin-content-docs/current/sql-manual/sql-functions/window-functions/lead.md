---
{
    "title": "LEAD",
    "language": "ko",
    "description": "LEAD()는 self-join 없이 이후 행의 데이터에 접근하는 데 사용하는 윈도우 함수입니다."
}
---

## 설명 {#description}

LEAD()는 self-join 없이 이후 행의 데이터에 접근하는 데 사용하는 윈도우 함수입니다. 파티션 내에서 현재 행을 기준으로 N번째 뒤에 있는 행의 값을 가져옵니다.

## 구문 {#syntax}

```sql
LEAD ( <expr> [ , <offset> [ , <default> ] ] )
```

## 매개변수 {#parameters}
| 매개변수            | 설명                                                                                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| expr                | 값을 가져올 표현식입니다. 지원되는 타입: tinyint/smallint/int/bigint/float/double/decimal/string/date/datetime/                                                                                                          |
| offset              | 선택 사항이며 bigInt 타입입니다. 이전 방향으로 참조할 행 수입니다. 기본값은 1입니다. |
| default             | 선택 사항이며 타입은 첫 번째 매개변수와 같습니다. offset이 윈도우 범위를 벗어날 때 반환할 기본값입니다. 기본값은 NULL입니다.                                                           |

## 반환 값 {#return-value}

입력 표현식과 동일한 데이터 타입을 반환합니다.

## 예제 {#examples}

<!-- setup-sql
CREATE TABLE stock_ticker (stock_symbol VARCHAR(10), closing_date DATETIME, closing_price DOUBLE) DISTRIBUTED BY HASH(stock_symbol) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO stock_ticker VALUES ('JDR','2014-09-13 00:00:00',12.86),('JDR','2014-09-14 00:00:00',12.89),('JDR','2014-09-15 00:00:00',12.94),('JDR','2014-09-16 00:00:00',12.55),('JDR','2014-09-17 00:00:00',14.03),('JDR','2014-09-18 00:00:00',14.75),('JDR','2014-09-19 00:00:00',13.98);
-->

각 영업 담당자의 현재 매출과 다음 날 매출 간의 차이를 계산합니다:

```sql
select stock_symbol, closing_date, closing_price,    
case   
(lead(closing_price,1, 0)   
over (partition by stock_symbol order by closing_date)-closing_price) > 0   
when true then "higher"   
when false then "flat or lower"    
end as "trending"   
from stock_ticker    
order by closing_date;
```

```text
+--------------+---------------------+---------------+---------------+
| stock_symbol | closing_date        | closing_price | trending      |
| ------------ | ------------------- | ------------- | ------------- |
| JDR          | 2014-09-13 00:00:00 | 12.86         | higher        |
| JDR          | 2014-09-14 00:00:00 | 12.89         | higher        |
| JDR          | 2014-09-15 00:00:00 | 12.94         | flat or lower |
| JDR          | 2014-09-16 00:00:00 | 12.55         | higher        |
| JDR          | 2014-09-17 00:00:00 | 14.03         | higher        |
| JDR          | 2014-09-18 00:00:00 | 14.75         | flat or lower |
| JDR          | 2014-09-19 00:00:00 | 13.98         | flat or lower |
+--------------+---------------------+---------------+---------------+
```
