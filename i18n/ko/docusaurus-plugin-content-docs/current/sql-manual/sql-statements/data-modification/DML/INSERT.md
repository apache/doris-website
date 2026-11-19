---
{
    "title": "INSERT",
    "language": "ko",
    "description": "이 문은 데이터 삽입 작업을 완료합니다."
}
---

## 설명 {#description}

이 문은 데이터 삽입 작업을 완료합니다.

```sql
INSERT INTO table_name
    [ PARTITION (p1, ...) ]
    [ WITH LABEL label]
    [ (column [, ...]) ]
    [ [ hint [, ...] ] ]
    { VALUES ( { expression | DEFAULT } [, ...] ) [, ...] | query }
```

 매개변수

> tablet_name: 데이터를 적재할 대상 테이블입니다. `db_name.table_name` 형식일 수 있습니다.
>
> partitions: 적재할 파티션을 지정합니다. `table_name`에 존재하는 파티션이어야 하며, 여러 파티션 이름은 쉼표로 구분합니다.
>
> label: INSERT 작업에 레이블을 지정합니다.
>
> column_name: 지정된 대상 열입니다. `table_name`에 존재하는 열이어야 합니다.
>
> expression: 열에 할당해야 하는 해당 표현식입니다.
>
> DEFAULT: 해당 열에서 기본값을 사용하도록 합니다.
>
> query: 일반 쿼리입니다. 쿼리 결과가 대상에 기록됩니다.
>
> hint: `INSERT`의 실행 동작을 나타내는 지시자입니다. 다음 값 중 하나를 선택할 수 있습니다: `/*+ STREAMING */`, `/*+ SHUFFLE */` 또는 `/*+ NOSHUFFLE */`.
> 1. STREAMING: 현재는 실제 효과가 없으며 이전 버전과의 호환성을 위해서만 유지됩니다. (이전 버전에서는 이 힌트를 추가하면 레이블이 반환되었지만, 이제는 기본적으로 레이블이 반환됩니다.)
> 2. SHUFFLE: 대상 테이블이 파티션 테이블인 경우 이 힌트를 활성화하면 repartiiton이 수행됩니다.
> 3. NOSHUFFLE: 대상 테이블이 파티션 테이블이더라도 repartiiton은 수행되지 않지만, 데이터가 각 파티션에 올바르게 적재되도록 다른 작업이 수행됩니다.

merge-on-write가 활성화된 Unique 테이블에서는 insert 문을 사용하여 부분 열 업데이트도 수행할 수 있습니다. insert 문으로 부분 열 업데이트를 수행하려면 세션 변수 `enable_unique_key_partial_update`를 true로 설정해야 합니다(이 변수의 기본값은 false이므로 기본적으로 insert 문을 통한 부분 열 업데이트는 허용되지 않습니다). 부분 열 업데이트를 수행할 때 삽입되는 열에는 모든 Key 열이 최소한 포함되어야 하며, 업데이트할 열을 지정해야 합니다. 삽입된 행의 Key 열 값이 원본 테이블에 이미 있으면 동일한 Key 열 값을 가진 행의 데이터가 업데이트됩니다. 삽입된 행의 Key 열 값이 원본 테이블에 없으면 새 행이 테이블에 삽입됩니다. 이 경우 insert 문에 지정되지 않은 열에는 기본값이 있거나 null을 허용해야 합니다. 이러한 누락된 열은 먼저 기본값으로 채우려고 시도하며, 열에 기본값이 없으면 null로 채워집니다. 열이 null을 허용하지 않으면 삽입 작업이 실패합니다.

insert 문이 엄격 모드로 작동하는지 제어하는 세션 변수 `enable_insert_strict`의 기본값은 true입니다. 즉, insert 문은 기본적으로 엄격 모드이며, 이 모드에서는 부분 열 업데이트 시 존재하지 않는 키를 업데이트할 수 없습니다. 따라서 insert 문으로 부분 열 업데이트를 수행하면서 존재하지 않는 키를 삽입하려면 `enable_unique_key_partial_update`를 true로 설정하는 동시에 `enable_insert_strict`를 false로 설정해야 합니다.

주의:

`INSERT` 문을 실행할 때 문자열이 너무 긴 경우와 같이 대상 테이블 형식에 맞지 않는 데이터는 기본적으로 필터링됩니다. 그러나 데이터를 필터링해서는 안 되는 비즈니스 시나리오에서는 세션 변수 `enable_insert_strict`를 `true`로 설정하여 데이터가 필터링되면 `INSERT`가 성공적으로 실행되지 않도록 할 수 있습니다.

## 예시 {#example}

`test` 테이블에는 `c1`, `c2` 두 개의 열이 있습니다.

1. `test` 테이블에 한 행의 데이터 적재

```sql
INSERT INTO test VALUES (1, 2);
INSERT INTO test (c1, c2) VALUES (1, 2);
INSERT INTO test (c1, c2) VALUES (1, DEFAULT);
INSERT INTO test (c1) VALUES (1);
```

첫 번째 문과 두 번째 문은 동일한 효과를 냅니다. 대상 열을 지정하지 않으면 테이블의 열 순서가 기본 대상 열로 사용됩니다.
세 번째 문과 네 번째 문도 같은 의미이며, `c2` 열의 기본값을 사용하여 데이터를 적재합니다.

2. `test` 테이블에 여러 행의 데이터를 한 번에 적재

```sql
INSERT INTO test VALUES (1, 2), (3, 2 + 2);
INSERT INTO test (c1, c2) VALUES (1, 2), (3, 2 * 2);
INSERT INTO test (c1) VALUES (1), (3);
INSERT INTO test (c1, c2) VALUES (1, DEFAULT), (3, DEFAULT);
```

첫 번째 문과 두 번째 문은 동일한 효과를 내며, `test` 테이블에 두 개의 데이터를 한 번에 적재합니다.
세 번째 문과 네 번째 문의 효과는 동일하며, `c2` 열의 기본값을 사용하여 `test` 테이블에 두 개의 데이터를 적재합니다.

3. 쿼리 결과를 `test` 테이블에 적재

```sql
INSERT INTO test SELECT * FROM test2;
INSERT INTO test (c1, c2) SELECT * from test2;
```

4. 파티션과 레이블을 지정하여 쿼리 결과를 `test` 테이블에 적재

```sql
INSERT INTO test PARTITION(p1, p2) WITH LABEL `label1` SELECT * FROM test2;
INSERT INTO test WITH LABEL `label1` (c1, c2) SELECT * from test2;
```


## 키워드 {#keywords}

    INSERT

## 모범 사례 {#best-practice}

1. 반환된 결과 확인

   INSERT 작업은 동기 작업이며, 결과가 반환되면 작업이 종료된 것입니다. 사용자는 반환 결과에 따라 적절히 처리해야 합니다.

   1. 실행 성공, 결과 집합이 비어 있음

      select 문에 해당하는 insert의 결과 집합이 비어 있으면 다음과 같이 반환됩니다.

      ```sql
      mysql> insert into tbl1 select * from empty_tbl;
      Query OK, 0 rows affected (0.02 sec)
      ```

      `Query OK`는 실행이 성공했음을 나타냅니다. `0 rows affected`는 적재된 데이터가 없음을 의미합니다.

   2. 실행 성공, 결과 집합이 비어 있지 않음

      결과 집합이 비어 있지 않은 경우 반환 결과는 다음과 같이 나뉩니다.

      1. Insert가 성공적으로 실행되고 표시됨:

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

         `Query OK`는 실행이 성공했음을 나타냅니다. `4 rows affected`는 총 4개의 데이터 행이 적재되었음을 의미합니다. `2 warnings`는 필터링된 행 수를 나타냅니다.

         또한 다음과 같은 json 문자열이 반환됩니다.

         ```json
         {'label':'my_label1', 'status':'visible', 'txnId':'4005'}
         {'label':'insert_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
         {'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
         ```

         `label`은 사용자가 지정한 레이블이거나 자동으로 생성된 레이블입니다. Label은 이 Insert Into 적재 작업의 ID입니다. 각 적재 작업에는 하나의 데이터베이스 내에서 고유한 Label이 있습니다.

         `status`는 적재된 데이터가 표시되는지 여부를 나타냅니다. 표시되면 `visible`, 표시되지 않으면 `committed`로 표시됩니다.

         `txnId`는 이 insert에 해당하는 적재 트랜잭션의 ID입니다.

         `err` 필드에는 기타 예기치 않은 오류가 표시됩니다.

         필터링된 행을 확인해야 하는 경우 다음 문을 실행할 수 있습니다.

         ```sql
         show load where label="xxx";
         ```

         반환 결과의 URL을 사용하여 오류가 있는 데이터를 조회할 수 있습니다. 자세한 내용은 뒤의 **오류 행 보기** 요약을 참조하세요.

         **데이터가 표시되지 않는 것은 일시적인 상태이며, 이 데이터 배치는 최종적으로 표시됩니다.**

         다음 문으로 이 데이터 배치의 표시 상태를 확인할 수 있습니다.

         ```sql
         show transaction where id=4005;
         ```

         반환 결과의 `TransactionStatus` 열이 `visible`이면 데이터가 표시되는 것입니다.

   3. 실행 실패

      실행 실패는 데이터가 하나도 성공적으로 적재되지 않았음을 의미하며, 다음과 같이 반환됩니다.

      ```sql
      mysql> insert into tbl1 select * from tbl2 where k1 = "a";
      ERROR 1064 (HY000): all partitions have no load data. url: http://10.74.167.16:8042/api/_load_error_log?file=__shard_2/error_log_insert_stmt_ba8bb9e158e4879-ae8de8507c0bf8a2_ba8bb9e158e4879_ae8de8507c0
      ```

      `ERROR 1064 (HY000): all partitions have no load data`는 실패 원인을 보여 줍니다. 다음 URL을 사용하여 오류가 있는 데이터를 조회할 수 있습니다.

      ```sql
      show load warnings on "url";
      ```

      구체적인 오류 행을 확인할 수 있습니다.

2. 시간 초과

   INSERT 작업의 시간 초과는 max(insert_timeout, query_timeout)에 의해 결정됩니다. 둘 다 환경 변수이며, insert_timeout의 기본값은 4시간이고 query_timeout의 기본값은 5분입니다. 작업이 시간 초과를 초과하면 작업이 취소됩니다. insert_timeout을 도입한 이유는 INSERT 문에 더 긴 기본 시간 초과를 제공하여 적재 작업이 일반 쿼리에 적용되는 더 짧은 기본 시간 초과의 영향을 받지 않도록 하기 위해서입니다.

3. 레이블과 원자성

   INSERT 작업은 적재의 원자성도 보장합니다. 자세한 내용은 [적재 트랜잭션 및 원자성](../../../../data-operate/transaction.md) 문서를 참조하세요.

   insert 작업에서 쿼리 부분으로 `CTE(Common Table Expressions)`를 사용할 때는 `WITH LABEL` 및 `column` 부분을 지정해야 합니다.

4. 필터 임계값

   INSERT는 적재 속성 `max_filter_ratio`가 아니라 세션 변수 `insert_max_filter_ratio`를 사용하여 필터 임계값을 제어합니다. `insert_max_filter_ratio`는 2.1.5 버전부터 지원되며, 범위는 0~1이고 기본값은 1.0입니다. `enable_insert_strict = false`일 때만 적용됩니다. 이 변수는 Doris 테이블, 외부 테이블 및 파일 TVF를 포함하여 `INSERT INTO ... VALUES` 및 `INSERT INTO ... SELECT`에 적용됩니다. `filtered_rows / (loaded_rows + filtered_rows)`가 이 값을 초과하면 INSERT가 실패합니다.

   필터링된 데이터를 하나라도 허용하지 않으려면 [세션 변수](../../session/variable/SET-VARIABLE) `enable_insert_strict`를 `true`로 설정하세요(기본값). 그러면 행이 하나라도 필터링될 경우 INSERT가 실패합니다. 필터 임계값은 SQL 분석 오류나 데이터 소스 액세스 실패와 같은 다른 실행 오류를 무시하지 않습니다.

5. 성능 문제

   `VALUES` 방식을 사용한 단일 행 삽입은 지원되지 않습니다. 이 방식으로 사용해야 한다면 여러 행의 데이터를 하나의 INSERT 문으로 결합하여 일괄 커밋하세요.
