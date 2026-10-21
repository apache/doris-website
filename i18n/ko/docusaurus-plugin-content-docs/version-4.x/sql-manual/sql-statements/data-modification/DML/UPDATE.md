---
{
    "title": "UPDATE",
    "language": "ko",
    "description": "이 문은 데이터를 업데이트하는 데 사용됩니다. UPDATE 문은 현재 UNIQUE KEY 모델만 지원합니다."
}
---

## 설명 {#description}

이 문은 데이터를 업데이트하는 데 사용됩니다. UPDATE 문은 현재 UNIQUE KEY 모델만 지원합니다.

UPDATE 작업은 현재 Value 열의 업데이트만 지원합니다. Key 열의 업데이트에 대해서는 [FlinkCDC를 사용하여 Key 열 업데이트](../../../../connection-integration/data-integration/flink-doris-connector.md#updating-key-columns-with-flink-cdc)를 참고하세요.
#### 구문 {#syntax}

```sql
[cte]
UPDATE target_table [table_alias]
    SET assignment_list
    [ FROM additional_tables]
    [WHERE condition]
    [ORDER BY column [ASC | DESC] [NULLS FIRST | NULLS LAST] [, ...]]
    [LIMIT [offset,] count]
```

#### 필수 매개변수 {#required-parameters}

+ target_table: 업데이트할 데이터가 있는 대상 테이블입니다. 'db_name.table_name' 형식으로 지정할 수 있습니다.
+ assignment_list: 업데이트할 대상 열입니다. 'col_name = value, col_name = value' 형식으로 지정합니다.

#### 선택적 매개변수 {#optional-parameters}

+ cte: 공통 테이블 표현식(Common Table Expression)입니다. 예: 'WITH a AS SELECT * FROM tbl'
+ table_alias: 테이블의 별칭입니다.
+ FROM additional_tables: 업데이트할 행을 선택하거나 새 값을 설정하는 데 사용할 하나 이상의 테이블을 지정합니다. 여기에 대상 테이블을 사용하려면 별칭을 명시적으로 지정해야 합니다.
+ WHERE condition: 업데이트할 행을 선택하는 조건으로, true 또는 false를 반환하는 표현식입니다.
+ ORDER BY column: 행을 업데이트할 순서를 지정합니다. 일반적으로 LIMIT와 함께 사용하여 업데이트할 행을 제어합니다.
+ LIMIT [offset,] count: 업데이트할 행 수를 제한합니다. ORDER BY와 함께 사용하면 정렬 후 처음 `count`개의 행을 업데이트합니다. `offset`을 지정하면 처음 `offset`개의 행을 건너뛴 후 업데이트합니다. ORDER BY 없이 사용하면 어떤 행이 업데이트될지 보장되지 않습니다.

#### 참고 {#note}

현재 UPDATE 문은 UNIQUE KEY 모델의 행 업데이트만 지원합니다.

`WHERE`와 `LIMIT`를 모두 지정하지 않으면 테이블의 모든 행이 업데이트됩니다. `WHERE` 절을 생략하기 전에 항상 의도한 업데이트 범위를 확인하세요.

## 예제 {#example}

`test` 테이블은 k1, k2, v1, v2의 네 개 열을 포함하는 unique 모델 테이블입니다. k1, k2는 키이고 v1, v2는 값이며, 집계 방식은 Replace입니다.

1. 'test' 테이블에서 k1 =1 , k2 =2 조건을 만족하는 행의 v1 열을 1로 업데이트합니다.

```sql
UPDATE test SET v1 = 1 WHERE k1=1 and k2=2;
```

2. 'test' 테이블에서 k1=1인 행의 v1 열 값을 1만큼 증가시킵니다.

```sql
UPDATE test SET v1 = v1+1 WHERE k1=1;
```

3. `t2`와 `t3`의 조인 결과를 사용하여 `t1`을 업데이트합니다.

```sql
-- create t1, t2, t3 tables
CREATE TABLE t1
  (id INT, c1 BIGINT, c2 STRING, c3 DOUBLE, c4 DATE)
UNIQUE KEY (id)
DISTRIBUTED BY HASH (id)
PROPERTIES('replication_num'='1', "function_column.sequence_col" = "c4");

CREATE TABLE t2
  (id INT, c1 BIGINT, c2 STRING, c3 DOUBLE, c4 DATE)
DISTRIBUTED BY HASH (id)
PROPERTIES('replication_num'='1');

CREATE TABLE t3
  (id INT)
DISTRIBUTED BY HASH (id)
PROPERTIES('replication_num'='1');

-- insert data
INSERT INTO t1 VALUES
  (1, 1, '1', 1.0, '2000-01-01'),
  (2, 2, '2', 2.0, '2000-01-02'),
  (3, 3, '3', 3.0, '2000-01-03');

INSERT INTO t2 VALUES
  (1, 10, '10', 10.0, '2000-01-10'),
  (2, 20, '20', 20.0, '2000-01-20'),
  (3, 30, '30', 30.0, '2000-01-30'),
  (4, 4, '4', 4.0, '2000-01-04'),
  (5, 5, '5', 5.0, '2000-01-05');

INSERT INTO t3 VALUES
  (1),
  (4),
  (5);

-- update t1
UPDATE t1
  SET t1.c1 = t2.c1, t1.c3 = t2.c3 * 100
  FROM t2 INNER JOIN t3 ON t2.id = t3.id
  WHERE t1.id = t2.id;
```

예상 결과는 t1 테이블에서 id = 1인 행만 업데이트되는 것입니다.

```
+----+----+----+--------+------------+
| id | c1 | c2 | c3     | c4         |
+----+----+----+--------+------------+
| 1  | 10 | 1  | 1000.0 | 2000-01-01 |
| 2  | 2  | 2  |    2.0 | 2000-01-02 |
| 3  | 3  | 3  |    3.0 | 2000-01-03 |
+----+----+----+--------+------------+
```

4. cte를 사용합니다.

```sql
create table orders(
    o_orderkey bigint,
    o_totalprice decimal(15, 2)
) unique key(o_orderkey)
distributed by hash(o_orderkey) buckets 1 
properties (
    "replication_num" = "1"
);

insert into orders values
(1, 34.1),
(2, 432.8);

create table lineitem(
    l_linenumber int,
    o_orderkey bigint,
    l_discount  decimal(15, 2)
) unique key(l_linenumber)
distributed by hash(l_linenumber) buckets 1 
properties (
    "replication_num" = "1"
);

insert into lineitem values
(1, 1, 1.23),
(2, 1, 3.21),
(3, 2, 18.08),
(4, 2, 23.48);

with discount_orders as (
    select * from orders 
    where o_totalprice > 100
)
update lineitem  set l_discount = l_discount*0.9
from discount_orders 
where lineitem.o_orderkey = discount_orders.o_orderkey;
```

5. ORDER BY와 LIMIT를 사용한 업데이트: k1 > 0인 행 중 v1 값이 가장 큰 상위 3개 행의 v1 열을 0으로 업데이트합니다.

```sql
UPDATE test SET v1 = 0 WHERE k1 > 0 ORDER BY v1 DESC LIMIT 3;
```

6. ORDER BY, LIMIT, offset을 사용한 업데이트: k1 순으로 정렬한 후 처음 10개 행을 건너뛰고 다음 5개 행을 업데이트합니다.

```sql
UPDATE test SET v1 = 100 ORDER BY k1 ASC LIMIT 10, 5;
```

## 키워드 {#keywords}

    UPDATE

## 모범 사례 {#best-practice}
