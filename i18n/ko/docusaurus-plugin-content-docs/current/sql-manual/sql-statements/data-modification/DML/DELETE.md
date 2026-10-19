---
{
    "title": "DELETE",
    "language": "ko",
    "description": "이 문은 지정된 테이블(기본 인덱스)의 파티션에서 조건에 따라 데이터를 삭제하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 지정된 테이블(기본 인덱스)의 파티션에서 조건에 따라 데이터를 삭제하는 데 사용됩니다.

이 작업은 해당 기본 인덱스와 관련된 rollup 인덱스의 데이터도 삭제합니다.

#### 구문 {#syntax}

구문 1: 이 구문에서는 필터 조건식만 지정할 수 있습니다

```SQL
DELETE FROM table_name [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
WHERE
column_name op { value | value_list } [ AND column_name op { value | value_list } ...];
```

구문 2: 이 구문은 UNIQUE KEY 모델에서만 사용할 수 있습니다

```sql
[cte]
DELETE FROM table_name
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    [USING additional_tables]
    [WHERE condition]
    [ORDER BY column [ASC | DESC] [NULLS FIRST | NULLS LAST] [, ...]]
    [LIMIT [offset,] count]
```

#### 필수 매개변수 {#required-parameters}

+ table_name: 행을 삭제할 테이블을 지정합니다.
+ column_name: table_name에 속한 컬럼입니다.
+ op: 논리 비교 연산자입니다. op에 사용할 수 있는 연산자는 =, >, <, >=, <=, !=, in, not in입니다.
+ value | value_list: 논리 비교에 사용할 값 또는 값 목록입니다.

#### 선택적 매개변수 {#optional-parameters}

+ cte: 공통 테이블 식(Common Table Expression)입니다. 예: 'WITH a AS SELECT * FROM tbl'.
+ PARTITION partition_name | PARTITIONS (partition_name [, partition_name]): 삭제할 행을 선택할 파티션을 하나 이상 지정합니다.
+ table_alias: 테이블의 별칭입니다.
+ USING additional_tables: 삭제할 행을 식별하기 위해 WHERE 절에서 추가 테이블을 참조해야 하는 경우, USING 절에 해당 테이블 이름을 지정합니다. USING 절에 삭제할 행을 식별하는 서브쿼리를 지정할 수도 있습니다.
+ WHERE condition: 삭제할 행을 선택하는 데 사용할 조건을 지정합니다. 구문 1에서는 필수이며, 구문 2에서는 선택 사항입니다.
+ ORDER BY column: 행을 삭제할 순서를 지정합니다. 일반적으로 LIMIT와 함께 사용하여 삭제할 행을 제어합니다.
+ LIMIT [offset,] count: 삭제할 행 수를 제한합니다. ORDER BY와 함께 사용하면 정렬 후 처음 `count`개 행을 삭제합니다. `offset`이 지정되면 처음 `offset`개 행을 건너뛴 후 삭제합니다. ORDER BY 없이 사용하면 삭제되는 행의 집합은 비결정적입니다.

#### 참고 사항 {#note}

1. AGGREGATE (UNIQUE) 모델을 사용할 때는 키 컬럼에 대한 조건만 지정할 수 있습니다.
2. 선택한 키 컬럼이 rollup에 없으면 삭제를 수행할 수 없습니다.
3. 구문 1을 사용할 때 조건은 "and" 관계로만 결합할 수 있습니다. "or" 관계를 구현하려면 두 DELETE 문에 조건을 나누어 작성해야 합니다.
4. 구문 1에서 파티션 테이블인 경우 파티션을 지정할 수 있습니다. 지정하지 않으면 Doris가 주어진 조건에서 파티션을 추론합니다. 다음 두 경우에는 Doris가 조건에서 파티션을 추론할 수 없습니다: 1) 조건에 파티션 컬럼이 포함되지 않은 경우; 2) 파티션 컬럼의 연산자가 in이 아닌 경우. 파티션 테이블이 Unique 테이블이 아니고, 파티션을 지정하지 않았거나 조건에서 파티션을 추론할 수 없는 경우에는 모든 파티션에 delete 문을 적용하려면 세션 변수 delete_without_partition을 true로 설정해야 합니다.

:::tip 팁
이 기능은 Apache Doris 1.2 버전부터 지원됩니다
:::

5. 이 문을 실행한 후 일정 기간 동안 쿼리 효율이 저하될 수 있습니다. 영향의 정도는 문에 지정된 삭제 조건의 수에 따라 달라집니다. 지정하는 조건이 많을수록 영향도 커집니다.
6. 구문 2에서 `WHERE`와 `LIMIT` 중 어느 것도 지정하지 않으면 테이블의 모든 행이 삭제됩니다. `WHERE` 절을 생략하기 전에 항상 의도한 삭제 범위를 확인하세요.

## 예제 {#example}

1. my_table의 p1 파티션에서 k1 컬럼 값이 3인 데이터 행 삭제

   ```sql
   DELETE FROM my_table PARTITION p1
       WHERE k1 = 3;
   ```

2. my_table의 p1 파티션에서 k1 컬럼 값이 3 이상이고 k2 컬럼 값이 "abc"인 데이터 행 삭제

   ```sql
   DELETE FROM my_table PARTITION p1
   WHERE k1 >= 3 AND k2 = "abc";
   ```

3. my_table의 p1, p2 파티션에서 k1 컬럼 값이 3 이상이고 k2 컬럼 값이 "abc"인 데이터 행 삭제

   ```sql
   DELETE FROM my_table PARTITIONS (p1, p2)
   WHERE k1 >= 3 AND k2 = "abc";
   ```

4. `t2`와 `t3`의 조인 결과를 사용하여 `t1`에서 행을 삭제합니다. 삭제 대상 테이블은 unique key 모델이어야 합니다.

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
   
   -- remove rows from t1
   DELETE FROM t1
     USING t2 INNER JOIN t3 ON t2.id = t3.id
     WHERE t1.id = t2.id;
   ```
   
   예상 결과는 테이블 t1에서 id = 1인 행만 삭제되는 것입니다.
   
   ```
   +----+----+----+--------+------------+
   | id | c1 | c2 | c3     | c4         |
   +----+----+----+--------+------------+
   | 2  | 2  | 2  |    2.0 | 2000-01-02 |
   | 3  | 3  | 3  |    3.0 | 2000-01-03 |
   +----+----+----+--------+------------+
   ```

5. cte 사용

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
   delete from lineitem
   using discount_orders
   where lineitem.o_orderkey = discount_orders.o_orderkey;
   ```

6. ORDER BY와 LIMIT를 사용한 삭제: k1을 기준으로 오름차순 정렬한 첫 3개 행 삭제

   ```sql
   DELETE FROM my_table ORDER BY k1 ASC LIMIT 3;
   ```

7. ORDER BY, LIMIT 및 offset을 사용한 삭제: k1을 기준으로 정렬한 행 중 처음 10개 행을 건너뛰고 다음 5개 행 삭제

   ```sql
   DELETE FROM my_table ORDER BY k1 ASC LIMIT 10, 5;
   ```

## 키워드 {#keywords}

    DELETE

## 모범 사례 {#best-practice}
