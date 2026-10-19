---
{
    "title": "INSERT",
    "language": "ko",
    "description": "이 문은 데이터 삽입 작업을 수행합니다."
}
---

## 설명 {#description}

이 문은 데이터 삽입 작업을 수행합니다.

```sql
INSERT INTO table_name
    [ PARTITION (p1, ...) ]
    [ WITH LABEL label]
    [ (column [, ...]) ]
    [ [ hint [, ...] ] ]
    { VALUES ( { expression | DEFAULT } [, ...] ) [, ...] | query }
```

 매개변수

> tablet_name: 데이터를 적재할 대상 테이블입니다. `db_name.table_name` 형식으로 지정할 수 있습니다.
>
> partitions: 데이터를 적재할 파티션을 지정합니다. `table_name`에 존재하는 파티션이어야 합니다. 여러 파티션 이름은 쉼표로 구분합니다.
>
> label: Insert 작업에 사용할 레이블을 지정합니다.
>
> column_name: 대상 컬럼을 지정합니다. `table_name`에 존재하는 컬럼이어야 합니다.
>
> expression: 컬럼에 할당할 표현식입니다.
>
> DEFAULT: 해당 컬럼에 기본값을 사용합니다.
>
> query: 일반적인 쿼리이며, 쿼리 결과가 대상에 기록됩니다.
>
> hint: `INSERT`의 실행 동작을 지정하는 힌트입니다. 다음 값 중 하나를 선택할 수 있습니다: `/*+ STREAMING */`, `/*+ SHUFFLE */` 또는 `/*+ NOSHUFFLE */.
> 1. STREAMING: 현재는 실질적인 효과가 없으며 이전 버전과의 호환성을 위해서만 유지됩니다. (이전 버전에서는 이 힌트를 추가해야 레이블을 반환했지만, 현재는 기본적으로 레이블을 반환합니다.)
> 2. SHUFFLE: 대상 테이블이 파티션 테이블인 경우 이 힌트를 활성화하면 재파티셔닝을 수행합니다.
> 3. NOSHUFFLE: 대상 테이블이 파티션 테이블이더라도 재파티셔닝을 수행하지 않습니다. 대신 데이터가 각 파티션에 올바르게 저장되도록 다른 작업을 수행합니다.

merge-on-write가 활성화된 Unique 테이블에서는 insert 문으로 일부 컬럼만 업데이트할 수도 있습니다. insert 문으로 일부 컬럼을 업데이트하려면 세션 변수 enable_unique_key_partial_update를 true로 설정해야 합니다. 이 변수의 기본값은 false이며, 기본적으로 insert 문을 사용한 일부 컬럼 업데이트는 허용되지 않습니다. 일부 컬럼을 업데이트할 때는 삽입할 컬럼에 최소한 모든 Key 컬럼을 포함하고, 업데이트할 컬럼을 지정해야 합니다. 삽입할 행의 Key 컬럼 값이 원본 테이블에 이미 존재하면 동일한 키 컬럼 값을 가진 행의 데이터를 업데이트합니다. 삽입할 행의 Key 컬럼 값이 원본 테이블에 존재하지 않으면 테이블에 새 행을 삽입합니다. 이 경우 insert 문에 지정하지 않은 컬럼에는 기본값이 있거나 null을 허용해야 합니다. 누락된 컬럼은 먼저 기본값으로 채우기를 시도하며, 기본값이 없는 컬럼은 null로 채웁니다. null을 허용하지 않는 컬럼이 있으면 삽입 작업이 실패합니다.

insert 문의 엄격 모드 동작 여부를 제어하는 세션 변수 `enable_insert_strict`의 기본값은 true입니다. 즉, insert 문은 기본적으로 엄격 모드로 동작하며, 이 모드에서는 일부 컬럼 업데이트 시 존재하지 않는 키를 업데이트할 수 없습니다. 따라서 insert 문으로 일부 컬럼을 업데이트하면서 존재하지 않는 키도 삽입하려면 `enable_unique_key_partial_update`를 true로 설정하고 동시에 `enable_insert_strict`를 false로 설정해야 합니다.

주의:

`INSERT` 문을 실행하면 문자열이 너무 긴 경우처럼 대상 테이블 형식에 맞지 않는 데이터를 기본적으로 필터링합니다. 데이터 필터링을 허용하지 않는 비즈니스 시나리오에서는 세션 변수 `enable_insert_strict`를 `true`로 설정하여, 필터링된 데이터가 있을 때 `INSERT`가 성공하지 않도록 할 수 있습니다.

## 예제 {#example}

`test` 테이블에는 `c1`, `c2`라는 두 컬럼이 있습니다.

1. `test` 테이블에 데이터 한 행 적재

```sql
INSERT INTO test VALUES (1, 2);
INSERT INTO test (c1, c2) VALUES (1, 2);
INSERT INTO test (c1, c2) VALUES (1, DEFAULT);
INSERT INTO test (c1) VALUES (1);
```

첫 번째 문과 두 번째 문은 동일하게 동작합니다. 대상 컬럼을 지정하지 않으면 테이블의 컬럼 순서를 기본 대상 컬럼 순서로 사용합니다.
세 번째 문과 네 번째 문도 동일한 의미이며, `c2` 컬럼의 기본값을 사용하여 데이터를 적재합니다.

2. `test` 테이블에 여러 행의 데이터를 한 번에 적재

```sql
INSERT INTO test VALUES (1, 2), (3, 2 + 2);
INSERT INTO test (c1, c2) VALUES (1, 2), (3, 2 * 2);
INSERT INTO test (c1) VALUES (1), (3);
INSERT INTO test (c1, c2) VALUES (1, DEFAULT), (3, DEFAULT);
```

첫 번째 문과 두 번째 문은 동일하게 동작하며, `test` 테이블에 두 행의 데이터를 한 번에 적재합니다.
세 번째 문과 네 번째 문도 동일하게 동작하며, `c2` 컬럼의 기본값을 사용하여 `test` 테이블에 두 행의 데이터를 적재합니다.

3. `test` 테이블에 쿼리 결과 적재

```sql
INSERT INTO test SELECT * FROM test2;
INSERT INTO test (c1, c2) SELECT * from test2;
```

4. 파티션과 레이블을 지정하여 `test` 테이블에 쿼리 결과 적재

```sql
INSERT INTO test PARTITION(p1, p2) WITH LABEL `label1` SELECT * FROM test2;
INSERT INTO test WITH LABEL `label1` (c1, c2) SELECT * from test2;
```


## 키워드 {#keywords}

    INSERT

## 권장 사항 {#best-practice}

1. 반환 결과 확인

   INSERT 작업은 동기식 작업이므로 결과가 반환되면 작업이 끝났음을 의미합니다. 사용자는 반환 결과에 따라 적절한 처리를 수행해야 합니다.

   1. 실행에 성공하고 결과 집합이 비어 있는 경우

      insert에 사용한 select 문의 결과 집합이 비어 있으면 다음과 같은 결과를 반환합니다.

      ```sql
      mysql> insert into tbl1 select * from empty_tbl;
      Query OK, 0 rows affected (0.02 sec)
      ```

      `Query OK`는 실행 성공을 나타냅니다. `0 rows affected`는 적재된 데이터가 없음을 의미합니다.

   2. 실행에 성공하고 결과 집합이 비어 있지 않은 경우

      결과 집합이 비어 있지 않으면 다음과 같은 결과를 반환합니다.

      1. Insert 실행에 성공하고 데이터가 보이는 경우:

         ```sql
         mysql> insert into tbl1 select * from tbl2;
         Query OK, 4 rows affected (0.38 sec)
         {'label':'insert_8510c568-9eda-4173-9e36-6adc7d35291c', 'status':'visible', 'txnId':'4005'}
         
         mysql> insert into tbl1 with label my_label1 select * from tbl2;
         Query OK, 4 rows affected (0.38 sec)
         {'label':'my_label1', 'status':'visible', 'txnId':'4005'}
         
         mysql> insert into tbl1 select * from tbl2;
         Query OK, 2 rows affected, 2 warnings (0.31 sec)
         {'label':'insert_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'visible', 'txnId':'4005'}
         
         mysql> insert into tbl1 select * from tbl2;
         Query OK, 2 rows affected, 2 warnings (0.31 sec)
         {'label':'insert_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
         ```

         `Query OK`는 실행 성공을 나타냅니다. `4 rows affected`는 총 4행의 데이터가 적재되었음을 의미합니다. `2 warnings`는 필터링할 행 수를 나타냅니다.

         JSON 문자열도 반환합니다.

         ```json
         {'label':'my_label1', 'status':'visible', 'txnId':'4005'}
         {'label':'insert_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
         {'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
         ```

         `label`은 사용자가 지정하거나 자동으로 생성된 레이블입니다. 레이블은 이 Insert Into 데이터 적재 작업의 ID입니다. 각 데이터 적재 작업은 단일 데이터베이스 내에서 고유한 레이블을 갖습니다.

         `status`는 적재된 데이터의 가시성을 나타냅니다. 데이터가 보이면 `visible`, 보이지 않으면 `committed`가 표시됩니다.

         `txnId`는 이 insert에 해당하는 데이터 적재 트랜잭션의 ID입니다.

         `err` 필드에는 그 밖의 예기치 않은 오류가 표시됩니다.

         필터링된 행을 확인하려면 다음 문을 실행합니다.

         ```sql
         show load where label="xxx";
         ```

         반환 결과의 URL을 사용하여 오류가 있는 데이터를 조회할 수 있습니다. 자세한 내용은 뒤에 나오는 **오류 행 확인**에 대한 설명을 참조하세요.

         **데이터가 보이지 않는 것은 일시적인 상태이며, 이 배치의 데이터는 최종적으로 조회할 수 있게 됩니다.**

         다음 문으로 이 배치 데이터의 가시성 상태를 확인할 수 있습니다.

         ```sql
         show transaction where id=4005;
         ```

         반환 결과의 `TransactionStatus` 컬럼이 `visible`이면 데이터를 조회할 수 있음을 의미합니다.

   3. 실행에 실패한 경우

      실행 실패는 성공적으로 적재된 데이터가 없음을 의미하며, 다음과 같은 결과를 반환합니다.

      ```sql
      mysql> insert into tbl1 select * from tbl2 where k1 = "a";
      ERROR 1064 (HY000): all partitions have no load data. url: http://10.74.167.16:8042/api/_load_error_log?file=__shard_2/error_log_insert_stmt_ba8bb9e158e4879-ae8de8507c0bf8a2_ba8bb9e158e4879_ae8de8507c0
      ```

      여기서 `ERROR 1064 (HY000): all partitions have no load data`는 실패 원인을 나타냅니다. 그 뒤에 나오는 URL로 오류가 있는 데이터를 조회할 수 있습니다.

      ```sql
      show load warnings on "url";
      ```

      이를 통해 구체적인 오류 행을 확인할 수 있습니다.

2. 제한 시간

   INSERT 작업의 제한 시간은 max(insert_timeout, query_timeout)에 따라 결정됩니다. 둘 다 환경 변수이며, insert_timeout의 기본값은 4시간이고 query_timeout의 기본값은 5분입니다. 작업이 제한 시간을 초과하면 취소됩니다. insert_timeout은 INSERT 문에 더 긴 기본 제한 시간을 적용하기 위해 도입되었습니다. 이를 통해 데이터 적재 작업이 일반 쿼리에 적용되는 짧은 기본 제한 시간의 영향을 받지 않도록 합니다.

3. 레이블과 원자성

   INSERT 작업도 데이터 적재의 원자성을 보장합니다. [데이터 적재 트랜잭션과 원자성](../../../../data-operate/transaction.md) 문서를 참조하세요.

   삽입 작업의 쿼리 부분에 `CTE(Common Table Expressions)`를 사용하는 경우 `WITH LABEL`과 `column` 부분을 반드시 지정해야 합니다.

4. 필터링 임계값

   다른 데이터 적재 방식과 달리 INSERT 작업에서는 필터링 임계값(`max_filter_ratio`)을 지정할 수 없습니다. 기본 필터링 임계값은 1이며, 이는 오류가 있는 행을 무시할 수 있음을 의미합니다.

   데이터 필터링을 허용하지 않는 비즈니스 시나리오에서는 [세션 변수](../../session/variable/SET-VARIABLE) `enable_insert_strict`를 `true`로 설정하여, 필터링된 데이터가 있을 때 `INSERT`가 성공하지 않도록 할 수 있습니다.

5. 성능 문제

   `VALUES` 방식으로 단일 행을 삽입하는 것은 피하세요. 이 방식을 사용해야 한다면 여러 행의 데이터를 하나의 INSERT 문으로 묶어 일괄 커밋하세요.
