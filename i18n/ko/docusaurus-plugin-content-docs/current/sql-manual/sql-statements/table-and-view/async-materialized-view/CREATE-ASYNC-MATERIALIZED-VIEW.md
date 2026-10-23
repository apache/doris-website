---
{
    "title": "CREATE ASYNC MATERIALIZED VIEW",
    "language": "ko",
    "description": "비동기 구체화된 뷰를 생성하는 문입니다. 열 이름과 유형은 구체화된 뷰의 SQL 문에서 결정됩니다."
}
---

## 설명 {#description}

비동기 구체화된 뷰를 생성하는 문입니다. 열 이름과 유형은 구체화된 뷰의 SQL 문에서 결정됩니다. 열 이름은 직접 지정할 수 있지만, 열 유형은 정의할 수 없습니다.

## 구문 {#syntax}


```sql
CREATE MATERIALIZED VIEW 
[ IF NOT EXISTS ] <materialized_view_name>
    [ (<columns_definition>) ] 
    [ BUILD <build_mode> ]
    [ REFRESH <refresh_method> [FALLBACK] [<refresh_trigger>]]
    [ [DUPLICATE] KEY (<key_cols>) ]
    [ COMMENT '<table_comment>' ]
    [ PARTITION BY (
        { <partition_col> 
            | DATE_TRUNC(<partition_col>, <partition_unit>) }
        )]
    [ DISTRIBUTED BY { HASH (<distribute_cols>) | RANDOM }
        [ BUCKETS { <bucket_count> | AUTO } ]
    ]               
    [ PROPERTIES (
          -- Table property
          <table_property>
          -- Additional table properties
          [ , ... ]) 
    ]
    AS <query>
```

각 항목의 정의는 다음과 같습니다.


```sql
columns_definition
  : -- Column definition
    <col_name> 
      [ COMMENT '<col_comment>' ]
refresh_trigger
  : ON MANUAL
  | ON SCHEDULE EVERY <int_value> <refresh_unit> [ STARTS '<start_time>']
  | ON COMMIT
refresh_method
  : COMPLETE
  | AUTO
  | INCREMENTAL
  | PARTITIONS
```

## 필수 매개변수 {#required-parameters}

**1. `<materialized_view_name>`**

> 구체화된 뷰의 식별자(이름)를 지정합니다. 식별자는 테이블이 생성되는 데이터베이스 내에서 고유해야 합니다.
>
> 식별자는 문자로 시작해야 합니다. Unicode 이름 지원이 활성화되어 있으면 모든 언어의 문자를 사용할 수 있습니다. 식별자 문자열 전체를 백틱으로 묶지 않는 한 공백이나 특수 문자를 포함할 수 없습니다(예: `My Object`).
>
> 식별자로 예약 키워드를 사용할 수 없습니다.
>
> 자세한 내용은 식별자 및 예약 키워드에 대한 요구 사항을 참조하세요.

**2. `<query>`**

> 구체화된 뷰를 생성할 때 필요한 매개변수입니다. 데이터를 채우는 SELECT 문을 지정합니다.

## 선택적 매개변수 {#optional-parameters}

**1. `<key_cols>`**

> 테이블의 키 열입니다. Doris에서 키 열은 테이블의 첫 K개 열이어야 합니다. 키에 대한 제한 사항과 키 열을 선택하는 방법은 "데이터 모델" 장의 해당 절을 참조하세요.

**2. `<build_mode>`**

> 새로 고침 시점: 구체화된 뷰를 생성한 직후 새로 고칠지 지정합니다.
>
> IMMEDIATE: 즉시 새로 고칩니다. 기본값은 IMMEDIATE입니다.
>
> DEFERRED: 새로 고침을 지연합니다.

**3. `<refresh_method>`**

> 새로 고침 방식:
>
> COMPLETE: 모든 파티션을 새로 고칩니다.
>
> PARTITIONS: 기본 테이블의 파티션 변경을 감지하고 영향을 받는 구체화된 뷰의 파티션을 다시 계산합니다. 구체화된 뷰에 `PARTITION BY`가 정의되어 있어야 합니다.
>
> INCREMENTAL: Incremental View Maintenance(IVM)를 사용하여 두 새로 고침 사이에 발생한 기본 테이블의 행 수준 변경을 처리합니다. Doris 5.0.0부터 사용할 수 있으며 현재 실험적 기능입니다.
>
> AUTO: Doris가 사용 가능한 새로 고침 방식을 자동으로 선택합니다. IVM 요구 사항을 충족하는 구체화된 뷰에 대해서는 IVM, 파티션 새로 고침, 전체 새로 고침을 차례로 시도합니다.

`FALLBACK`을 `INCREMENTAL` 또는 `PARTITIONS` 뒤에 지정하면 실행 시 더 넓은 범위를 처리하는 새로 고침 방식으로 전환할 수 있습니다. `INCREMENTAL FALLBACK`을 사용하더라도 생성 시 정의가 IVM 요구 사항을 충족하는지 엄격하게 검사합니다. 자세한 내용은 [Incremental View Maintenance(IVM)](../../../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view)를 참조하세요.

:::caution 참고
파티션으로 나뉜 구체화된 뷰가 COMPLETE 새로 고침 모드를 사용하면 모든 파티션의 데이터를 전체 새로 고침하므로, 사실상 파티션이 없는 구체화된 뷰처럼 동작합니다.
:::

**4. `<refresh_trigger>`**

> 트리거 방식:
>
> MANUAL: 수동 새로 고침입니다.
>
> ON SCHEDULE: 예약된 일정에 따른 새로 고침입니다.
>
> ON COMMIT: 기본 테이블의 데이터 변경으로 구체화된 뷰의 새로 고침이 트리거됩니다.

**5. `<refresh_unit>`**

> 주기적 새로 고침의 시간 단위입니다. 현재 지원되는 단위는 MINUTE, HOUR, DAY, WEEK입니다.

**6. `<partition_col>`**

> PARTITION BY를 지정하지 않으면 기본적으로 파티션이 하나만 생성됩니다.
>
> 파티션 필드를 지정하면 해당 필드가 어느 기본 테이블에서 왔는지 자동으로 추론하고 기본 테이블과 동기화합니다. 현재 내부 테이블과 Hive 테이블을 지원합니다. 내부 테이블의 경우 파티션 필드는 하나만 허용됩니다.
>
> 구체화된 뷰는 파티션 롤업을 통해 파티션 수를 줄일 수도 있습니다. 현재 파티션 롤업 함수로 `date_trunc`를 지원합니다.

**7. `<partition_unit>`**

> 파티션 롤업의 집계 단위입니다. 현재 지원되는 단위는 HOUR, DAY, WEEK, QUARTER, MONTH, YEAR입니다.

**8. `<start_time>`**

> 예약된 시작 시간은 미래 시점, 즉 현재 시간보다 이후여야 합니다.

**9. `<table_property>`**

내부 테이블에서 사용하는 속성 대부분은 구체화된 뷰에서도 사용할 수 있습니다. 구체화된 뷰 전용 속성도 있으며, 아래 표에 나열되어 있습니다.

| 속성 이름                    | 설명                                                  |
| -------------------------------- | ------------------------------------------------------------ |
| grace_period                     | 쿼리 재작성 시 구체화된 뷰 데이터에 허용되는 최대 지연 시간(초)입니다. 구체화된 뷰의 파티션 A와 기본 테이블의 데이터가 일치하지 않고, 파티션 A의 마지막 새로 고침 시간이 10:15:00이며 현재 시스템 시간이 10:15:08이면 해당 파티션은 투명한 재작성에 사용되지 않습니다. 그러나 `grace_period`를 10으로 설정하면 해당 파티션이 투명한 재작성에 사용됩니다. |
| excluded_trigger_tables          | 데이터 새로 고침 시 무시할 테이블 이름을 쉼표로 구분하여 지정합니다. 예: `table1,table2`. |
| refresh_partition_num            | 단일 INSERT 문으로 새로 고치는 파티션 수이며, 기본값은 1입니다. 구체화된 뷰를 새로 고칠 때 먼저 새로 고칠 파티션 목록을 계산한 다음, 이를 여러 INSERT 문으로 나누어 순차적으로 실행합니다. INSERT 문이 실패하면 전체 작업이 중지됩니다. 구체화된 뷰는 단일 INSERT 문의 원자성을 보장하며, 실패한 INSERT는 이미 새로 고침에 성공한 파티션에 영향을 주지 않습니다. |
| workload_group                   | 구체화된 뷰가 새로 고침 작업을 실행할 때 사용하는 `workload_group`의 이름입니다. 데이터 새로 고침 중 구체화된 뷰가 사용하는 리소스를 제한하여 다른 업무에 영향을 주지 않도록 합니다. `workload_group` 생성 및 사용에 대한 자세한 내용은 [WORKLOAD-GROUP](https://doris.apache.org/zh-CN/docs/dev/admin-manual/workload-management/workload-group) 문서를 참조하세요. |
| ivm_use_full_keys                | 원본 행의 행 식별 키를 IVM의 Unique Key에 추가할지 지정합니다. 기본값은 `false`입니다. 복합 행 식별자의 해시 충돌 위험을 줄이지만 키 너비와 스토리지 오버헤드가 증가합니다. IVM을 생성할 때만 설정할 수 있습니다. |
| ivm_partition_window_limit       | IVM이 지정된 기본 테이블의 마지막 N개 파티션만 유지하도록 제한합니다. `table:N` 형식으로 지정하며 여러 테이블은 쉼표로 구분합니다. 범위 밖의 증분 변경은 무시되므로 데이터 손실이 발생할 수 있는 설정입니다. `COMPLETE`는 여전히 기본 테이블 전체를 읽습니다. |
| partition_sync_limit             | 기본 테이블의 파티션 필드가 시간 유형인 경우 이 속성을 `partition_sync_time_unit`과 함께 사용하여 기본 테이블과 동기화할 파티션 범위를 설정할 수 있습니다. 예를 들어 이 값을 2로 설정하고 `partition_sync_time_unit`을 `MONTH`로 설정하면 기본 테이블의 최근 2개월에 해당하는 파티션과 데이터만 동기화됩니다. 최솟값은 `1`입니다. 시간이 지나면 구체화된 뷰는 새로 고침할 때마다 파티션을 자동으로 추가하고 제거합니다. 예를 들어 구체화된 뷰에 현재 2월과 3월의 데이터가 있다면, 다음 달에는 2월 데이터를 자동으로 제거하고 4월 데이터를 추가합니다. |
| partition_sync_time_unit         | 파티션 새로 고침의 시간 단위로 DAY/MONTH/YEAR를 지원합니다. 기본값은 DAY입니다. |
| partition_date_format            | 기본 테이블의 파티션 필드가 문자열 유형이고 `partition_sync_limit` 기능을 사용하려면, `partition_date_format` 설정에 따라 파티션 시간을 파싱하도록 날짜 형식을 설정할 수 있습니다. |
| enable_nondeterministic_function | 구체화된 뷰 정의 SQL에 current_date(), now(), random() 등과 같은 비결정적 함수를 포함할 수 있는지 지정합니다. true로 설정하면 허용하고, 그렇지 않으면 허용하지 않습니다. 기본적으로 허용하지 않습니다. |
| use_for_rewrite                  | 이 구체화된 뷰를 투명한 재작성에 사용할지 지정합니다. false로 설정하면 투명한 재작성에 사용하지 않습니다. 기본값은 true입니다. 데이터 모델링 시 구체화된 뷰를 직접 쿼리하는 용도로만 사용한다면, 이 속성을 설정하여 구체화된 뷰가 투명한 재작성에 사용되지 않도록 함으로써 쿼리 응답 속도를 높일 수 있습니다. |

:::caution 참고
Apache Doris 2.1.10 이전에는 DISTRIBUTED BY 절이 필수이며, 생략하면 오류가 발생합니다.
Apache Doris 2.1.10부터는 지정하지 않으면 기본 분산 방식이 RANDOM이 됩니다.
:::

:::caution 참고
Apache Doris 2.1.10/3.0.6 이전에는 excluded_trigger_tables 속성에 기본 테이블 이름만 지정할 수 있었습니다.
이 버전부터는 Catalog와 데이터베이스를 포함한 정규화된 테이블 이름도 지원합니다(예: internal.db1.table1).
:::

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한   | 객체      | 참고                                                        |
| ----------- | ----------- | ------------------------------------------------------------ |
| CREATE_PRIV | 데이터베이스    |                                                              |
| SELECT_PRIV | 테이블, 뷰 | `<query>`에서 쿼리하는 테이블 또는 뷰에 대한 SELECT_PRIV 권한이 필요합니다. |

## 참고 사항 {#notes}

- 구체화된 뷰의 DML 및 DDL 제한 사항:

  구체화된 뷰의 열은 구체화된 뷰 정의 SQL에서 결정되므로 열 유형 수정, 열 추가 또는 삭제와 같은 스키마 변경 작업을 지원하지 않습니다.

  구체화된 뷰는 수동 insert into 또는 insert overwrite 작업을 지원하지 않습니다.

- 파티션으로 나뉜 구체화된 뷰의 생성 조건:

  > 파티션별 증분 업데이트를 수행하려면 구체화된 뷰의 SQL 정의와 파티션 필드가 다음 조건을 충족해야 합니다.
  >
  > 1. 구체화된 뷰에서 사용하는 기본 테이블 중 하나 이상이 파티션으로 나뉜 테이블이어야 합니다.
  > 2. 구체화된 뷰에서 사용하는 파티션으로 나뉜 기본 테이블은 List 또는 Range 파티셔닝 방식을 사용해야 합니다.
  > 3. 구체화된 뷰 정의 SQL의 Partition By 절에는 파티션 필드가 하나만 있어야 합니다.
  > 4. 구체화된 뷰 SQL의 Partition By 절에 있는 파티션 필드는 Select 절 뒤에 나타나야 합니다.
  > 5. 구체화된 뷰 정의 SQL에서 Group By를 사용하면 파티션 필드가 Group By 절 뒤에 나타나야 합니다.
  > 6. 구체화된 뷰 정의 SQL에서 Window 함수를 사용하면 파티션 필드가 Partition By 절 뒤에 나타나야 합니다.
  > 7. 데이터 변경은 파티션으로 나뉜 테이블에서 발생해야 합니다. 파티션이 없는 테이블에서 발생하면 구체화된 뷰를 전체 빌드해야 합니다.
  > 8. 구체화된 뷰가 Join에서 NULL이 생성되는 쪽의 필드를 파티션 필드로 사용하면 파티션별 증분 업데이트를 수행할 수 없습니다. 예를 들어 LEFT OUTER JOIN의 경우 파티션 필드는 반드시 왼쪽에 있어야 합니다.

- IVM 생성 조건

  `REFRESH INCREMENTAL`을 사용하려면 기본 테이블에서 changelog가 활성화되어 있어야 하며 구체화된 뷰 정의 SQL이 IVM 지원 범위에 포함되어야 합니다. `INCREMENTAL`을 명시적으로 지정한 경우 지원되지 않는 정의를 사용하면 생성이 실패합니다. 기본 테이블 모델과 FE 스위치에 대해서는 [IVM 사전 요구 사항](../../../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view#prerequisites)을, 쿼리 연산자와 집계 함수에 대해서는 [IVM 지원 쿼리](../../../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view#supported-queries)를 참조하세요.

## 예제 {#examples}

### IVM 생성 {#creating-an-ivm}

    ```sql
    CREATE MATERIALIZED VIEW orders_by_status
    BUILD DEFERRED
    REFRESH INCREMENTAL FALLBACK ON MANUAL
    DISTRIBUTED BY RANDOM BUCKETS 1
    AS
    SELECT order_status, COUNT(*) AS order_count, SUM(amount) AS total_amount
    FROM orders
    GROUP BY order_status;
    ```

    Run `REFRESH MATERIALIZED VIEW orders_by_status COMPLETE` once after creation to build the full baseline, then run incremental refreshes.

1. 파티션이 없는 구체화된 뷰

```sql

CREATE MATERIALIZED VIEW complete_mv (
orderdate COMMENT 'Order date',
orderkey COMMENT 'Order key',
partkey COMMENT 'Part key'
)
BUILD IMMEDIATE
REFRESH AUTO
ON SCHEDULE EVERY 1 DAY STARTS '2024-12-01 20:30:00'
DISTRIBUTED BY HASH (orderkey) BUCKETS 2
PROPERTIES
("replication_num" = "1")
AS
SELECT
o_orderdate,
l_orderkey,
l_partkey
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey
and l_suppkey = ps_suppkey;
```

2. 파티션으로 나뉜 구체화된 뷰 

아래 예제처럼 파티션 열을 지정하면 시스템이 해당 열이 어느 기본 테이블에서 왔는지 자동으로 식별하고 기본 테이블의 파티션을 동기화합니다. 기본 테이블은 일 단위로 파티션이 나뉘어 있습니다(파티션 열: o_orderdate, 파티션 유형: RANGE). 구체화된 뷰는 DATE_TRUNC 함수를 사용하여 기본 테이블의 파티션을 월 단위로 롤업하므로 월 단위로 파티션이 나뉩니다.
```sql
CREATE TABLE IF NOT EXISTS orders  (
o_orderkey       integer not null,
o_custkey        integer not null,
o_orderstatus    char(1) not null,
o_totalprice     decimalv3(15,2) not null,
o_orderdate      date not null,
o_orderpriority  char(15) not null,  
o_clerk          char(15) not null,
o_shippriority   integer not null,
o_comment        varchar(79) not null
)
DUPLICATE KEY(o_orderkey, o_custkey)
PARTITION BY RANGE(o_orderdate)(
FROM ('2023-10-16') TO ('2023-11-30') INTERVAL 1 DAY
)
DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3
PROPERTIES (
"replication_num" = "3"
);
```

```sql
CREATE MATERIALIZED VIEW partition_mv
BUILD IMMEDIATE
REFRESH AUTO
ON SCHEDULE EVERY 1 DAY STARTS '2024-12-01 20:30:00'
PARTITION BY (DATE_TRUNC(o_orderdate, 'MONTH'))
DISTRIBUTED BY HASH (l_orderkey) BUCKETS 2
PROPERTIES
("replication_num" = "3")
AS
SELECT
o_orderdate,
l_orderkey,
l_partkey
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey
and l_suppkey = ps_suppkey;
```

다음 예제에서는 파티션 열에 date_trunc가 아닌 함수를 사용하므로 파티션으로 나뉜 구체화된 뷰를 생성할 수 없습니다. 오류 메시지는 다음과 같습니다: because column to check use invalid implicit expression, invalid expression is min(o_orderdate#4)

```sql
CREATE MATERIALIZED VIEW partition_mv_2
BUILD IMMEDIATE
REFRESH AUTO
ON SCHEDULE EVERY 1 DAY STARTS '2024-12-01 20:30:00'
PARTITION BY (DATE_TRUNC(min_orderdate, 'MONTH'))
DISTRIBUTED BY HASH (l_orderkey) BUCKETS 2
PROPERTIES
("replication_num" = "3")
AS
SELECT
min(o_orderdate) AS min_orderdate,
l_orderkey,
l_partkey
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey
and l_suppkey = ps_suppkey
GROUP BY
o_orderdate,
l_orderkey,
l_partkey;
```

3. 구체화된 뷰의 속성 수정에는 ALTER MATERIALIZED VIEW 문을 사용합니다. 

예:
```sql
ALTER MATERIALIZED VIEW partition_mv
SET (
"grace_period" = "10",
"excluded_trigger_tables" = "lineitem,partsupp"
);
```

4. 구체화된 뷰의 새로 고침 모드 변경에는 ALTER MATERIALIZED VIEW 문을 사용합니다. 
예:

```sql
ALTER MATERIALIZED VIEW partition_mv REFRESH COMPLETE;
After running SHOW CREATE MATERIALIZED VIEW partition_mv;, you can see that the refresh mode has been changed to COMPLETE.
```
