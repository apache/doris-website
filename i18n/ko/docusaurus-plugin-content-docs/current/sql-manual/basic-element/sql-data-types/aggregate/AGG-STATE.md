---
{
    "title": "AGG_STATE",
    "language": "ko",
    "description": "AGGSTATE는 키 컬럼으로 사용할 수 없으며, 테이블을 생성할 때 집계 함수의 시그니처도 함께 선언해야 합니다."
}
---

## AGG_STATE {#agg_state}
### 설명 {#description}
      AGG_STATE cannot be used as a key column, and the signature of the aggregation function must be declared at the same time when creating the table.
      User does not need to specify length and default value. The actual stored data size is related to the function implementation.
    
  AGG_STATE는 [state](../../../sql-functions/combinators/state)
     /[merge](../../../sql-functions/combinators/merge)/[union](../../../sql-functions/combinators/union) 함수 조합자와 함께만 사용할 수 있습니다.

  집계 함수의 시그니처도 타입의 일부이므로, 시그니처가 다른 agg_state는 혼용할 수 없습니다. 예를 들어 테이블 생성 문의 시그니처가 `max_by(int,int)`이면 `max_by(bigint,int)` 또는 `group_concat(varchar)`는 삽입할 수 없습니다.
   여기서 nullable 속성도 시그니처의 일부입니다. null 값을 입력하지 않는 것이 확실하다면 매개변수를 not null로 선언하여 저장 공간과 직렬화/역직렬화 오버헤드를 줄일 수 있습니다.

**참고: agg_state는 집계 함수의 중간 결과를 저장하므로, 읽기 및 쓰기 과정은 해당 집계 함수의 구현에 크게 의존합니다. Doris 버전 업그레이드 중에 집계 함수의 구현이 변경되면 호환성 문제가 발생할 수 있습니다. 호환성 문제가 발생하면 해당 agg_state를 사용하는 구체화된 뷰를 삭제하고 다시 생성해야 하며, 관련된 기반 집계 테이블은 사용할 수 없게 됩니다. 따라서 agg_state는 신중하게 사용해야 합니다.**

### 예제 {#example}

테이블 생성 예제:
```sql
  -- after doris-2.1.1
  create table a_table(
      k1 int null,
      k2 agg_state<max_by(int not null,int)> generic,
      k3 agg_state<group_concat(string)> generic
  )
  aggregate key (k1)
  distributed BY hash(k1) buckets 3
  properties("replication_num" = "1");  

  -- until doris-2.1.0
  create table a_table(
      k1 int null,
      k2 agg_state max_by(int not null,int),
      k3 agg_state group_concat(string)
  )
  aggregate key (k1)
  distributed BY hash(k1) buckets 3
  properties("replication_num" = "1");
```
여기서 k2와 k3는 각각 max_by와 group_concat을 집계 유형으로 사용합니다.

데이터 삽입 예제:
```sql
    insert into a_table values(1,max_by_state(3,1),group_concat_state('a'));
    insert into a_table values(1,max_by_state(2,2),group_concat_state('bb'));
    insert into a_table values(2,max_by_state(1,3),group_concat_state('ccc'));
```
agg_state 컬럼에 데이터를 삽입할 때는 insert 문에서 [state](../../../sql-functions/combinators/state) 함수를 사용하여 해당 agg_state 데이터를 생성해야 합니다. 이때 함수와 입력 매개변수 타입은 agg_state에 지정된 것과 정확히 일치해야 합니다.

데이터 조회 예제:
```sql
    mysql [test]>select k1,max_by_merge(k2),group_concat_merge(k3) from a_table group by k1 order by k1;
    +------+--------------------+--------------------------+
    | k1   | max_by_merge(`k2`) | group_concat_merge(`k3`) |
    +------+--------------------+--------------------------+
    |    1 |                  2 | bb,a                     |
    |    2 |                  1 | ccc                      |
    +------+--------------------+--------------------------+
```
실제 결과를 얻으려면 해당 [merge](../../../sql-functions/combinators/merge) 함수를 사용해야 합니다.

```sql
    mysql [test]>select max_by_merge(u2),group_concat_merge(u3) from (
    select k1,max_by_union(k2) as u2,group_concat_union(k3) u3 from a_table group by k1 order by k1
    ) t;
    +--------------------+--------------------------+
    | max_by_merge(`u2`) | group_concat_merge(`u3`) |
    +--------------------+--------------------------+
    |                  1 | ccc,bb,a                 |
    +--------------------+--------------------------+
```
집계 과정에서 실제 결과를 구하지 않고 agg_state만 집계하려면 [union](../../../sql-functions/combinators/union) 함수를 사용할 수 있습니다.

더 많은 예제는 [datatype_p0/agg_state](https://github.com/apache/doris/tree/master/regression-test/suites/datatype_p0/agg_state)를 참조하세요.
### 키워드 {#keywords}

    AGG_STATE
