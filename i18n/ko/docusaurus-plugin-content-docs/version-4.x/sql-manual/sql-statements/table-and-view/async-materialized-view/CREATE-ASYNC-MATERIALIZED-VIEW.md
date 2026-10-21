---
{
    "title": "CREATE ASYNC MATERIALIZED VIEW",
    "language": "ko",
    "description": "비동기 구체화된 뷰를 생성하는 문입니다. 열 이름과 타입은 구체화된 뷰의 SQL 문에서 파생됩니다."
}
---

## 설명 {#description}

비동기 구체화된 뷰를 생성하는 문입니다. 열 이름과 타입은 구체화된 뷰의 SQL 문에서 파생됩니다. 열 이름은 직접 지정할 수 있지만, 열 타입은 정의할 수 없습니다.

## 구문 {#syntax}


```sql
CREATE MATERIALIZED VIEW 
[ IF NOT EXISTS ] <materialized_view_name>
    [ (<columns_definition>) ] 
    [ BUILD <build_mode> ]
    [ REFRESH <refresh_method> [<refresh_trigger>]]
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

각 항목의 정의는 다음과 같습니다:


```sql
columns_definition
  : -- Column definition
    <col_name> 
      [ COMMENT '<col_comment>' ]
refresh_trigger
  : ON MANUAL
  | ON SCHEDULE EVERY <int_value> <refresh_unit> [ STARTS '<start_time>']
  | ON COMMIT
```

## 필수 매개변수 {#required-parameters}

**1. `<materialized_view_name>`**

> 구체화된 뷰의 식별자(이름)를 지정합니다. 이 식별자는 테이블이 생성되는 데이터베이스 내에서 고유해야 합니다.
>
> 식별자는 문자로 시작해야 하며(Unicode 이름 지원이 활성화되어 있으면 모든 언어의 문자를 사용할 수 있음), 식별자 문자열 전체를 백틱으로 감싸지 않는 한 공백이나 특수 문자를 포함할 수 없습니다(예: `My Object`).
>
> 식별자로 예약 키워드를 사용할 수 없습니다.
>
> 자세한 내용은 식별자 및 예약 키워드 관련 요구 사항을 참조하세요.

**2. `<query>`**

> 구체화된 뷰를 생성할 때 필요한 매개변수입니다. 데이터를 채우는 SELECT 문을 지정합니다.

## 선택적 매개변수 {#optional-parameters}

**1. `<key_cols>`**

> 테이블의 키 열입니다. Doris에서 키 열은 테이블의 처음 K개 열이어야 합니다. 키 제약 사항과 키 열을 선택하는 방법에 대한 자세한 내용은 "데이터 모델" 장의 해당 절을 참조하세요.

**2. `<build_mode>`**

> 새로 고침 시점: 구체화된 뷰를 생성한 직후에 새로 고칠지 여부를 지정합니다.
>
> IMMEDIATE: 즉시 새로 고칩니다. 기본값은 IMMEDIATE입니다.
>
> DEFERRED: 새로 고침을 지연합니다.

**3. `<refresh_method>`**

> 새로 고침 방식:
>
> COMPLETE: 모든 파티션을 새로 고칩니다.
>
> AUTO: 증분 새로 고침을 시도하여 구체화된 뷰를 마지막으로 새로 고친 이후 변경된 파티션만 새로 고칩니다. 증분 새로 고침이 불가능하면 모든 파티션을 새로 고칩니다.

:::caution 참고
파티션이 있는 구체화된 뷰에서 COMPLETE 새로 고침 모드를 사용하면 모든 파티션의 데이터를 전체 새로 고침하므로, 사실상 파티션이 없는 구체화된 뷰처럼 동작합니다.
:::

**4. `<refresh_trigger>`**

> 트리거 방식:
>
> MANUAL: 수동으로 새로 고칩니다.
>
> ON SCHEDULE: 일정에 따라 새로 고칩니다.
>
> ON COMMIT: 기본 테이블의 데이터가 변경되면 구체화된 뷰의 새로 고침을 트리거합니다.

**5. `<refresh_unit>`**

> 주기적 새로 고침의 시간 단위입니다. 현재 지원되는 단위는 MINUTE, HOUR, DAY, WEEK입니다.

**6. `<partition_col>`**

> PARTITION BY를 지정하지 않으면 기본적으로 파티션이 하나만 생성됩니다.
>
> 파티션 필드를 지정하면 해당 필드가 어느 기본 테이블에서 왔는지 자동으로 추론하고 기본 테이블과 동기화합니다(현재 내부 테이블과 Hive 테이블 지원). 내부 테이블의 경우 파티션 필드는 하나만 허용됩니다.
>
> 구체화된 뷰는 파티션 롤업을 통해 파티션 수를 줄일 수도 있습니다. 현재 파티션 롤업 함수로 `date_trunc`를 지원합니다.

**7. `<partition_unit>`**

> 파티션 롤업의 집계 단위입니다. 현재 지원되는 단위는 HOUR, DAY, WEEK, QUARTER, MONTH, YEAR입니다.

**8. `<start_time>`**

> 예약된 시작 시간은 현재 시간보다 이후인 미래 시점이어야 합니다.

**9. `<table_property>`**

내부 테이블에서 사용하는 속성 대부분을 구체화된 뷰에서도 사용할 수 있습니다. 구체화된 뷰에만 적용되는 속성도 있으며, 아래에 나열되어 있습니다:

| 속성 이름                    | 설명                                                  |
| -------------------------------- | ------------------------------------------------------------ |
| grace_period                     | 쿼리 재작성 시 구체화된 뷰 데이터에 허용되는 최대 지연 시간(초)입니다. 구체화된 뷰의 파티션 A와 기본 테이블의 데이터가 일치하지 않고, 파티션 A의 마지막 새로 고침 시간이 10:15:00이며 현재 시스템 시간이 10:15:08이면 해당 파티션은 투명 재작성에 사용되지 않습니다. 하지만 `grace_period`를 10으로 설정하면 해당 파티션이 투명 재작성에 사용됩니다. |
| excluded_trigger_tables          | 데이터 새로 고침 시 무시할 테이블 이름을 쉼표로 구분하여 지정합니다. 예: `table1,table2`. |
| refresh_partition_num            | 단일 INSERT 문으로 새로 고치는 파티션 수이며, 기본값은 1입니다. 구체화된 뷰를 새로 고칠 때 먼저 새로 고칠 파티션 목록을 계산한 다음, 이를 여러 INSERT 문으로 나누어 순차적으로 실행합니다. INSERT 문이 실패하면 작업 전체가 중지됩니다. 구체화된 뷰는 단일 INSERT 문의 원자성을 보장하며, INSERT 문이 실패해도 이미 새로 고침에 성공한 파티션에는 영향을 주지 않습니다. |
| workload_group                   | 구체화된 뷰가 새로 고침 작업을 실행할 때 사용하는 `workload_group`의 이름입니다. 데이터 새로 고침 중 구체화된 뷰가 사용하는 리소스를 제한하여 다른 업무에 영향을 주지 않도록 합니다. `workload_group` 생성 및 사용에 대한 자세한 내용은 [WORKLOAD-GROUP](https://doris.apache.org/zh-CN/docs/dev/admin-manual/workload-management/workload-group) 문서를 참조하세요. |
| partition_sync_limit             | 기본 테이블의 파티션 필드가 time 타입인 경우, 이 속성을 `partition_sync_time_unit`과 함께 사용하여 기본 테이블과 동기화할 파티션 범위를 설정할 수 있습니다. 예를 들어 이 값을 2로 설정하고 `partition_sync_time_unit`을 `MONTH`로 설정하면 기본 테이블의 최근 2개월에 해당하는 파티션과 데이터만 동기화됩니다. 최솟값은 `1`입니다. 시간이 지나면 구체화된 뷰는 새로 고침할 때마다 파티션을 자동으로 추가하고 제거합니다. 예를 들어 현재 구체화된 뷰에 2월과 3월 데이터가 있으면, 다음 달에는 2월 데이터를 자동으로 제거하고 4월 데이터를 추가합니다. |
| partition_sync_time_unit         | 파티션 새로 고침의 시간 단위로, DAY/MONTH/YEAR를 지원합니다(기본값은 DAY). |
| partition_date_format            | 기본 테이블의 파티션 필드가 string 타입이고 `partition_sync_limit` 기능을 사용하려는 경우, 날짜 형식을 설정하여 `partition_date_format` 설정에 따라 파티션 시간을 파싱할 수 있습니다. |
| enable_nondeterministic_function | 구체화된 뷰 정의 SQL에 current_date(), now(), random() 등의 비결정적 함수를 포함할 수 있는지 여부입니다. true로 설정하면 허용하고, 그렇지 않으면 허용하지 않습니다. 기본적으로 허용하지 않습니다. |
| use_for_rewrite                  | 이 구체화된 뷰가 투명 재작성에 참여하는지 여부를 나타냅니다. false로 설정하면 투명 재작성에 참여하지 않습니다. 기본값은 true입니다. 데이터 모델링 시 구체화된 뷰를 직접 쿼리하는 용도로만 사용한다면, 이 속성을 설정하여 구체화된 뷰가 투명 재작성에 참여하지 않도록 함으로써 쿼리 응답 속도를 높일 수 있습니다. |
| compute_group | 4.1.5부터 지원됩니다. 선택적 문자열 속성이며 기본적으로 생략됩니다. 컴퓨팅과 스토리지가 분리된 모드에서만 지원됩니다. 새로 고침에 사용할 Compute Group을 명시적으로 바인딩하며, 세션 또는 수동 새로 고침에서 선택한 설정보다 우선합니다. 생성 및 변경 시 작업을 수행하는 사용자의 `USAGE` 권한을 확인하고, 새로 고침 시 그룹이 존재하는지 확인합니다. 현재 새로 고침 단계에서는 생성자의 권한을 다시 확인하지 않으므로, 생성자의 `USAGE` 권한만 취소해도 새로 고침은 중단되지 않습니다. `DEFAULT`는 예약된 값이므로 사용할 수 없습니다. `ALTER MATERIALIZED VIEW ... SET ("compute_group" = "cg_refresh")`로 바인딩을 변경합니다. |

:::caution 참고
Apache Doris 2.1.10 이전에는 DISTRIBUTED BY 절이 필수이며, 생략하면 오류가 발생합니다.
Apache Doris 2.1.10부터는 지정하지 않으면 기본 분산 방식이 RANDOM이 됩니다.
:::

:::caution 참고
Apache Doris 2.1.10/3.0.6 이전에는 excluded_trigger_tables 속성에 기본 테이블 이름만 지정할 수 있었습니다.
해당 버전부터는 Catalog와 데이터베이스를 포함하는 정규화된 테이블 이름을 지원합니다(예: internal.db1.table1).
:::

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자에게는 최소한 다음 권한이 있어야 합니다:

| 권한   | 객체      | 참고 사항                                                        |
| ----------- | ----------- | ------------------------------------------------------------ |
| CREATE_PRIV | 데이터베이스    |                                                              |
| SELECT_PRIV | 테이블, 뷰 | `<query>`에서 쿼리하는 테이블 또는 뷰에 대한 SELECT_PRIV 권한이 필요합니다 |

## 참고 사항 {#notes}

- 구체화된 뷰의 DML 및 DDL 제한 사항:

  구체화된 뷰의 열은 구체화된 뷰 정의 SQL에서 파생되므로, 열 타입 수정이나 열 추가 및 삭제와 같은 스키마 변경 작업을 지원하지 않습니다.

  구체화된 뷰는 수동 insert into 또는 insert overwrite 작업을 지원하지 않습니다.

- 파티션이 있는 구체화된 뷰를 생성하기 위한 조건:

  > 파티션 단위 증분 업데이트를 수행하려면 구체화된 뷰의 SQL 정의와 파티션 필드가 다음 조건을 충족해야 합니다:
  >
  > 1. 구체화된 뷰에서 사용하는 기본 테이블 중 하나 이상이 파티션 테이블이어야 합니다.
  > 2. 구체화된 뷰에서 사용하는 파티션 기본 테이블은 List 또는 Range 파티셔닝 전략을 사용해야 합니다.
  > 3. 구체화된 뷰 정의 SQL의 Partition By 절에는 파티션 필드가 하나만 있어야 합니다.
  > 4. 구체화된 뷰 SQL의 Partition By 절에 있는 파티션 필드는 Select 절 뒤에 나와야 합니다.
  > 5. 구체화된 뷰 정의 SQL에서 Group By를 사용하는 경우 파티션 필드는 Group By 절 뒤에 나와야 합니다.
  > 6. 구체화된 뷰 정의 SQL에서 Window 함수를 사용하는 경우 파티션 필드는 Partition By 절 뒤에 나와야 합니다.
  > 7. 데이터 변경은 파티션 테이블에서 발생해야 합니다. 파티션이 없는 테이블에서 데이터가 변경되면 구체화된 뷰를 전체 빌드해야 합니다.
  > 8. 구체화된 뷰가 Join에서 NULL이 생성되는 쪽의 필드를 파티션 필드로 사용하면 파티션 단위 증분 업데이트를 수행할 수 없습니다. 예를 들어 LEFT OUTER JOIN의 경우 파티션 필드는 반드시 왼쪽에 있어야 합니다.


## 예제 {#examples}

준비: 아래 예제에서는 표준 TPC-H 스타일의 기본 테이블 `orders`, `lineitem`, `partsupp`를 사용하여 구체화된 뷰를 생성합니다. 이 테이블들을 한 번 생성하세요(파티션이 있는 `orders`는 예제 2에서도 재사용되며, 예제 2에서 나중에 실행하는 `CREATE TABLE IF NOT EXISTS orders`는 아무 작업도 수행하지 않습니다):

```sql
CREATE TABLE IF NOT EXISTS orders (
  o_orderkey      INT NOT NULL,
  o_custkey       INT NOT NULL,
  o_orderstatus   CHAR(1) NOT NULL,
  o_totalprice    DECIMALV3(15,2) NOT NULL,
  o_orderdate     DATE NOT NULL,
  o_orderpriority CHAR(15) NOT NULL,
  o_clerk         CHAR(15) NOT NULL,
  o_shippriority  INT NOT NULL,
  o_comment       VARCHAR(79) NOT NULL
)
DUPLICATE KEY (o_orderkey, o_custkey)
PARTITION BY RANGE (o_orderdate) (FROM ('2023-10-16') TO ('2023-11-30') INTERVAL 1 DAY)
DISTRIBUTED BY HASH (o_orderkey) BUCKETS 1
PROPERTIES ("replication_num" = "1");

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

CREATE TABLE IF NOT EXISTS partsupp (
  ps_partkey    INT NOT NULL,
  ps_suppkey    INT NOT NULL,
  ps_availqty   INT NOT NULL,
  ps_supplycost DECIMAL(15,2) NOT NULL,
  ps_comment    VARCHAR(199) NOT NULL
)
DUPLICATE KEY (ps_partkey, ps_suppkey)
DISTRIBUTED BY HASH (ps_partkey) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

1. 파티션이 없는 구체화된 뷰

```sql

CREATE MATERIALIZED VIEW complete_mv (
orderdate COMMENT 'Order date',
orderkey COMMENT 'Order key',
partkey COMMENT 'Part key'
)
BUILD IMMEDIATE
REFRESH AUTO
ON SCHEDULE EVERY 1 DAY STARTS '2099-01-01 20:30:00'
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

2. 파티션이 있는 구체화된 뷰 

아래와 같이 파티션 열을 지정하면 시스템이 해당 열이 어느 기본 테이블에서 왔는지 자동으로 식별하고 기본 테이블의 파티션을 동기화합니다. 기본 테이블은 일 단위로 파티셔닝됩니다(파티션 열: o_orderdate, 파티션 타입: RANGE). 구체화된 뷰는 월 단위로 파티셔닝되며, DATE_TRUNC 함수를 사용하여 기본 테이블의 파티션을 월 단위로 롤업합니다.
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
ON SCHEDULE EVERY 1 DAY STARTS '2099-01-01 20:30:00'
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

다음 예제에서는 파티션 열에 date_trunc 이외의 함수를 사용하므로 파티션이 있는 구체화된 뷰를 생성할 수 없습니다. 오류 메시지는 다음과 같습니다: because column to check use invalid implicit expression, invalid expression is min(o_orderdate#4)

```sql
CREATE MATERIALIZED VIEW partition_mv_2
BUILD IMMEDIATE
REFRESH AUTO
ON SCHEDULE EVERY 1 DAY STARTS '2099-01-01 20:30:00'
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

3. 구체화된 뷰의 속성 변경에는 ALTER MATERIALIZED VIEW 문을 사용합니다. 

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
