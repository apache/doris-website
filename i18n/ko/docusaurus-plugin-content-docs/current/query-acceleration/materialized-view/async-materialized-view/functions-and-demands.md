---
{
    "title": "비동기 구체화된 뷰 관리 및 쿼리",
    "language": "ko",
    "description": "Doris에서 비동기 구체화된 뷰를 생성하고 직접 쿼리와 투명한 재작성을 통해 쿼리를 가속하는 방법을 설명합니다. 새로 고침 정책, 파티션 구성 및 운영 방법을 다룹니다.",
    "keywords": ["Doris 비동기 구체화된 뷰", "CREATE MATERIALIZED VIEW", "투명한 쿼리 재작성", "구체화된 뷰 새로 고침", "파티션으로 나뉜 구체화된 뷰", "중첩 구체화된 뷰"]
}
---

<!-- Knowledge type: Operations manual + Reference documentation -->
<!-- Applicable scenarios: Use Doris async materialized views to accelerate queries, build data models, and operate and manage materialized views -->

비동기 구체화된 뷰는 Doris가 제공하는 사전 계산 기반의 가속 기능입니다. 이 문서는 사용자의 실제 작업 흐름에 따라 다음 주제를 순서대로 설명합니다.

- **구체화된 뷰 생성**: 구문, 새로 고침 정책 및 파티션 구성.
- **구체화된 뷰 쿼리**: 직접 쿼리 및 투명한 쿼리 재작성.
- **구체화된 뷰 운영**: 수정, 삭제, 모니터링 및 관련 매개변수 구성.

읽기 전에 다음 사항을 확인하세요.

- 비동기 구체화된 뷰의 기본 개념과 적용 시나리오를 이해하고 있어야 합니다.
- 새 옵티마이저가 활성화되어 있어야 합니다(`enable_nereids_planner = true`).
- 기본적인 테이블 생성 및 SQL 구문에 익숙해야 합니다.

---

## 1. 구체화된 뷰 생성 {#1-create-materialized-views}

<!-- Knowledge type: Operations manual -->
<!-- Applicable scenarios: Building an async materialized view for the first time -->

### 1.1 권한 {#11-permissions}

구체화된 뷰를 생성하려면 다음 두 가지 유형의 권한이 필요합니다.

- **구체화된 뷰 생성 권한**: 테이블 생성 권한과 동일합니다.
- **베이스 테이블 쿼리 권한**: SELECT 권한과 동일합니다. 즉, 구체화된 뷰 정의 SQL에서 참조하는 베이스 테이블에 대한 쿼리 권한입니다.

### 1.2 생성 구문 {#12-creation-syntax}

비동기 구체화된 뷰의 전체 생성 구문은 다음과 같습니다.

```sql
CREATE MATERIALIZED VIEW
[ IF NOT EXISTS ] <materialized_view_name>
    [ (<columns_definition>) ]
    [ BUILD <build_mode> ]
    [ REFRESH <refresh_method> [FALLBACK] [refresh_trigger]]
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

### 1.3 새로 고침 구성 {#13-refresh-configuration}

새로 고침 구성은 **새로 고침 시점(build_mode)**, **새로 고침 방식(refresh_method)**, **트리거 방식(refresh_trigger)**이라는 세 가지 범주의 매개변수로 구성됩니다.

#### 1.3.1 매개변수 개요 {#131-parameter-overview}

| 범주 | 값 | 설명 |
| -------- | ------------- | -------------------------------------------------------------------------- |
| 새로 고침 시점 | `IMMEDIATE`   | 생성 직후 새로 고칩니다(기본값). |
| 새로 고침 시점 | `DEFERRED`    | 생성 후 새로 고침을 나중으로 미룹니다. |
| 새로 고침 방식 | `COMPLETE`    | 전체 새로 고침으로, 모든 파티션을 새로 고칩니다. |
| 새로 고침 방식 | `PARTITIONS`  | 변경된 구체화된 뷰 파티션을 다시 계산합니다. |
| 새로 고침 방식 | `INCREMENTAL` | Incremental View Maintenance (IVM)를 사용하여 행 수준의 변경 사항을 처리합니다. |
| 새로 고침 방식 | `AUTO`        | Doris가 IVM, 파티션 새로 고침 또는 전체 새로 고침을 자동으로 선택합니다. |
| 트리거 방식 | `ON MANUAL`   | 사용자가 SQL 문을 통해 수동으로 트리거합니다. |
| 트리거 방식 | `ON SCHEDULE` | 지정한 간격으로 주기적으로 트리거합니다. |
| 트리거 방식 | `ON COMMIT`   | 베이스 테이블의 데이터가 변경되면 자동으로 트리거합니다(Apache Doris 2.1.4부터 지원). |

#### 1.3.2 ON MANUAL: 수동 트리거 {#132-on-manual-manual-trigger}

SQL 문으로 구체화된 뷰의 새로 고침을 트리거할 때는 생성 시 정의한 새로 고침 방식을 재정의할 수 있습니다.

**전략 1**: IVM을 사용하여 두 번의 새로 고침 사이에 베이스 테이블에서 발생한 행 수준의 변경 사항을 처리합니다.

```sql
REFRESH MATERIALIZED VIEW mvName INCREMENTAL FALLBACK;
```

`FALLBACK`을 지정하면 IVM을 안전하게 실행할 수 없을 때 Doris가 파티션 새로 고침이나 전체 새로 고침으로 전환할 수 있습니다. `FALLBACK` 없이 엄격한 증분 새로 고침을 수행하면 즉시 실패합니다. IVM의 사전 요구 사항, 지원 범위 및 폴백 규칙은 [Incremental View Maintenance (IVM)](incremental-materialized-view)를 참조하세요.

**전략 2**: Doris가 사용 가능한 새로 고침 방식을 자동으로 선택하도록 합니다.

```sql
REFRESH MATERIALIZED VIEW mvName AUTO;
```

:::tip 팁
- 구체화된 뷰 정의 SQL에서 참조하는 베이스 테이블이 JDBC 테이블이면 Doris가 테이블 데이터의 변경을 감지할 수 없으므로 새로 고칠 때 `COMPLETE`를 지정해야 합니다. 그렇지 않으면 베이스 테이블에는 데이터가 있지만 구체화된 뷰에는 데이터가 없는 상황이 발생할 수 있습니다.
- 현재 Doris는 내부 테이블과 Hive 데이터 소스 테이블의 데이터 변경만 감지할 수 있습니다. 다른 데이터 소스에 대한 지원은 점진적으로 추가되고 있습니다.
:::

**전략 3**: 베이스 테이블 파티션의 데이터 변경 검사를 건너뛰고 구체화된 뷰의 모든 파티션을 바로 새로 고칩니다.

```sql
REFRESH MATERIALIZED VIEW mvName COMPLETE;
```

**전략 4**: 지정한 파티션만 새로 고칩니다.

```sql
REFRESH MATERIALIZED VIEW mvName partitions(partitionName1, partitionName2);
```

:::tip 팁
- `partitionName`은 `SHOW PARTITIONS FROM mvName`에서 확인할 수 있습니다.
- Hive의 베이스 테이블 파티션 데이터 변경 감지는 버전 2.1.3부터 지원됩니다. 다른 외부 테이블은 아직 지원되지 않으며, 내부 테이블은 항상 지원됩니다.
:::

#### 1.3.3 ON SCHEDULE: 주기적 트리거 {#133-on-schedule-periodic-trigger}

생성 문에서 새로 고침 간격을 지정합니다. `refreshUnit`에는 `minute`, `hour`, `day`, `week` 등을 사용할 수 있습니다.

**예제 1**: 전체 새로 고침(`REFRESH COMPLETE`)으로, 10시간마다 모든 파티션을 새로 고칩니다.

```sql
CREATE MATERIALIZED VIEW mv_6
REFRESH COMPLETE ON SCHEDULE EVERY 10 hour
AS
SELECT * FROM lineitem;
```

**예제 2**: 가능하면 증분 새로 고침(`REFRESH AUTO`)을 사용하며, 10시간마다 새로 고칩니다. 데이터가 변경된 파티션만 새로 고치고, 증분 새로 고침이 불가능하면 전체 새로 고침으로 전환합니다.

```sql
CREATE MATERIALIZED VIEW mv_7
REFRESH AUTO ON SCHEDULE EVERY 10 hour
PARTITION BY (l_shipdate)
AS
SELECT * FROM lineitem;
```

:::tip 팁
버전 2.1.3부터 Doris는 Hive 테이블에서 새로 고침이 필요한 파티션을 자동으로 계산할 수 있습니다.
:::

#### 1.3.4 ON COMMIT: 자동 트리거 {#134-on-commit-automatic-trigger}

:::tip 팁
이 기능은 Apache Doris 2.1.4부터 지원됩니다.
:::

베이스 테이블의 데이터가 변경되면 해당 구체화된 뷰의 새로 고침이 자동으로 트리거됩니다. 새로 고치는 파티션의 범위는 주기적 트리거와 동일합니다.

```sql
CREATE MATERIALIZED VIEW mv_8
REFRESH AUTO ON COMMIT
PARTITION BY (l_shipdate)
AS
SELECT * FROM lineitem;
```

파티션 `t1`의 데이터가 베이스 테이블 `lineitem`에서 변경되면, 구체화된 뷰의 해당 파티션 새로 고침이 자동으로 트리거됩니다.

:::caution 주의
베이스 테이블의 데이터가 자주 변경되면 새로 고침 태스크가 빈번하게 생성되어 리소스를 과도하게 소비하므로 이 트리거 방식은 권장하지 않습니다.
:::

자세한 내용은 [REFRESH MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/REFRESH-MATERIALIZED-VIEW)를 참조하세요.

#### 1.3.5 전체 예제 {#135-complete-examples}

다음 전체 예제는 새로 고침 메커니즘을 보여 줍니다. 먼저 베이스 테이블을 생성하고 데이터를 초기화합니다.

```sql
CREATE TABLE IF NOT EXISTS lineitem (
    l_orderkey    integer not null,
    l_partkey     integer not null,
    l_suppkey     integer not null,
    l_linenumber  integer not null,
    l_quantity    decimalv3(15,2) not null,
    l_extendedprice  decimalv3(15,2) not null,
    l_discount    decimalv3(15,2) not null,
    l_tax         decimalv3(15,2) not null,
    l_returnflag  char(1) not null,
    l_linestatus  char(1) not null,
    l_shipdate    date not null,
    l_commitdate  date not null,
    l_receiptdate date not null,
    l_shipinstruct char(25) not null,
    l_shipmode     char(10) not null,
    l_comment      varchar(44) not null
)
DUPLICATE KEY(l_orderkey, l_partkey, l_suppkey, l_linenumber)
PARTITION BY RANGE(l_shipdate)
(FROM ('2023-10-17') TO ('2023-11-01') INTERVAL 1 DAY)
DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3;

INSERT INTO lineitem VALUES
(1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-17', '2023-10-17', '2023-10-17', 'a', 'b', 'yyyyyyyyy'),
(2, 4, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-18', '2023-10-18', '2023-10-18', 'a', 'b', 'yyyyyyyyy'),
(3, 2, 4, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-19', '2023-10-19', '2023-10-19', 'a', 'b', 'yyyyyyyyy');

CREATE TABLE IF NOT EXISTS orders (
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
FROM ('2023-10-17') TO ('2023-11-01') INTERVAL 1 DAY)
DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3;

INSERT INTO orders VALUES
(1, 1, 'o', 9.5, '2023-10-17', 'a', 'b', 1, 'yy'),
(1, 1, 'o', 10.5, '2023-10-18', 'a', 'b', 1, 'yy'),
(2, 1, 'o', 11.5, '2023-10-19', 'a', 'b', 1, 'yy'),
(3, 1, 'o', 12.5, '2023-10-19', 'a', 'b', 1, 'yy');

CREATE TABLE IF NOT EXISTS partsupp (
    ps_partkey     INTEGER NOT NULL,
    ps_suppkey     INTEGER NOT NULL,
    ps_availqty    INTEGER NOT NULL,
    ps_supplycost  DECIMALV3(15,2)  NOT NULL,
    ps_comment     VARCHAR(199) NOT NULL
)
DUPLICATE KEY(ps_partkey, ps_suppkey)
DISTRIBUTED BY HASH(ps_partkey) BUCKETS 3;

INSERT INTO partsupp VALUES
(2, 3, 9, 10.01, 'supply1'),
(4, 3, 10, 11.01, 'supply2'),
(2, 3, 10, 11.01, 'supply3');
```

**예제 1: 즉시 증분 새로 고침 + 수동 트리거**

새로 고침 시점은 생성 직후(`BUILD IMMEDIATE`), 새로 고침 방식은 가능할 경우 증분 새로 고침(`REFRESH AUTO`), 트리거 방식은 수동(`ON MANUAL`)입니다. 파티션으로 나뉘지 않은 전체 구체화된 뷰에는 파티션이 하나뿐이므로 베이스 테이블의 데이터가 변경되면 전체 새로 고침이 트리거됩니다.

```sql
CREATE MATERIALIZED VIEW mv_1_0
BUILD IMMEDIATE
REFRESH AUTO
ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    l_linestatus,
    to_date(o_orderdate) as date_alias,
    o_shippriority
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

**예제 2: 지연된 전체 새로 고침 + 예약된 트리거**

새로 고침 시점은 지연(`BUILD DEFERRED`), 새로 고침 방식은 전체 새로 고침(`REFRESH COMPLETE`)입니다. 첫 새로 고침 시각은 `2024-12-01 20:30:00`이며, 이후에는 하루에 한 번 새로 고칩니다.

:::tip 팁
`STARTS`에 지정한 시각은 현재 시각보다 이후여야 합니다. `BUILD IMMEDIATE`를 지정하면 생성 직후 한 번 새로 고친 다음, `2024-12-01 20:30:00`부터 하루에 한 번 새로 고칩니다.
:::

```sql
CREATE MATERIALIZED VIEW mv_1_1
BUILD DEFERRED
REFRESH COMPLETE
ON SCHEDULE EVERY 1 DAY STARTS '2024-12-01 20:30:00'
PROPERTIES ('replication_num' = '1')
AS
SELECT
    l_linestatus,
    to_date(o_orderdate) as date_alias,
    o_shippriority
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

**예제 3: 즉시 전체 새로 고침 + 자동 트리거**

새로 고침 시점은 즉시(`BUILD IMMEDIATE`), 새로 고침 방식은 전체 새로 고침(`REFRESH COMPLETE`), 트리거 방식은 자동(`ON COMMIT`)입니다. `orders` 또는 `lineitem` 테이블의 데이터가 변경되면 새로 고침이 자동으로 트리거됩니다.

```sql
CREATE MATERIALIZED VIEW mv_1_1
BUILD IMMEDIATE
REFRESH COMPLETE
ON COMMIT
PROPERTIES ('replication_num' = '1')
AS
SELECT
    l_linestatus,
    to_date(o_orderdate) as date_alias,
    o_shippriority
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

### 1.4 파티션 구성 {#14-partition-configuration}

<!-- Knowledge type: Operations manual -->
<!-- Applicable scenarios: Building partitioned materialized views and accelerating partition-grained queries -->

파티션으로 나뉜 구체화된 뷰를 생성할 때는 `PARTITION BY`를 지정해야 합니다. **파티션 열이 참조하는 표현식에는 `date_trunc` 함수와 식별자만 사용할 수 있습니다.**

#### 1.4.1 유효한 파티션 열 예제 {#141-valid-partition-column-example}

파티션 열이 참조하는 열에는 `date_trunc` 함수만 사용됩니다. 파티션으로 나뉜 구체화된 뷰의 새로 고침 방식은 일반적으로 `AUTO`입니다.

```sql
CREATE MATERIALIZED VIEW mv_2_0
BUILD IMMEDIATE
REFRESH AUTO
ON MANUAL
PARTITION BY (order_date_month)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    l_linestatus,
    date_trunc(o_orderdate, 'month') as order_date_month,
    o_shippriority
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

#### 1.4.2 유효하지 않은 파티션 열 예제 {#142-invalid-partition-column-example}

다음 문은 파티션 열에서 `date_add()` 함수를 사용하므로 구체화된 뷰 생성에 실패합니다.

```sql
CREATE MATERIALIZED VIEW mv_2_1
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
PARTITION BY (order_date_month)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    l_linestatus,
    date_trunc(date_add(o_orderdate, INTERVAL 2 DAY), 'month') as order_date_month,
    o_shippriority
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

오류 메시지: `because column to check use invalid implicit expression, invalid expression is days_add(o_orderdate#4, 2)`.

#### 1.4.3 베이스 테이블의 다중 열 파티셔닝 {#143-multi-column-partitioning-of-the-base-table}

현재 다중 열 파티셔닝은 Hive 외부 테이블에 대해서만 지원됩니다. 예를 들어 첫 번째 수준의 파티션이 날짜 기준이고 두 번째 수준의 파티션이 지역 기준이라면, 구체화된 뷰는 어느 수준의 파티션 열이든 자체 파티션 열로 선택할 수 있습니다.

Hive 테이블 생성 문:

```sql
CREATE TABLE hive1 (
    `k1` int)
PARTITIONED BY (
    `year` int,
    `region` string)
STORED AS ORC;

ALTER TABLE hive1 ADD IF NOT EXISTS
PARTITION(year=2020, region="bj")
PARTITION(year=2020, region="sh")
PARTITION(year=2021, region="bj")
PARTITION(year=2021, region="sh")
PARTITION(year=2022, region="bj")
PARTITION(year=2022, region="sh");
```

**시나리오 1: `year`를 파티션 열로 사용합니다.** 구체화된 뷰 `mv_hive`에는 `('2020')`, `('2021')`, `('2022')`라는 세 개의 파티션이 생성됩니다.

```sql
CREATE MATERIALIZED VIEW mv_hive
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (`year`)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT k1, year, region FROM hive1;
```

**시나리오 2: `region`을 파티션 열로 사용합니다.** 구체화된 뷰 `mv_hive2`에는 `('bj')`와 `('sh')`라는 두 개의 파티션이 생성됩니다.

```sql
CREATE MATERIALIZED VIEW mv_hive2
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (`region`)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT k1, year, region FROM hive1;
```

#### 1.4.4 베이스 테이블 파티션의 일부만 사용 {#144-use-only-a-subset-of-base-table-partitions}

적용 시나리오: 베이스 테이블에 파티션이 많지만 구체화된 뷰에는 최근의 자주 사용되는 데이터만 필요한 경우입니다.

베이스 테이블 생성 문:

```sql
CREATE TABLE t1 (
    `k1` INT,
    `k2` DATE NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`k1`)
COMMENT 'OLAP'
PARTITION BY range(`k2`)
(
    PARTITION p26 VALUES [("2024-03-26"),("2024-03-27")),
    PARTITION p27 VALUES [("2024-03-27"),("2024-03-28")),
    PARTITION p28 VALUES [("2024-03-28"),("2024-03-29"))
)
DISTRIBUTED BY HASH(`k1`) BUCKETS 2;
```

구체화된 뷰는 가장 최근 하루의 데이터만 동기화합니다. 현재 시각이 `2024-03-28 xx:xx:xx`이면 구체화된 뷰에는 `[("2024-03-28"),("2024-03-29")]` 파티션 하나만 존재합니다.

```sql
CREATE MATERIALIZED VIEW mv1
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (`k2`)
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES (
    'partition_sync_limit' = '1',
    'partition_sync_time_unit' = 'DAY'
)
AS
SELECT * FROM t1;
```

하루가 지나 시각이 `2024-03-29 xx:xx:xx`가 되면 `t1`에 새 파티션 `[("2024-03-29"),("2024-03-30")]`이 추가됩니다. 구체화된 뷰를 새로 고치면 구체화된 뷰에는 `[("2024-03-29"),("2024-03-30")]` 파티션 하나만 존재합니다.

:::tip 팁
파티션 열이 문자열 유형이면 구체화된 뷰의 `partition_date_format` 속성을 설정할 수 있습니다. 예를 들어 `%Y-%m-%d`로 설정할 수 있습니다.
:::

#### 1.4.5 파티션 롤업 {#145-partition-roll-up}

:::tip 팁
범위 파티셔닝은 Doris 2.1.5부터 지원됩니다.
:::

**적용 시나리오**: 베이스 테이블의 데이터를 집계하면 각 파티션의 데이터 양이 크게 줄어듭니다. 파티션 롤업을 사용하면 구체화된 뷰의 파티션 수를 줄일 수 있습니다.

베이스 테이블 생성 문:

```sql
CREATE TABLE `t1` (
    `k1` LARGEINT NOT NULL,
    `k2` DATE NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`k1`)
COMMENT 'OLAP'
PARTITION BY range(`k2`)
(
    PARTITION p_20200101 VALUES [("2020-01-01"),("2020-01-02")),
    PARTITION p_20200102 VALUES [("2020-01-02"),("2020-01-03")),
    PARTITION p_20200201 VALUES [("2020-02-01"),("2020-02-02"))
)
DISTRIBUTED BY HASH(`k1`) BUCKETS 2;
```

**월 단위 롤업**: 구체화된 뷰에는 `[("2020-01-01","2020-02-01")]`과 `[("2020-02-01","2020-03-01")]`이라는 두 개의 파티션이 포함됩니다.

```sql
CREATE MATERIALIZED VIEW mv_3
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (date_trunc(`k2`, 'month'))
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT * FROM t1;
```

**연 단위 롤업**: 구체화된 뷰에는 `[("2020-01-01","2021-01-01")]` 파티션 하나만 포함됩니다.

```sql
CREATE MATERIALIZED VIEW mv_4
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (date_trunc(`k2`, 'year'))
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT * FROM t1;
```

:::tip 팁
파티션 열이 문자열 유형이면 `partition_date_format` 속성을 설정하여 날짜 형식을 지정할 수 있습니다. 예를 들어 `'%Y-%m-%d'`로 설정할 수 있습니다.
:::

자세한 내용은 [CREATE ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW)를 참조하세요.

#### 1.4.6 다중 소스 파티션 새로 고침 {#146-multi-source-partition-refresh}

**정의**: 비동기 구체화된 뷰는 여러 파티션 추적 테이블을 가질 수 있습니다. 이러한 테이블 중 하나라도 데이터가 변경되면 구체화된 뷰가 전체 새로 고침 대신 파티션 새로 고침을 수행합니다.

**제한 사항**:

- `INNER JOIN` 또는 `UNION`(`UNION ALL` 포함)을 기반으로 생성한 구체화된 뷰만 지원됩니다.
- 구체화된 뷰에서 `UNION`을 사용하는 경우, 합집합에 참여하는 모든 부분이 파티션 변경 추적(PCT)을 지원해야 합니다. 예를 들어 구체화된 뷰가 `q1 union all q2`로 정의되어 있으면 `q1`과 `q2`를 각각 단독으로 사용하여 생성한 구체화된 뷰도 파티션 새로 고침을 지원해야 하며, 파생된 파티션 열의 순서가 일치해야 합니다.
- 여러 PCT 테이블 간에 파티션의 세분성이 일치해야 합니다.

    **허용되는 예제**:

    ```text
    Partitions of base table t1: [2020-01-01, 2020-01-02), [2020-01-02, 2020-01-03)
    Partitions of base table t2: [2020-01-02, 2020-01-03), [2020-01-03, 2020-01-04)
    ```

    여러 베이스 테이블의 파티션이 완전히 동일하지는 않지만, 서로 겹치지 않습니다.

    **허용되지 않는 예제**:

    ```text
    Partitions of base table t1: [2020-01-01, 2020-01-03), [2020-01-03, 2020-01-05)
    Partitions of base table t2: [2020-01-01, 2020-01-02), [2020-01-03, 2020-01-05)
    ```

    `[2020-01-01, 2020-01-03)`과 `[2020-01-01, 2020-01-02)`는 서로 겹치지만 동일하지 않습니다.

### 1.5 SQL 정의 시 유의 사항 {#15-sql-definition-notes}

비동기 구체화된 뷰는 내부 뷰(View)를 기반으로 생성할 수 있지만, **외부 데이터 소스의 뷰를 기반으로 생성하는 것은 지원하지 않습니다**.

다음 사항에 유의하세요.

- 구체화된 뷰가 의존하는 내부 뷰를 수정하거나 다시 생성하면 비동기 구체화된 뷰의 데이터가 베이스 테이블과 일치하지 않게 됩니다. 이 경우 구체화된 뷰의 데이터는 그대로 존재하지만 투명한 쿼리 재작성에는 사용할 수 없습니다.
- 구조 변경이 비동기 구체화된 뷰가 의존하는 파티션 추적 테이블이나 열에 영향을 주거나 해당 스키마를 변경하면 구체화된 뷰의 새로 고침이 실패합니다.
- 변경이 위 요소에 영향을 주지 않으면 구체화된 뷰를 새로 고친 후 정상적으로 사용할 수 있습니다.

---

## 2. 구체화된 뷰 쿼리 {#2-query-materialized-views}

4.1.5부터 외부 테이블에 대한 과거 스냅샷 및 Time Travel 쿼리는 현재 구체화된 뷰 데이터를 사용하는 투명한 재작성에서 제외되므로, 쿼리는 요청한 스냅샷을 읽습니다. 이 제한은 현재 데이터에 대한 쿼리 재작성에는 영향을 주지 않습니다.

<!-- Knowledge type: Operations manual -->
<!-- Applicable scenarios: Use materialized views to accelerate queries -->

구체화된 뷰를 쿼리하는 방법에는 **직접 쿼리**와 **투명한 쿼리 재작성**이 있습니다.

| 쿼리 방식 | 원본 쿼리 수정 필요 여부 | 적용 시나리오 |
| ------------ | ------------------ | ---------------------------------------------- |
| 직접 쿼리 | 예 | 구체화된 뷰가 존재한다는 것을 알고 있으며 사전 계산된 결과를 명시적으로 사용하려는 경우입니다. |
| 투명한 재작성 | 아니요 | 사용자가 의식할 필요 없이 구체화된 뷰를 활용하여 쿼리를 가속하려는 경우입니다. |

### 2.1 구체화된 뷰 직접 쿼리 {#21-direct-query-of-materialized-views}

구체화된 뷰를 테이블처럼 취급하여 필터 조건, 집계 등을 적용하고 직접 쿼리할 수 있습니다.

**구체화된 뷰 정의**:

```sql
CREATE MATERIALIZED VIEW mv_5
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT t1.l_linenumber,
       o_custkey,
       o_orderdate
FROM (SELECT * FROM lineitem WHERE l_linenumber > 1) t1
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey;
```

**원본 쿼리**:

```sql
SELECT t1.l_linenumber,
       o_custkey,
       o_orderdate
FROM (SELECT * FROM lineitem WHERE l_linenumber > 1) t1
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey
WHERE o_orderdate = '2023-10-18';
```

**구체화된 뷰에 대한 동등한 직접 쿼리**(사용자가 수동으로 재작성해야 함):

```sql
SELECT
    l_linenumber,
    o_custkey
FROM mv_5
WHERE l_linenumber > 1 AND o_orderdate = '2023-10-18';
```

### 2.2 투명한 쿼리 재작성 {#22-transparent-query-rewrite}

**투명한 재작성**은 사용자가 쿼리를 수동으로 수정할 필요 없이 시스템이 처리 과정에서 쿼리를 자동으로 최적화하고 재작성하는 것을 의미합니다. Doris의 비동기 구체화된 뷰는 SPJG(SELECT-PROJECT-JOIN-GROUP-BY) 패턴을 기반으로 하는 투명한 재작성 알고리즘을 사용합니다. 이 알고리즘은 SQL 구조 정보를 분석하여 적합한 구체화된 뷰를 자동으로 찾고, 쿼리에 응답할 최적의 결과를 선택합니다.

다음 표는 Doris가 지원하는 투명한 재작성 기능을 정리한 것입니다.

| 재작성 기능 | 적용 시나리오 |
| ------------------ | ------------------------------------------------------------- |
| 조건자 보정 | 쿼리와 구체화된 뷰의 `WHERE` 조건이 완전히 같지 않은 경우입니다. |
| JOIN 재작성 | 쿼리와 구체화된 뷰가 동일한 테이블과 동일한 JOIN 유형을 사용하는 경우입니다. |
| JOIN 유도 | 쿼리와 구체화된 뷰의 JOIN 유형이 다르지만 구체화된 뷰가 충분한 데이터를 제공할 수 있는 경우입니다. |
| 집계 재작성 | 쿼리와 구체화된 뷰의 그룹화 차원이 동일한 경우입니다. |
| 집계 재작성(롤업) | 구체화된 뷰의 차원이 쿼리의 차원을 포함하고, 구체화된 뷰의 함수로 쿼리의 집계 함수를 표현할 수 있는 경우입니다. |
| 다차원 집계 재작성 | 구체화된 뷰에서는 `GROUPING SETS`/`CUBE`/`ROLLUP`을 사용하지 않지만 쿼리에 다차원 집계가 있는 경우입니다. |
| 파티션 보정 재작성 | 파티션으로 나뉜 구체화된 뷰가 쿼리에 필요한 모든 데이터를 제공하지 못하면 베이스 테이블과 `UNION ALL`을 수행합니다. |
| 중첩 구체화된 뷰 재작성 | 다른 구체화된 뷰를 기반으로 구체화된 뷰를 생성한 경우입니다. |
| 비집계 뷰를 집계 쿼리에 활용 | 쿼리는 집계 쿼리이고 구체화된 뷰에는 집계가 없지만 필요한 모든 열을 제공할 수 있는 경우입니다. |
| 윈도우 함수 재작성 | 쿼리와 구체화된 뷰 모두에 윈도우 함수가 있고 그 정의가 정확히 일치하는 경우입니다. |
| Limit / TopN 재작성 | 쿼리에 `ORDER BY` 또는 `LIMIT`이 포함되어 있고 구체화된 뷰가 요구 사항을 충족하는 경우입니다. |

#### 2.2.1 조건자 보정 {#221-predicate-compensation}

쿼리와 구체화된 뷰의 조건이 반드시 동일할 필요는 없습니다. 구체화된 뷰에 조건자를 보정하여 쿼리를 표현하면 구체화된 뷰를 최대한 재사용할 수 있습니다.

구체화된 뷰와 쿼리의 `WHERE` 조건이 `AND`로 연결된 표현식이면 다음 두 가지 경우가 적용됩니다.

**경우 1: 쿼리 표현식이 구체화된 뷰 표현식을 포함하는 경우**, 조건자 보정을 적용할 수 있습니다.

예를 들어 쿼리가 `a > 5 AND b > 10 AND c = 7`이고 구체화된 뷰의 조건이 `a > 5 AND b > 10`이면, 구체화된 뷰의 조건은 쿼리 조건의 부분집합이므로 `c = 7` 조건만 보정하면 됩니다.

**경우 2: 쿼리 표현식이 구체화된 뷰 표현식을 완전히 포함하지 않는 경우**에도 쿼리 조건으로부터 구체화된 뷰의 조건을 유도할 수 있으면(일반적으로 `>`, `<`, `=`, `IN`과 같은 비교 및 범위 표현식) 조건자 보정을 적용할 수 있습니다. 보정 결과는 쿼리 조건 자체입니다.

예를 들어 쿼리가 `a > 5 AND b = 10`이고 구체화된 뷰가 `a > 1 AND b > 8`이면 구체화된 뷰의 조건 범위가 쿼리 조건 범위를 포함하므로 보정할 수 있습니다. 보정 결과는 `a > 5 AND b = 10`입니다.

**조건자 보정의 제한 사항**:

- `OR`로 연결된 표현식은 조건자 보정을 지원하지 않으며, 재작성에 성공하려면 조건이 동일해야 합니다.
- `LIKE`처럼 비교 및 범위 표현식이 아닌 경우에는 조건자 보정을 지원하지 않으며, 재작성에 성공하려면 조건이 동일해야 합니다.

**예제**:

구체화된 뷰 정의:

```sql
CREATE MATERIALIZED VIEW mv1
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT t1.l_linenumber,
       o_custkey,
       o_orderdate
FROM (SELECT * FROM lineitem WHERE l_linenumber > 1) t1
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey;
```

다음 쿼리는 구체화된 뷰를 활용할 수 있습니다. 투명한 재작성을 통해 동일한 구체화된 뷰를 재사용하므로 재작성 시간을 줄이고 구축 비용을 절감할 수 있습니다.

```sql
SELECT l_linenumber,
       o_custkey,
       o_orderdate
FROM lineitem
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey
WHERE l_linenumber > 2;
```

```sql
SELECT l_linenumber,
       o_custkey,
       o_orderdate
FROM lineitem
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey
WHERE l_linenumber > 2 AND o_orderdate = '2023-10-19';
```

#### 2.2.2 JOIN 재작성 {#222-join-rewrite}

**적용 시나리오**: 쿼리와 구체화된 뷰가 동일한 테이블을 사용하는 경우입니다. 구체화된 뷰와 쿼리 모두에서 `WHERE` 절은 JOIN의 입력이나 JOIN 외부에 위치할 수 있습니다. 옵티마이저는 이 패턴의 쿼리에 대해 투명한 재작성을 시도합니다.

**지원하는 JOIN 유형**:

- `INNER JOIN`
- `LEFT OUTER JOIN`
- `RIGHT OUTER JOIN`
- `FULL OUTER JOIN`
- `LEFT SEMI JOIN`
- `RIGHT SEMI JOIN`
- `LEFT ANTI JOIN`
- `RIGHT ANTI JOIN`

**예제**:

구체화된 뷰 정의:

```sql
CREATE MATERIALIZED VIEW mv2
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT t1.l_linenumber,
       o_custkey,
       o_orderdate
FROM (SELECT * FROM lineitem WHERE l_linenumber > 1) t1
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey;
```

다음 쿼리는 투명하게 재작성할 수 있습니다. `l_linenumber > 1` 조건을 상위로 끌어올리고 구체화된 뷰의 사전 계산 결과를 사용하여 쿼리를 표현할 수 있습니다. 구체화된 뷰를 활용하면 JOIN 계산을 줄일 수 있습니다.

```sql
SELECT l_linenumber,
       o_custkey
FROM lineitem
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey
WHERE l_linenumber > 1 AND o_orderdate = '2023-10-18';
```

#### 2.2.3 JOIN 유도 {#223-join-derivation}

쿼리와 구체화된 뷰의 JOIN 유형이 다르더라도 구체화된 뷰가 쿼리에 필요한 모든 데이터를 제공할 수 있으면, JOIN 외부에서 조건자를 보정하여 투명한 재작성을 적용할 수 있습니다.

**예제**:

구체화된 뷰 정의:

```sql
CREATE MATERIALIZED VIEW mv3
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT
    l_shipdate, l_suppkey, o_orderdate,
    sum(o_totalprice) AS sum_total,
    max(o_totalprice) AS max_total,
    min(o_totalprice) AS min_total,
    count(*) AS count_all,
    count(distinct CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END) AS bitmap_union_basic
FROM lineitem
LEFT OUTER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
    l_shipdate,
    l_suppkey,
    o_orderdate;
```

쿼리 문:

```sql
SELECT
    l_shipdate, l_suppkey, o_orderdate,
    sum(o_totalprice) AS sum_total,
    max(o_totalprice) AS max_total,
    min(o_totalprice) AS min_total,
    count(*) AS count_all,
    count(distinct CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END) AS bitmap_union_basic
FROM lineitem
INNER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
WHERE o_orderdate = '2023-10-18' AND l_suppkey = 3
GROUP BY
    l_shipdate,
    l_suppkey,
    o_orderdate;
```

#### 2.2.4 집계 재작성 {#224-aggregation-rewrite}

**적용 조건**: 쿼리와 구체화된 뷰 정의의 그룹화 차원이 동일하고, 구체화된 뷰의 집계 함수를 사용하여 쿼리의 집계 함수를 표현할 수 있어야 합니다.

**예제**:

구체화된 뷰 정의:

```sql
CREATE MATERIALIZED VIEW mv4
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT
    o_shippriority, o_comment,
    count(distinct CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END) AS cnt_1,
    count(distinct CASE WHEN O_SHIPPRIORITY > 2 AND o_orderkey IN (2) THEN o_custkey ELSE null END) AS cnt_2,
    sum(o_totalprice),
    max(o_totalprice),
    min(o_totalprice),
    count(*)
FROM orders
GROUP BY
    o_shippriority,
    o_comment;
```

다음 쿼리는 투명하게 재작성할 수 있습니다. 집계 차원이 동일하고, 구체화된 뷰의 `o_shippriority` 필드로 결과를 필터링할 수 있으며, GROUP BY 차원과 집계 함수 모두 구체화된 뷰를 사용하여 재작성할 수 있습니다. 집계 구체화된 뷰를 활용하면 집계 계산을 줄일 수 있습니다.

```sql
SELECT
    o_shippriority, o_comment,
    count(distinct CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END) AS cnt_1,
    count(distinct CASE WHEN O_SHIPPRIORITY > 2 AND o_orderkey IN (2) THEN o_custkey ELSE null END) AS cnt_2,
    sum(o_totalprice),
    max(o_totalprice),
    min(o_totalprice),
    count(*)
FROM orders
WHERE o_shippriority IN (1, 2)
GROUP BY
    o_shippriority,
    o_comment;
```

#### 2.2.5 집계 재작성(롤업) {#225-aggregation-rewrite-roll-up}

집계 차원이 동일하지 않아도 재작성을 적용할 수 있습니다. 요구 사항은 다음과 같습니다.

- 구체화된 뷰의 `GROUP BY` 차원은 쿼리의 `GROUP BY` 차원을 포함해야 합니다. 쿼리에는 `GROUP BY`가 없어도 됩니다.
- 구체화된 뷰의 집계 함수를 사용하여 쿼리의 집계 함수를 표현할 수 있어야 합니다.

**예제**:

구체화된 뷰 정의:

```sql
CREATE MATERIALIZED VIEW mv5
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT
    l_shipdate, o_orderdate, l_partkey, l_suppkey,
    sum(o_totalprice) AS sum_total,
    max(o_totalprice) AS max_total,
    min(o_totalprice) AS min_total,
    count(*) AS count_all,
    bitmap_union(to_bitmap(CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END)) AS bitmap_union_basic
FROM lineitem
LEFT OUTER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```

다음 쿼리는 투명하게 재작성할 수 있습니다. 구체화된 뷰의 차원이 쿼리의 차원을 포함하므로, 쿼리는 구체화된 뷰의 `SELECT`에 있는 함수를 사용하여 롤업을 시도합니다. 예를 들어 구체화된 뷰의 `bitmap_union`은 최종적으로 `bitmap_union_count`로 롤업되며, 이는 쿼리의 `count(distinct)`와 의미가 일치합니다.

집계 롤업을 통해 여러 쿼리가 동일한 구체화된 뷰를 재사용하여 구축 비용을 절감할 수 있습니다.

```sql
SELECT
    l_shipdate, l_suppkey,
    sum(o_totalprice) AS sum_total,
    max(o_totalprice) AS max_total,
    min(o_totalprice) AS min_total,
    count(*) AS count_all,
    count(distinct CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END) AS bitmap_union_basic
FROM lineitem
LEFT OUTER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
WHERE o_orderdate = '2023-10-18' AND l_partkey = 3
GROUP BY
    l_shipdate,
    l_suppkey;
```

**지원하는 롤업 집계 함수 목록**:

| 쿼리의 함수 | 구체화된 뷰의 함수 | 롤업 후 함수 |
| ------------------------------------------------------- | ------------------------------------------- | -------------------- |
| `max`                                                   | `max`                                       | `max`                |
| `min`                                                   | `min`                                       | `min`                |
| `sum`                                                   | `sum`                                       | `sum`                |
| `count`                                                 | `count`                                     | `sum`                |
| `count(distinct)`                                       | `bitmap_union`                              | `bitmap_union_count` |
| `bitmap_union`                                          | `bitmap_union`                              | `bitmap_union`       |
| `bitmap_union_count`                                    | `bitmap_union`                              | `bitmap_union_count` |
| `hll_union_agg`, `approx_count_distinct`, `hll_cardinality` | `hll_union` 또는 `hll_raw_agg`            | `hll_union_agg`      |
| `any_value`                                             | `any_value` 또는 SELECT 뒤의 `any_value`가 참조하는 열 | `any_value`          |

#### 2.2.6 다차원 집계 재작성 {#226-multi-dimensional-aggregation-rewrite}

투명한 재작성은 다차원 집계를 지원합니다. 구체화된 뷰에서 `GROUPING SETS`/`CUBE`/`ROLLUP`을 사용하지 않고 쿼리에 다차원 집계가 있으며, 구체화된 뷰의 `GROUP BY` 열이 쿼리의 다차원 집계에서 참조하는 모든 열을 포함해야 합니다.

**예제**:

구체화된 뷰 정의:

```sql
CREATE MATERIALIZED VIEW mv5_1
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT o_orderstatus, o_orderdate, o_orderpriority,
       sum(o_totalprice) AS sum_total,
       max(o_totalprice) AS max_total,
       min(o_totalprice) AS min_total,
       count(*) AS count_all
FROM orders
GROUP BY
    o_orderstatus, o_orderdate, o_orderpriority;
```

다음 쿼리는 구체화된 뷰를 활용하여 집계 결과를 재사용하고 계산을 줄일 수 있습니다.

```sql
SELECT o_orderstatus, o_orderdate, o_orderpriority,
       sum(o_totalprice),
       max(o_totalprice),
       min(o_totalprice),
       count(*)
FROM orders
GROUP BY
    GROUPING SETS ((o_orderstatus, o_orderdate), (o_orderpriority), (o_orderstatus), ());
```

#### 2.2.7 파티션 보정 재작성 {#227-partition-compensation-rewrite}

**적용 시나리오**: 파티션으로 나뉜 구체화된 뷰가 쿼리에 필요한 모든 데이터를 제공하지 못하면, `UNION ALL`을 사용하여 원본 베이스 테이블과 구체화된 뷰의 데이터를 결합한 최종 결과를 만듭니다.

**예제**:

구체화된 뷰 정의:

```sql
CREATE MATERIALIZED VIEW mv7
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
PARTITION BY (l_shipdate)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT l_shipdate, o_orderdate, l_partkey,
       l_suppkey, sum(o_totalprice) AS sum_total
FROM lineitem
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```

베이스 테이블에 새 파티션 `2023-10-21`이 추가되었지만 구체화된 뷰가 아직 새로 고쳐지지 않은 경우, 구체화된 뷰와 원본 테이블을 `UNION ALL`로 결합하여 결과를 반환할 수 있습니다.

```sql
INSERT INTO lineitem VALUES
(1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-21', '2023-10-21', '2023-10-21', 'a', 'b', 'yyyyyyyyy');
```

쿼리 문:

```sql
SELECT l_shipdate, o_orderdate, l_partkey, l_suppkey, sum(o_totalprice) AS sum_total
FROM lineitem
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```

쿼리는 구체화된 사전 계산 결과를 부분적으로 사용하여 그에 해당하는 계산을 줄일 수 있습니다.

재작성 결과 예시:

```sql
SELECT *
FROM mv7
UNION ALL
SELECT t1.l_shipdate, o_orderdate, t1.l_partkey, t1.l_suppkey, sum(o_totalprice) AS sum_total
FROM (SELECT * FROM lineitem WHERE l_shipdate = '2023-10-21') t1
LEFT JOIN orders ON t1.l_orderkey = orders.o_orderkey AND t1.l_shipdate = o_orderdate
GROUP BY
    t1.l_shipdate,
    o_orderdate,
    t1.l_partkey,
    t1.l_suppkey;
```

:::caution 주의
현재 파티션 보정은 지원되지만, 조건에 따른 `UNION ALL` 보정은 아직 지원되지 않습니다.

예를 들어 구체화된 뷰를 필터 조건 `WHERE l_shipdate > '2023-10-19'`로 생성하고 쿼리의 조건이 `WHERE l_shipdate > '2023-10-18'`인 경우, 현재는 `UNION ALL`을 통해 보정할 수 없습니다. 향후 지원할 예정입니다.
:::

:::info 참고
버전 3.1.0부터 파티션 보정 재작성 기능은 내부 테이블, Hive, Iceberg, Paimon 유형의 파티션 테이블을 지원합니다. 파티션 보정 재작성은 이러한 유형의 파티션 테이블 중 하나를 기반으로 파티션으로 나뉜 구체화된 뷰를 생성한 경우에만 트리거됩니다.
:::

#### 2.2.8 중첩 구체화된 뷰 재작성 {#228-nested-materialized-view-rewrite}

**정의**: 구체화된 뷰의 정의 SQL에서 다른 구체화된 뷰를 사용할 수 있으며, 이를 중첩 구체화된 뷰라고 합니다. 중첩 수준의 수는 이론적으로 제한이 없습니다. 중첩 구체화된 뷰는 직접 쿼리할 수 있으며 투명한 재작성에도 참여할 수 있습니다.

**적용 시나리오**: 주로 데이터 모델링과 복잡한 쿼리에 사용됩니다. 단일 구체화된 뷰로 투명한 재작성을 수행할 수 없다면 복잡한 쿼리를 나누어 중첩 구체화된 뷰를 생성할 수 있습니다.

**예제**:

내부 구체화된 뷰 `mv8_0_inner_mv`를 생성합니다.

```sql
CREATE MATERIALIZED VIEW mv8_0_inner_mv
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    l_linenumber,
    o_custkey,
    o_orderkey,
    o_orderstatus,
    l_partkey,
    l_suppkey,
    l_orderkey
FROM lineitem
INNER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey;
```

외부 구체화된 뷰 `mv8_0`을 생성합니다.

```sql
CREATE MATERIALIZED VIEW mv8_0
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    l_linenumber,
    o_custkey,
    o_orderkey,
    o_orderstatus,
    l_partkey,
    l_suppkey,
    l_orderkey,
    ps_availqty
FROM mv8_0_inner_mv
INNER JOIN partsupp ON l_partkey = ps_partkey AND l_suppkey = ps_suppkey;
```

다음 쿼리는 `mv8_0_inner_mv`와 `mv8_0`을 사용하는 재작성에 모두 성공하며, 비용 모델은 최종적으로 `mv8_0`을 선택합니다.

```sql
SELECT lineitem.l_linenumber
FROM lineitem
INNER JOIN orders ON l_orderkey = o_orderkey
INNER JOIN partsupp ON l_partkey = ps_partkey AND l_suppkey = ps_suppkey
WHERE o_orderstatus = 'o';
```

:::caution 주의
- 구체화된 뷰의 중첩 수준이 많을수록 투명한 재작성에 더 오래 걸립니다. 중첩 깊이는 3단계를 넘지 않는 것이 좋습니다.
- 중첩 구체화된 뷰의 투명한 재작성은 기본적으로 비활성화되어 있습니다. 활성화하려면 [3.11 관련 구성](#311-related-configuration)을 참조하세요.
:::

#### 2.2.9 집계 쿼리에서 비집계 구체화된 뷰 활용 {#229-aggregation-query-hits-a-non-aggregation-materialized-view}

쿼리가 집계 쿼리이고 구체화된 뷰에는 집계가 없더라도, 구체화된 뷰가 쿼리에 사용되는 모든 열을 제공할 수 있으면 재작성을 적용할 수 있습니다. 예를 들어 쿼리가 먼저 JOIN을 수행한 후 `GROUP BY`로 집계한다면, 해당 JOIN을 포함하는 구체화된 뷰를 활용하는 것이 유리합니다.

```sql
CREATE MATERIALIZED VIEW mv10_0
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT l_shipdate, o_orderdate, l_partkey,
       l_suppkey, o_totalprice
FROM lineitem
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate;
```

다음 쿼리는 `mv10_0`을 활용하여 `lineitem JOIN orders` 계산을 줄일 수 있습니다.

```sql
SELECT l_shipdate, o_orderdate, l_partkey,
       l_suppkey, sum(o_totalprice) AS sum_total
FROM lineitem
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```

#### 2.2.10 윈도우 함수 재작성 {#2210-window-function-rewrite}

쿼리와 구체화된 뷰 모두에 윈도우 함수가 있고 윈도우 함수 정의가 정확히 일치하면 투명한 재작성을 적용할 수 있습니다. 윈도우 함수 재작성은 구체화된 뷰에서 사전 계산한 윈도우 함수 결과를 재사용하여 복잡한 윈도우 계산이 포함된 쿼리의 성능을 크게 향상합니다. **현재 모든 윈도우 함수에 대해 투명한 재작성을 지원합니다.**

**예제 1**:

```sql
CREATE MATERIALIZED VIEW mv11_0
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT *
FROM (
    SELECT
        o_orderkey,
        FIRST_VALUE(o_custkey) OVER (
            PARTITION BY o_orderdate
            ORDER BY o_totalprice NULLS LAST
            RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS first_value,
        RANK() OVER (
            PARTITION BY o_orderdate, o_orderstatus
            ORDER BY o_totalprice NULLS LAST
            RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS rank_value
    FROM orders
) t
WHERE o_orderkey > 1;
```

다음 쿼리는 `mv11_0`을 활용하여 윈도우 함수 계산을 줄일 수 있습니다. 쿼리 조건 `o_orderkey > 2`가 구체화된 뷰의 조건과 달라도 재작성에 성공할 수 있습니다.

```sql
SELECT *
FROM (
    SELECT
        o_orderkey,
        FIRST_VALUE(o_custkey) OVER (
            PARTITION BY o_orderdate
            ORDER BY o_totalprice NULLS LAST
            RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS first_value,
        RANK() OVER (
            PARTITION BY o_orderdate, o_orderstatus
            ORDER BY o_totalprice NULLS LAST
            RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS rank_value
    FROM orders
) t
WHERE o_orderkey > 2;
```

**예제 2**:

```sql
CREATE MATERIALIZED VIEW mv11_1
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    o_orderkey,
    o_orderdate,
    FIRST_VALUE(o_custkey) OVER (
        PARTITION BY o_orderdate
        ORDER BY o_totalprice NULLS LAST
        RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS first_value,
    RANK() OVER (
        PARTITION BY o_orderdate, o_orderstatus
        ORDER BY o_totalprice NULLS LAST
        RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS rank_value
FROM orders
WHERE o_orderdate > '2023-12-09';
```

다음 쿼리는 `mv11_1`을 활용하여 윈도우 함수 계산을 줄일 수 있습니다. `o_orderdate`가 윈도우 함수의 `PARTITION BY` 필드이므로, 쿼리 조건 `o_orderdate > '2023-12-10'`이 윈도우 함수 실행 전에 평가되더라도 투명한 재작성을 적용할 수 있습니다.

```sql
SELECT
    o_orderdate,
    FIRST_VALUE(o_custkey) OVER (
        PARTITION BY o_orderdate
        ORDER BY o_totalprice NULLS LAST
        RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS first_value,
    RANK() OVER (
        PARTITION BY o_orderdate, o_orderstatus
        ORDER BY o_totalprice NULLS LAST
        RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS rank_value
FROM orders
WHERE o_orderdate > '2023-12-10';
```

:::tip 팁
예제에서는 단일 테이블을 사용하지만 윈도우 함수 재작성은 다중 테이블 JOIN 시나리오에도 적용됩니다.
:::

#### 2.2.11 Limit 및 TopN 재작성 {#2211-limit-and-topn-rewrite}

쿼리에 `ORDER BY` 또는 `LIMIT` 절이 포함된 경우(즉, Top-N 쿼리), 구체화된 뷰가 쿼리의 `ORDER BY` 및 `LIMIT` 요구 사항을 충족할 만큼 충분한 데이터를 제공할 수 있으면 옵티마이저는 구체화된 뷰를 사용하여 투명한 재작성을 수행할 수 있습니다. 이를 통해 일반적인 Top-N 분석 시나리오를 크게 가속할 수 있습니다.

**재작성 조건**:

| 확인 항목 | 검증 규칙 |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ORDER BY   | 쿼리의 `ORDER BY` 절은 구체화된 뷰의 `ORDER BY` 절과 호환되거나 동일해야 합니다. |
| LIMIT      | 구체화된 뷰에 `LIMIT`이 없으면 `LIMIT`이 포함된 모든 쿼리가 재작성을 시도할 수 있습니다.<br/>구체화된 뷰에 `LIMIT N`이 있으면 쿼리의 `LIMIT M`은 `M <= N`을 충족해야 합니다.<br/>구체화된 뷰에 `LIMIT N OFFSET L`이 있으면 쿼리의 `LIMIT M OFFSET O`는 `O >= L` 및 `M + O <= N + L`을 충족해야 합니다. |
| WHERE 조건 | 구체화된 뷰와 쿼리의 나머지 `WHERE` 조건은 동일해야 합니다. |

**예제 1**:

```sql
CREATE MATERIALIZED VIEW mv11_0
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    o_orderdate,
    count(o_shippriority),
    count(o_comment),
    l_orderkey,
    count(l_partkey)
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey AND l_suppkey = ps_suppkey
GROUP BY o_orderdate, l_orderkey
LIMIT 8 OFFSET 1;
```

다음 쿼리는 `mv11_0`을 활용할 수 있으며 검증 조건을 충족합니다.

```sql
SELECT
    o_orderdate,
    count(o_shippriority),
    count(o_comment),
    l_orderkey,
    count(l_partkey)
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey AND l_suppkey = ps_suppkey
GROUP BY o_orderdate, l_orderkey
LIMIT 4 OFFSET 2;
```

다음 쿼리는 `mv11_0`을 활용할 수 없습니다. 추가 조건 `o_orderdate > '2023-12-08'`이 있기 때문입니다. `mv11_0` 구체화된 뷰에도 이 `WHERE` 조건이 있다면 쿼리가 해당 뷰를 활용할 수 있습니다.

```sql
SELECT
    o_orderdate,
    count(o_shippriority),
    count(o_comment),
    l_orderkey,
    count(l_partkey)
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey AND l_suppkey = ps_suppkey
WHERE o_orderdate > '2023-12-08'
GROUP BY o_orderdate, l_orderkey
LIMIT 4 OFFSET 2;
```

**예제 2**:

```sql
CREATE MATERIALIZED VIEW mv11_1
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    o_orderdate,
    o_shippriority,
    o_comment,
    l_orderkey,
    l_partkey,
    o_orderkey
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey AND l_suppkey = ps_suppkey
WHERE o_orderdate > '2023-12-08'
ORDER BY o_orderkey
LIMIT 4 OFFSET 2;
```

다음 쿼리의 `ORDER BY + LIMIT`은 TopN으로 변환되며, `mv11_1`을 활용할 수 있고 검증 조건을 충족합니다.

```sql
SELECT
    o_orderdate,
    o_shippriority,
    o_comment,
    l_orderkey,
    l_partkey
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey AND l_suppkey = ps_suppkey
WHERE o_orderdate > '2023-12-08'
ORDER BY o_orderkey
LIMIT 2 OFFSET 3;
```

### 2.3 투명한 재작성 확인(Explain) {#23-inspect-transparent-rewrite-explain}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Debugging why a query did not hit the materialized view -->

#### 2.3.1 간략한 정보: EXPLAIN {#231-brief-view-explain}

구체화된 뷰의 투명한 재작성 과정에 대한 간략한 정보를 보려면 다음을 실행합니다.

```sql
EXPLAIN <query_sql>
```

반환 정보(구체화된 뷰 관련 부분 발췌):

```text
| MaterializedView                                                              |
| MaterializedViewRewriteSuccessAndChose:                                       |
|   Names: mv5                                                                  |
| MaterializedViewRewriteSuccessButNotChose:                                    |
|                                                                               |
| MaterializedViewRewriteFail:                                                  |
|   Name: mv4                                                                   |
|   FailSummary: Match mode is invalid, View struct info is invalid             |
|   Name: mv3                                                                   |
|   FailSummary: Match mode is invalid, Rewrite compensate predicate by view fail, View struct info is invalid |
|   Name: mv1                                                                   |
|   FailSummary: The columns used by query are not in view, View struct info is invalid |
|   Name: mv2                                                                   |
|   FailSummary: The columns used by query are not in view, View struct info is invalid |
```

필드 의미:

- **`MaterializedViewRewriteSuccessAndChose`**: 투명한 재작성에 성공하고 CBO(Cost-Based Optimizer)가 선택한 구체화된 뷰 이름 목록입니다.
- **`MaterializedViewRewriteSuccessButNotChose`**: 투명한 재작성에는 성공했지만 CBO가 최종적으로 선택하지 않은 구체화된 뷰 이름 목록입니다.
- **`MaterializedViewRewriteFail`**: 투명한 재작성에 실패한 구체화된 뷰와 실패 원인 요약입니다.

#### 2.3.2 상세 정보: EXPLAIN MEMO PLAN {#232-detailed-view-explain-memo-plan}

구체화된 뷰의 후보 선정, 재작성 및 최종 선택에 이르는 상세 과정을 확인하려면 다음을 실행합니다.

```sql
EXPLAIN MEMO PLAN <query_sql>
```

---

## 3. 구체화된 뷰 유지 관리 {#3-maintain-materialized-views}

<!-- Knowledge type: Operations manual -->
<!-- Applicable scenarios: Day-to-day operations and management of materialized views -->

### 3.1 권한 {#31-permissions}

| 작업 | 필요한 권한 |
| ----------------------------- | ------------------------- |
| 구체화된 뷰 삭제 | 구체화된 뷰에 대한 삭제 권한(테이블 삭제 권한과 동일). |
| 구체화된 뷰 수정 | 구체화된 뷰에 대한 수정 권한(테이블 수정 권한과 동일). |
| 구체화된 뷰 일시 중지 / 재개 / 취소 / 새로 고침 | 구체화된 뷰에 대한 생성 권한. |

### 3.2 구체화된 뷰 수정 {#32-modify-a-materialized-view}

#### 3.2.1 구체화된 뷰 속성 수정 {#321-modify-materialized-view-properties}

```sql
ALTER MATERIALIZED VIEW mv_1
SET(
    "grace_period" = "10"
);
```

#### 3.2.2 구체화된 뷰의 원자적 교체(이름 변경) {#322-atomic-replacement-of-a-materialized-view-rename}

먼저 교체에 사용할 새 구체화된 뷰를 생성합니다.

```sql
CREATE MATERIALIZED VIEW mv9_0
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES ('replication_num' = '1')
AS
SELECT
    l_linenumber,
    o_custkey,
    o_orderkey,
    o_orderstatus,
    l_partkey,
    l_suppkey,
    l_orderkey
FROM lineitem
INNER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey;
```

`mv7`을 `mv9_0`으로 교체하고 `mv7`을 삭제합니다.

```sql
ALTER MATERIALIZED VIEW mv7
REPLACE WITH MATERIALIZED VIEW mv9_0
PROPERTIES('swap' = 'false');
```

### 3.3 구체화된 뷰 삭제 {#33-drop-a-materialized-view}

```sql
DROP MATERIALIZED VIEW mv_1;
```

자세한 내용은 [DROP ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/DROP-ASYNC-MATERIALIZED-VIEW)를 참조하세요.

### 3.4 구체화된 뷰의 생성 문 확인 {#34-view-the-creation-statement-of-a-materialized-view}

```sql
SHOW CREATE MATERIALIZED VIEW mv_1;
```

자세한 내용은 [SHOW CREATE MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/sync-materialized-view/SHOW-CREATE-MATERIALIZED-VIEW)를 참조하세요.

### 3.5 새로 고침 일시 중지 / 활성화 / 취소 {#35-pause--enable--cancel-a-refresh}

| 작업 | 참조 문서 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 구체화된 뷰 일시 중지 | [PAUSE MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/PAUSE-MATERIALIZED-VIEW-JOB) |
| 구체화된 뷰 활성화 | [RESUME MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/RESUME-MATERIALIZED-VIEW-JOB) |
| 구체화된 뷰 새로 고침 태스크 취소 | [CANCEL MATERIALIZED VIEW TASK](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CANCEL-MATERIALIZED-VIEW-TASK) |

### 3.6 구체화된 뷰 정보 조회 {#36-query-materialized-view-information}

```sql
SELECT *
FROM mv_infos('database'='db_name')
WHERE Name = 'mv_name' \G
```

반환 결과 예시:

```text
*************************** 1. row ***************************
                Id: 139570
              Name: mv11
           JobName: inner_mtmv_139570
             State: NORMAL
SchemaChangeDetail:
      RefreshState: SUCCESS
       RefreshInfo: BUILD IMMEDIATE REFRESH AUTO ON MANUAL
          QuerySql: SELECT l_shipdate, l_orderkey, O_ORDERDATE, count(*)
FROM lineitem
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE
           EnvInfo: EnvInfo{ctlId='0', dbId='16813'}
      MvProperties: {}
   MvPartitionInfo: MTMVPartitionInfo{partitionType=FOLLOW_BASE_TABLE, relatedTable=lineitem, relatedCol='l_shipdate', partitionCol='l_shipdate'}
SyncWithBaseTables: 1
```

**주요 필드 설명**:

- **`SyncWithBaseTables`**: 구체화된 뷰의 데이터가 베이스 테이블과 일치하는지 나타냅니다.
    - 전체 구축 방식의 구체화된 뷰: 값이 `1`이면 투명한 재작성에 사용할 수 있음을 나타냅니다.
    - 파티션 증분 방식의 구체화된 뷰: 파티션 단위로 판단합니다. 일부 파티션을 사용할 수 없더라도 쿼리 대상 파티션이 유효하면 구체화된 뷰를 투명한 재작성에 사용할 수 있습니다. 투명한 재작성 가능 여부는 주로 쿼리에 사용되는 파티션의 `SyncWithBaseTables` 필드에 따라 결정됩니다. `1`은 사용 가능, `0`은 사용 불가능을 의미합니다.
- **`JobName`**: 구체화된 뷰의 구축 작업 이름입니다. 각 구체화된 뷰에는 하나의 작업이 있으며, 새로 고칠 때마다 새 태스크가 생성됩니다. 작업과 태스크의 관계는 1:n입니다.
- **`State`**: 값이 `SCHEMA_CHANGE`이면 베이스 테이블의 스키마가 변경되었음을 나타냅니다. 이 경우 구체화된 뷰를 투명한 재작성에 사용할 수 없습니다(직접 쿼리는 영향을 받지 않음). 다음 새로 고침이 성공하면 `NORMAL`로 돌아갑니다.
- **`SchemaChangeDetail`**: `SCHEMA_CHANGE`가 발생한 원인을 나타냅니다.
- **`RefreshState`**: 구체화된 뷰의 마지막 태스크에 대한 새로 고침 상태입니다. `FAIL`이면 `tasks()` 명령을 사용하여 실패 원인을 더 자세히 확인할 수 있습니다([3.7 새로 고침 태스크(TASK) 정보 조회](#37-query-refresh-task-task-information) 참조).

**투명한 재작성 상태**:

- **정상 상태**: 현재 구체화된 뷰를 투명한 재작성에 사용할 수 있습니다.
- **비정상 / 사용 불가능 상태**: 구체화된 뷰를 투명한 재작성에 사용할 수 없지만 직접 쿼리는 가능합니다.

자세한 내용은 [MV_INFOS](../../../sql-manual/sql-functions/table-valued-functions/mv_infos)를 참조하세요.

### 3.7 새로 고침 태스크(TASK) 정보 조회 {#37-query-refresh-task-task-information}

각 구체화된 뷰에는 하나의 작업이 있으며, 새로 고칠 때마다 새 태스크가 생성됩니다. 작업과 태스크의 관계는 1:n입니다. 구체화된 뷰 이름으로 태스크 상태를 확인하려면 다음을 실행합니다.

```sql
SELECT *
FROM tasks("type"="mv")
WHERE
    MvDatabaseName = 'mv_db_name' AND
    mvName = 'mv_name'
ORDER BY CreateTime DESC \G
```

반환 결과 예시:

```text
*************************** 1. row ***************************
               TaskId: 167019363907545
                JobId: 139872
              JobName: inner_mtmv_139570
                 MvId: 139570
               MvName: mv11
         MvDatabaseId: 16813
       MvDatabaseName: regression_test_nereids_rules_p0_mv
               Status: SUCCESS
             ErrorMsg:
           CreateTime: 2024-06-21 10:31:43
            StartTime: 2024-06-21 10:31:43
           FinishTime: 2024-06-21 10:31:45
           DurationMs: 2466
          TaskContext: {"triggerMode":"SYSTEM","isComplete":false}
          RefreshMode: COMPLETE
NeedRefreshPartitions: ["p_20231023_20231024","p_20231019_20231020","p_20231020_20231021","p_20231027_20231028","p_20231030_20231031","p_20231018_20231019","p_20231024_20231025","p_20231021_20231022","p_20231029_20231030","p_20231028_20231029","p_20231025_20231026","p_20231022_20231023","p_20231031_20231101","p_20231016_20231017","p_20231026_20231027"]
  CompletedPartitions: ["p_20231023_20231024","p_20231019_20231020","p_20231020_20231021","p_20231027_20231028","p_20231030_20231031","p_20231018_20231019","p_20231024_20231025","p_20231021_20231022","p_20231029_20231030","p_20231028_20231029","p_20231025_20231026","p_20231022_20231023","p_20231031_20231101","p_20231016_20231017","p_20231026_20231027"]
             Progress: 100.00% (15/15)
          LastQueryId: fe700ca3d6504521-bb522fc9ccf615e3
```

**주요 필드 설명**:

- **`NeedRefreshPartitions` / `CompletedPartitions`**: 이 태스크에서 새로 고쳐야 하는 파티션과 새로 고침이 완료된 파티션입니다.
- **`Status`**: `FAILED`는 실행 실패를 나타냅니다. `ErrorMsg`로 원인을 확인하거나 `LastQueryId`로 Doris 로그를 검색하여 상세 정보를 확인할 수 있습니다. 현재는 태스크가 실패하면 기존 구체화된 뷰를 사용할 수 없게 됩니다. 향후에는 태스크가 실패하더라도 기존 구체화된 뷰를 투명한 재작성에 계속 사용할 수 있도록 변경될 예정입니다.
- **`ErrorMsg`**: 실패 원인입니다.
- **`RefreshMode`**:
    - `COMPLETE`: 모든 파티션을 새로 고쳤습니다.
    - `PARTIAL`: 일부 파티션을 새로 고쳤습니다.
    - `NOT_REFRESH`: 새로 고칠 파티션이 없습니다.

:::info 참고
- 현재 저장 및 표시되는 태스크 수의 기본값은 100입니다. `max_persistence_task_count`를 `fe.conf`에서 수정하여 변경할 수 있습니다. 이 수를 초과하면 오래된 태스크 기록이 삭제되며, 값이 1보다 작으면 영구 저장하지 않습니다. 이 구성은 FE를 재시작해야 적용됩니다.
- 구체화된 뷰를 생성할 때 `grace_period` 속성을 설정하면, `SyncWithBaseTables`가 `false` 또는 `0`이더라도 경우에 따라 구체화된 뷰를 투명한 재작성에 사용할 수 있습니다.
- `grace_period`의 단위는 초이며, 구체화된 뷰와 베이스 테이블 데이터 사이에 허용되는 불일치 시간을 나타냅니다.
    - `0`으로 설정: 투명한 재작성을 적용하려면 구체화된 뷰 데이터가 베이스 테이블 데이터와 완전히 일치해야 합니다.
    - `10`으로 설정: 10초의 지연을 허용하며, 10초 이내에는 구체화된 뷰를 투명한 재작성에 사용할 수 있습니다.
:::

자세한 내용은 [TASKS](../../../sql-manual/sql-functions/table-valued-functions/tasks)를 참조하세요.

### 3.8 구체화된 뷰에 해당하는 JOB 조회 {#38-query-the-job-corresponding-to-a-materialized-view}

```sql
SELECT *
FROM jobs("type"="mv")
WHERE Name = "inner_mtmv_75043";
```

자세한 내용은 [JOBS](../../../sql-manual/sql-functions/table-valued-functions/jobs)를 참조하세요.

### 3.9 구체화된 뷰의 파티션 정보 조회 {#39-query-materialized-view-partition-information}

파티션으로 나뉜 구체화된 뷰에서는 `SHOW PARTITIONS`를 사용하여 `SyncWithBaseTables` 상태를 확인합니다.

```sql
SHOW PARTITIONS FROM mv_name;
```

반환 결과 예시:

```Plain
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| PartitionId | PartitionName       | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range                                                                          | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize  | IsInMemory | ReplicaAllocation       | IsMutable | SyncWithBaseTables | UnsyncTables |
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| 140189      | p_20231016_20231017 | 1              | 2024-06-21 10:31:45 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-16]; ..types: [DATEV2]; keys: [2023-10-17]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000     | false      | tag.location.default: 1 | true      | true               | []           |
| 139995      | p_20231018_20231019 | 2              | 2024-06-21 10:31:44 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-18]; ..types: [DATEV2]; keys: [2023-10-19]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 880.000 B | false      | tag.location.default: 1 | true      | true               | []           |
| 139898      | p_20231019_20231020 | 2              | 2024-06-21 10:31:43 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-19]; ..types: [DATEV2]; keys: [2023-10-20]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 878.000 B | false      | tag.location.default: 1 | true      | true               | []           |
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
```

주로 확인할 필드는 `SyncWithBaseTables`입니다. `true`이면 해당 파티션을 투명한 재작성에 사용할 수 있고, `false`이면 사용할 수 없습니다.

자세한 내용은 [SHOW PARTITIONS](../../../sql-manual/sql-statements/table-and-view/table/SHOW-PARTITIONS)를 참조하세요.

### 3.10 구체화된 뷰의 스키마 확인 {#310-view-the-schema-of-a-materialized-view}

자세한 내용은 [DESCRIBE](../../../sql-manual/sql-statements/table-and-view/table/DESC-TABLE)를 참조하세요.

### 3.11 관련 구성 {#311-related-configuration}

<!-- Knowledge type: Reference documentation -->
<!-- Applicable scenarios: Tuning materialized view transparent rewrite behavior -->

#### 3.11.1 세션 변수 스위치 {#3111-session-variable-switches}

| 스위치 | 설명 |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `SET enable_nereids_planner = true;`                                           | 비동기 구체화된 뷰는 새 옵티마이저에서만 지원됩니다. 투명한 재작성이 적용되지 않으면 이 스위치를 활성화하세요. |
| `SET enable_materialized_view_rewrite = true;`                                 | 투명한 쿼리 재작성을 활성화하거나 비활성화합니다. 버전 2.1.5부터 기본적으로 활성화됩니다. |
| `SET materialized_view_rewrite_enable_contain_external_table = true;`          | 투명한 재작성에 참여하는 구체화된 뷰에 외부 테이블을 포함할 수 있는지 지정합니다. 기본적으로 허용하지 않습니다. 구체화된 뷰의 정의 SQL에 외부 테이블이 포함되어 있고 해당 뷰를 투명한 재작성에 참여시키려면 이 스위치를 활성화하세요. |
| `SET materialized_view_rewrite_success_candidate_num = 3;`                     | 재작성에 성공한 결과 중 CBO 후보로 참여할 수 있는 최대 개수입니다. 기본값은 3입니다. 투명한 재작성이 느리면 이 값을 줄이세요. |
| `SET enable_materialized_view_union_rewrite = true;`                           | 파티션으로 나뉜 구체화된 뷰가 쿼리에 필요한 모든 데이터를 제공하지 못할 때, 베이스 테이블과 구체화된 뷰를 `UNION ALL`로 결합하여 쿼리에 응답하도록 허용할지 지정합니다. 기본적으로 허용합니다. 구체화된 뷰를 활용할 때 데이터 오류가 발견되면 이 스위치를 비활성화하세요. |
| `SET enable_materialized_view_nest_rewrite = true;`                            | 중첩 재작성을 허용할지 지정합니다. 기본적으로 허용하지 않습니다. 쿼리 SQL이 복잡하여 중첩 구체화된 뷰를 생성하고 활용해야 하는 경우 활성화하세요. |
| `SET materialized_view_relation_mapping_max_count = 8;`                        | 투명한 재작성 중 허용되는 관계 매핑의 최대 개수입니다. 이 한도를 초과하는 매핑은 잘립니다. 관계 매핑은 일반적으로 셀프 조인으로 생성되며, 개수는 카티션 곱으로 계산됩니다(예를 들어 3개의 테이블이 8개의 조합을 생성할 수 있습니다). 기본값은 8입니다. 투명한 재작성이 느리면 이 값을 줄이세요. |
| `SET enable_dml_materialized_view_rewrite = true;`                             | DML 중 구조 정보를 기반으로 하는 구체화된 뷰의 투명한 재작성을 활성화할지 지정합니다. 기본적으로 활성화됩니다. |
| `SET enable_dml_materialized_view_rewrite_when_base_table_unawareness = true;` | 구체화된 뷰에 데이터 변경을 실시간으로 감지할 수 없는 외부 테이블이 포함된 경우, DML 중 구조 정보를 기반으로 하는 투명한 재작성을 활성화할지 지정합니다. 기본적으로 비활성화됩니다. |

#### 3.11.2 fe.conf 구성 {#3112-feconf-configuration}

| 구성 항목 | 설명 |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| `job_mtmv_task_consumer_thread_num` | 동시에 실행할 수 있는 구체화된 뷰 새로 고침 태스크 수를 제어합니다. 기본값은 10이며, 이 수를 초과하는 태스크는 대기 상태로 전환됩니다. 이 값을 수정하려면 FE를 재시작해야 합니다. |
