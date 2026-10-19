---
{
    "title": "CREATE SYNC MATERIALIZED VIEW",
    "language": "ko",
    "description": "동기식 구체화된 뷰를 생성하는 문입니다."
}
---

## 설명 {#description}

동기식 구체화된 뷰를 생성하는 문입니다.

## 구문 {#syntax}

```sql
CREATE MATERIALIZED VIEW <materialized_view_name> [AS] <query>            
```

여기서 쿼리는 다음과 같이 정의됩니다.

```sql
query
    :
    SELECT <select_expr> select_expr[, select_expr ...]
    FROM <base_table>
    WHERE condition
    GROUP BY <column_name>[, <column_name> ...]
    ORDER BY <column_name>[, <column_name> ...]
```

## 필수 매개변수 {#required-parameters}

**1. `<materialized_view_name>`**

> 구체화된 뷰의 식별자(즉, 이름)를 지정합니다. 동기식 구체화된 뷰는 테이블을 기반으로 생성되므로, 이름은 동일한 테이블 내에서 고유해야 합니다.
>
> 식별자는 문자로 시작해야 합니다(유니코드 이름 지원이 활성화된 경우 모든 언어의 문자를 사용할 수 있습니다). 식별자 문자열 전체를 백틱으로 감싸지 않으면 공백이나 특수 문자를 포함할 수 없습니다(예: `My Object`).
>
> 식별자로 예약 키워드를 사용할 수 없습니다.
>
> 자세한 내용은 식별자 및 예약 키워드에 대한 요구 사항을 참조하세요.

**2. `<query>`**

> 구체화된 뷰를 구성하는 데 사용하는 쿼리문으로, 쿼리 결과가 구체화된 뷰의 데이터가 됩니다. 현재 지원하는 쿼리 형식은 다음과 같습니다.
>
> 구문은 쿼리문 구문과 동일합니다.
>
> - `select_expr`: 구체화된 뷰의 스키마를 구성하는 모든 컬럼입니다.
>   - 단일 컬럼을 하나 이상 포함해야 합니다.
> - `base_table`: 구체화된 뷰의 기본 테이블 이름으로, 필수 항목입니다.
>   - 서브쿼리가 아닌 단일 테이블이어야 합니다.
> - `where`: 구체화된 뷰의 필터 조건으로, 선택 항목입니다.
>   - 지정하지 않으면 데이터를 필터링하지 않습니다.
> - `group by`: 구체화된 뷰의 그룹화 컬럼으로, 선택 항목입니다.
>   - 지정하지 않으면 데이터를 그룹화하지 않습니다.
> - `order by`: 구체화된 뷰의 정렬 컬럼으로, 선택 항목입니다.
>   - 정렬 컬럼의 선언 순서는 `select_expr`에 선언된 컬럼 순서와 일치해야 합니다.
>   - `order by`를 선언하지 않으면 규칙에 따라 정렬 컬럼이 자동으로 추가됩니다. 구체화된 뷰가 집계 유형이면 모든 그룹화 컬럼이 정렬 컬럼으로 자동 추가됩니다. 구체화된 뷰가 비집계 유형이면 처음 36바이트에 해당하는 컬럼이 정렬 컬럼으로 자동 추가됩니다.
>   - 자동으로 추가된 정렬 컬럼 수가 3개 미만이면 처음 세 개의 컬럼을 정렬 컬럼으로 사용합니다. 쿼리에 그룹화 컬럼이 포함되어 있으면 정렬 컬럼은 그룹화 컬럼과 일치해야 합니다.

## 접근 제어 요구 사항 {#access-control-requirements}

| 권한       | 객체   | 설명                                                         |
| ---------- | ------ | ------------------------------------------------------------ |
| ALTER_PRIV | 테이블 | 현재 구체화된 뷰의 기본 테이블에 대한 ALTER_PRIV 권한이 필요합니다 |

## 참고 사항 {#notes}

- 동기식 구체화된 뷰의 SELECT 목록에 있는 컬럼 이름은 기본 테이블의 기존 컬럼 이름과 같아서는 안 되며, 동일한 기본 테이블에 있는 다른 동기식 구체화된 뷰의 컬럼 이름과도 중복되어서는 안 됩니다. 별칭을 지정하여 이름 충돌을 방지할 수 있습니다(예: col as xxx).
- 동기식 구체화된 뷰는 단일 테이블에 대한 SELECT 문만 지원합니다. WHERE, GROUP BY, ORDER BY 절은 지원하지만 JOIN, HAVING, LIMIT 절과 LATERAL VIEW는 지원하지 않습니다.
- SELECT 목록에는 자동 증가 컬럼, 상수, 중복 표현식 또는 윈도우 함수를 포함할 수 없습니다.
- SELECT 목록에 집계 함수가 포함되어 있으면 집계 함수는 루트 표현식이어야 합니다(예: `sum(a + 1)`은 지원하지만 `sum(a) + 1`은 지원하지 않음). 또한 집계 함수 뒤에는 집계 함수가 아닌 다른 표현식이 올 수 없습니다(예: `SELECT x, sum(a)`는 허용되지만 `SELECT sum(a), x`는 허용되지 않음).
- 단일 테이블에 구체화된 뷰가 너무 많으면 데이터 적재 효율에 영향을 줄 수 있습니다. 데이터를 적재할 때 구체화된 뷰와 기본 테이블의 데이터가 동기적으로 업데이트됩니다. 테이블에 구체화된 뷰가 너무 많으면 한 번의 데이터 적재 작업으로 여러 테이블에 동시에 데이터를 적재하는 것과 마찬가지로 적재 속도가 느려질 수 있습니다.
- 구체화된 뷰가 Unique Key 데이터 모델을 대상으로 하는 경우, 컬럼 순서만 변경할 수 있으며 집계는 수행할 수 없습니다. 따라서 Unique Key 모델에서는 구체화된 뷰를 생성하여 데이터를 더 큰 단위로 집계할 수 없습니다.
- 구체화된 뷰가 Unique Key 및 Aggregate Key 데이터 모델을 대상으로 하는 경우, WHERE 절을 지정하면 Key 컬럼만 사용할 수 있고 Value 컬럼은 사용할 수 없습니다.

## 예제 {#example}

사전 준비: 아래 예제에서는 표준 TPC-H `lineitem` 기본 테이블을 사용합니다.

```sql
CREATE TABLE IF NOT EXISTS lineitem (
  l_orderkey      INT NOT NULL,
  l_partkey       INT NOT NULL,
  l_suppkey       INT NOT NULL,
  l_linenumber    INT NOT NULL,
  l_quantity      DECIMAL(15,2) NOT NULL,
  l_extendedprice DECIMAL(15,2) NOT NULL,
  l_discount      DECIMAL(15,2) NOT NULL,
  l_tax           DECIMAL(15,2) NOT NULL,
  l_returnflag    CHAR(1) NOT NULL,
  l_linestatus    CHAR(1) NOT NULL,
  l_shipdate      DATE NOT NULL,
  l_commitdate    DATE NOT NULL,
  l_receiptdate   DATE NOT NULL,
  l_shipinstruct  CHAR(25) NOT NULL,
  l_shipmode      CHAR(10) NOT NULL,
  l_comment       VARCHAR(44) NOT NULL
)
DUPLICATE KEY (l_orderkey, l_partkey, l_suppkey, l_linenumber)
DISTRIBUTED BY HASH (l_orderkey) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

```sql
desc lineitem;
```

```text
+-----------------+---------------+------+-------+---------+-------+
| Field           | Type          | Null | Key   | Default | Extra |
+-----------------+---------------+------+-------+---------+-------+
| l_orderkey      | int           | No   | true  | NULL    |       |
| l_partkey       | int           | No   | true  | NULL    |       |
| l_suppkey       | int           | No   | true  | NULL    |       |
| l_linenumber    | int           | No   | true  | NULL    |       |
| l_quantity      | decimal(15,2) | No   | false | NULL    | NONE  |
| l_extendedprice | decimal(15,2) | No   | false | NULL    | NONE  |
| l_discount      | decimal(15,2) | No   | false | NULL    | NONE  |
| l_tax           | decimal(15,2) | No   | false | NULL    | NONE  |
| l_returnflag    | char(1)       | No   | false | NULL    | NONE  |
| l_linestatus    | char(1)       | No   | false | NULL    | NONE  |
| l_shipdate      | date          | No   | false | NULL    | NONE  |
| l_commitdate    | date          | No   | false | NULL    | NONE  |
| l_receiptdate   | date          | No   | false | NULL    | NONE  |
| l_shipinstruct  | char(25)      | No   | false | NULL    | NONE  |
| l_shipmode      | char(10)      | No   | false | NULL    | NONE  |
| l_comment       | varchar(44)   | No   | false | NULL    | NONE  |
+-----------------+---------------+------+-------+---------+-------+
```

```sql
CREATE MATERIALIZED VIEW sync_agg_mv AS
SELECT 
  l_shipdate as shipdate,
  l_partkey as partkey,
  count(*),
  sum(l_discount)
FROM
  lineitem
GROUP BY
  l_shipdate,
  l_partkey;
```
