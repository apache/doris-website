---
title: 비동기 구체화된 뷰 FAQ
description: "비동기 구체화된 뷰 FAQ 빠른 참조: 빌드 오류, 새로 고침 예외, 투명한 재작성 미적중, 사용 불가 상태를 진단하고 해결하는 방법입니다."
keywords:
    - 비동기 구체화된 뷰 FAQ
    - 구체화된 뷰 새로 고침 실패
    - 투명한 재작성 미적중
    - 파티션 구체화된 뷰 오류
    - Unable to find a suitable base table for partitioning
    - MaterializedViewRewriteFail
    - grace_period
    - excluded_trigger_tables
---

<!-- Knowledge type: Troubleshooting / FAQ -->
<!-- Applicable scenarios: Diagnosing issues during async materialized view build, refresh, and query rewrite -->

이 문서는 비동기 구체화된 뷰를 사용할 때 자주 발생하는 질문과 문제 해결 방법을 정리합니다. 한 문장으로 정의하면, **비동기 구체화된 뷰**는 요청 시 또는 일정에 따라 기본 테이블의 데이터로 새로 고침되는 사전 계산된 결과 집합이며, 쿼리를 투명하게 재작성하여 쿼리 실행을 가속하는 데 사용할 수 있습니다.

## 빠른 탐색 {#quick-navigation}

<!-- Knowledge type: Index -->
<!-- Applicable scenarios: Quickly locating issues and the corresponding sections -->

문제는 사용 단계에 따라 두 가지 범주로 나뉘며, 부록에는 원인 참조 자료가 있습니다.

| 시나리오 범주 | 다루는 문제 | 키워드 |
| --- | --- | --- |
| [빌드 및 새로 고침](#build-and-refresh) | 생성 오류, 새로 고침 전략, 스키마 변경, 리소스 사용량 | `BUILD`, `REFRESH`, `workload_group` |
| [쿼리 및 투명한 재작성](#query-and-transparent-rewrite) | 적중 여부, 미적중 원인, 사용 불가 상태 | `explain`, `MaterializedViewRewrite`, `grace_period` |
| [부록](#appendix) | 투명한 재작성 실패 원인 표, 파티션 빌드 실패 원인 표 | 요약 참조 표 |

일반적인 문제를 빠르게 찾기 위한 체크리스트입니다.

- 파티션 구체화된 뷰를 생성할 때 `Unable to find a suitable base table for partitioning` 오류가 발생하면 [Q12](#q12-error-when-building-a-partition-materialized-view)와 [부록 2](#appendix-2-async-materialized-view-partition-build-failure-causes)를 참조하세요.
- 생성 문에서 `Syntax error`가 발생하면 [Q13](#q13-syntax-error-when-creating-a-materialized-view)을 참조하세요.
- 새로 고침은 성공했지만 구체화된 뷰에 데이터가 없으면 [Q14](#q14-the-materialized-view-still-has-no-data-after-a-successful-refresh)를 참조하세요.
- 파티션 구체화된 뷰가 매번 전체 새로 고침을 수행하면 [Q15](#q15-why-does-a-partition-materialized-view-do-a-full-refresh-every-time)를 참조하세요.
- 투명한 재작성이 적중하지 않으면 [쿼리 및 투명한 재작성 Q1/Q2](#q1-how-to-confirm-whether-a-query-hits-the-materialized-view)와 [부록 1](#appendix-1-transparent-rewrite-failure-summary-information)을 참조하세요.

## 빌드 및 새로 고침 {#build-and-refresh}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Issues during materialized view creation, refresh, and modification -->

### Q1: 구체화된 뷰는 새로 고침할 파티션을 어떻게 결정하나요? {#q1-how-does-the-materialized-view-determine-which-partitions-need-to-be-refreshed}

Doris는 내부적으로 구체화된 뷰와 기본 테이블 간의 파티션 매핑을 계산하고, 마지막으로 성공한 새로 고침에 사용된 기본 테이블 파티션의 버전을 기록합니다. 다음 새로 고침 시에는 현재 버전과 비교하여 파티션을 새로 고침해야 하는지 판단합니다.

**예시**: 구체화된 뷰 `mv1`은 기본 테이블 `t1`과 `t2`에서 생성되며, `t1`을 기준으로 파티셔닝됩니다. 파티션 `p202003`(`mv1`)이 파티션 `p20200301` 및 `p20200302`(`t1`)에 대응한다고 가정합니다.

- `p202003`을 새로 고침한 후에는 `p20200301`, `p20200302` 및 테이블 `t2`의 현재 버전을 기록합니다.
- 다음 새로 고침 시 `p20200301`, `p20200302` 또는 `t2`의 버전이 변경되었다면 `p202003`을 새로 고침해야 합니다.

**업무상 제외 설정**: 업무 관점에서 `t2`의 변경으로 `mv1`의 새로 고침이 트리거되어서는 안 된다면, 구체화된 뷰 속성 `excluded_trigger_tables`로 설정할 수 있습니다.

### Q2: 구체화된 뷰가 리소스를 너무 많이 사용하여 다른 워크로드에 영향을 주면 어떻게 하나요? {#q2-what-if-the-materialized-view-consumes-too-many-resources-and-affects-other-workloads}

구체화된 뷰 속성으로 [workload_group](../../../admin-manual/workload-management/workload-group.md)을 지정하여 구체화된 뷰 새로 고침 작업의 리소스 사용량을 제어할 수 있습니다.

**주의 사항**: 메모리 설정이 너무 작고 단일 파티션 새로 고침에 그보다 많은 메모리가 필요하면 새로 고침 작업이 실패합니다. 업무 요구 사항에 따라 설정을 조정하세요.

### Q3: 기존 구체화된 뷰를 기반으로 새 구체화된 뷰를 생성할 수 있나요? {#q3-can-a-new-materialized-view-be-created-based-on-an-existing-materialized-view}

네, Doris 2.1.3부터 지원됩니다.

**참고**: 각 구체화된 뷰의 새로 고침 로직은 독립적입니다. 예를 들어 `mv2`가 `mv1`을 기반으로 생성되고, `mv1`이 `t1`을 기반으로 생성된 경우, `mv2`를 새로 고칠 때는 `mv1`과 `t1`의 데이터가 동기화되어 있는지 고려하지 않습니다.

### Q4: Doris는 어떤 외부 테이블에 대해 구체화된 뷰를 지원하나요? {#q4-which-external-tables-does-doris-support-for-materialized-views}

Doris가 지원하는 모든 외부 테이블로 구체화된 뷰를 생성할 수 있습니다. 다만 현재 **파티션 새로 고침은 Hive만 지원합니다**. 다른 유형은 향후 릴리스에서 지원될 예정입니다.

### Q5: 구체화된 뷰가 Hive 데이터와 일치하는 것처럼 보이지만 실제로는 일치하지 않음 {#q5-the-materialized-view-appears-consistent-with-hive-data-but-is-actually-inconsistent}

구체화된 뷰는 자신의 데이터가 Catalog를 통해 쿼리한 결과와 일치한다는 것만 보장할 수 있습니다.

Catalog에는 일부 메타데이터 및 데이터 캐시가 있으므로, 구체화된 뷰를 Hive의 데이터와 일치시키려면 `Refresh Catalog` 등의 방법으로 Catalog의 데이터가 Hive의 데이터와 일치하도록 해야 합니다.

### Q6: 구체화된 뷰는 Schema Change를 지원하나요? {#q6-does-the-materialized-view-support-schema-change}

수정은 지원하지 않습니다. 구체화된 뷰의 컬럼 속성은 뷰를 정의하는 SQL에서 추론되며, 현재 사용자가 명시적으로 수정하는 기능은 지원하지 않습니다.

### Q7: 구체화된 뷰가 사용하는 기본 테이블에서 Schema Change가 허용되나요? {#q7-are-schema-changes-allowed-on-the-base-tables-used-by-a-materialized-view}

네, 다만 수정 후에는 다음과 같은 상태 변경이 발생합니다.

- 이 기본 테이블을 사용하는 모든 구체화된 뷰의 상태가 `NORMAL`에서 `SCHEMA_CHANGE`로 변경됩니다.
- `SCHEMA_CHANGE` 상태에서는 구체화된 뷰를 투명한 재작성에 사용할 수 없지만, 구체화된 뷰를 직접 쿼리할 수는 있습니다.
- 구체화된 뷰의 다음 새로 고침 작업이 성공하면 상태가 `SCHEMA_CHANGE`에서 다시 `NORMAL`로 변경됩니다.

### Q8: Unique Key 모델의 테이블로 구체화된 뷰를 생성할 수 있나요? {#q8-can-a-table-with-the-unique-key-model-be-used-to-create-a-materialized-view}

네, 구체화된 뷰는 기본 테이블의 데이터 모델에 제한을 두지 않습니다. 다만 **구체화된 뷰 자체는 Duplicate Key 모델만 사용할 수 있습니다**.

### Q9: 구체화된 뷰에도 인덱스를 생성할 수 있나요? {#q9-can-indexes-still-be-created-on-a-materialized-view}

네, 가능합니다.

### Q10: 구체화된 뷰를 새로 고침하면 테이블이 잠기나요? {#q10-does-refreshing-a-materialized-view-lock-the-table}

새로 고침 과정에서는 매우 짧은 단계에서만 테이블을 잠그며, 테이블 잠금을 계속 유지하지는 않습니다. 잠금 시간은 데이터를 적재할 때의 잠금 시간과 대략 비슷합니다.

### Q11: 구체화된 뷰는 준실시간 시나리오에 적합한가요? {#q11-are-materialized-views-suitable-for-near-real-time-scenarios}

비동기 구체화된 뷰는 실시간 일관성을 제공하지 않습니다. 일반적인 파티션 단위 증분 새로 고침의 최소 계산 단위는 파티션입니다. Doris 5.0.0부터는 [증분 뷰 유지 관리(IVM)](incremental-materialized-view)를 통해 두 번의 새로 고침 사이에 발생한 행 수준 변경만 처리할 수 있어, 빈번한 소규모 배치 변경의 계산 비용을 줄일 수 있습니다. 그러나 데이터 최신성은 여전히 트리거 시점, 대기열 및 새로 고침 시간에 따라 달라집니다. 결과가 기본 테이블과 트랜잭션 수준에서 일관되어야 한다면 동기 구체화된 뷰를 사용하세요.

### Q12: 파티션 구체화된 뷰 빌드 시 오류 {#q12-error-when-building-a-partition-materialized-view}

**오류 메시지**:

```text
Unable to find a suitable base table for partitioning
```

**원인 분석**:

일반적으로 구체화된 뷰의 SQL 정의와 선택한 파티션 컬럼으로는 파티션 증분 업데이트를 수행할 수 없어, 파티션 구체화된 뷰 생성 시 오류가 발생합니다.

- 구체화된 뷰가 파티션 증분 업데이트를 수행하려면 관련 요구 사항을 충족해야 합니다. 자세한 내용은 [구체화된 뷰 새로 고침 모드](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW.md#optional-parameters)를 참조하세요.
- 최신 버전에서는 파티션 빌드 실패의 구체적인 원인을 알려 줍니다. 원인과 설명을 정리한 내용은 [부록 2](#appendix-2-async-materialized-view-partition-build-failure-causes)를 참조하세요.

**예시**:

아래의 두 기본 테이블은 `orders`(파티션 있음)와 `lineitem`(파티션 없음)입니다.

```sql
CREATE TABLE IF NOT EXISTS orders (
  o_orderkey INTEGER NOT NULL, 
  o_custkey INTEGER NOT NULL, 
  o_orderstatus CHAR(1) NOT NULL, 
  o_totalprice DECIMALV3(15, 2) NOT NULL, 
  o_orderdate DATE NOT NULL, 
  o_orderpriority CHAR(15) NOT NULL, 
  o_clerk CHAR(15) NOT NULL, 
  o_shippriority INTEGER NOT NULL, 
  O_COMMENT VARCHAR(79) NOT NULL
) DUPLICATE KEY(o_orderkey, o_custkey) PARTITION BY RANGE(o_orderdate) (
  FROM 
    ('2024-05-01') TO ('2024-06-30') INTERVAL 1 DAY
) DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3;


CREATE TABLE IF NOT EXISTS lineitem (
  l_orderkey INTEGER NOT NULL, 
  l_partkey INTEGER NOT NULL, 
  l_suppkey INTEGER NOT NULL, 
  l_linenumber INTEGER NOT NULL, 
  l_quantity DECIMALV3(15, 2) NOT NULL, 
  l_extendedprice DECIMALV3(15, 2) NOT NULL, 
  l_discount DECIMALV3(15, 2) NOT NULL, 
  l_tax DECIMALV3(15, 2) NOT NULL, 
  l_returnflag CHAR(1) NOT NULL, 
  l_linestatus CHAR(1) NOT NULL, 
  l_shipdate DATE NOT NULL, 
  l_commitdate DATE NOT NULL, 
  l_receiptdate DATE NOT NULL, 
  l_shipinstruct CHAR(25) NOT NULL, 
  l_shipmode CHAR(10) NOT NULL, 
  l_comment VARCHAR(44) NOT NULL
) DUPLICATE KEY(
  l_orderkey, l_partkey, l_suppkey, 
  l_linenumber
) DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3;
```

구체화된 뷰는 다음과 같이 정의됩니다. `orders.o_orderdate`를 파티션 컬럼으로 선택하면 파티션 증분 업데이트가 지원됩니다. 반면 `lineitem.l_shipdate`를 사용하면 증분 업데이트를 수행할 수 없습니다.

```sql
CREATE MATERIALIZED VIEW mv_1 
       BUILD IMMEDIATE 
       REFRESH AUTO ON MANUAL 
       partition by(o_orderdate) 
       DISTRIBUTED BY RANDOM BUCKETS 2
       AS 
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  o_orderdate, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
WHERE 
  o_orderdate <= DATE '2024-06-30' 
  AND o_orderdate >= DATE '2024-05-01' 
GROUP BY 
  l_linestatus, 
  o_orderdate, 
  o_shippriority;
```

**`lineitem.l_shipdate`를 파티션 컬럼으로 선택할 수 없는 이유**:

1. `lineitem.l_shipdate`는 기본 테이블의 파티션 컬럼이 아닙니다. 실제로 `lineitem` 테이블에는 파티션 컬럼이 설정되어 있지 않습니다.
2. `lineitem.l_shipdate`는 `null` 값을 생성하는 쪽에 있는 컬럼으로, 해당 값은 `outer join` 연산에서 생성됩니다.

### Q13: 구체화된 뷰 생성 시 구문 오류 {#q13-syntax-error-when-creating-a-materialized-view}

**오류 메시지**:

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Syntax error in line 1:
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
```

**가능한 원인**:

1. 비동기 구체화된 뷰 문은 새 옵티마이저에서만 지원됩니다. 새 옵티마이저를 사용 중인지 확인하세요.

    ```sql
    SET enable_nereids_planner = true;
    ```

2. 구체화된 뷰를 빌드하는 문에 **키워드 오타**가 있거나 **뷰를 정의하는 SQL에 구문 문제**가 있습니다. 구체화된 뷰 정의 SQL과 생성 문이 올바른지 확인하세요.

### Q14: 새로 고침에 성공한 후에도 구체화된 뷰에 데이터가 없음 {#q14-the-materialized-view-still-has-no-data-after-a-successful-refresh}

구체화된 뷰는 기본 테이블이나 해당 파티션의 버전 정보를 가져올 수 있어야 데이터 업데이트가 필요한지 판단할 수 있습니다.

현재 버전 정보 조회를 지원하지 않는 데이터 레이크(예: JDBC Catalog)의 경우, 새로 고침 과정에서는 구체화된 뷰를 업데이트할 필요가 없는 것으로 판단합니다. **따라서 이러한 구체화된 뷰를 생성하거나 새로 고칠 때는 `complete`를 지정하고, `auto`를 사용하지 마세요**.

데이터 레이크에 대한 구체화된 뷰 지원 현황은 [데이터 레이크 지원](./overview.md)을 참조하세요.

### Q15: 파티션 구체화된 뷰가 매번 전체 새로 고침을 수행하는 이유는 무엇인가요? {#q15-why-does-a-partition-materialized-view-do-a-full-refresh-every-time}

구체화된 뷰의 파티션 증분 새로 고침은 기본 테이블 파티션의 버전 정보에 의존합니다. 구체화된 뷰의 특정 파티션에 대응하는 기본 테이블 파티션 데이터가 마지막 새로 고침 이후 변경되었다면, 해당 파티션만 새로 고침합니다.

**가능한 원인**:

구체화된 뷰 정의 SQL에서 **파티션을 추적하지 않는 테이블**의 데이터가 변경되어, 새로 고침 시 업데이트해야 할 파티션을 판단할 수 없으므로 전체 새로 고침만 가능합니다.

**예시**:

이 구체화된 뷰는 `o_orderdate` 파티션을 추적하며, 해당 파티션은 `orders` 테이블에 있습니다. 그러나 `lineitem` 또는 `partsupp`의 데이터가 변경되면 구체화된 뷰는 업데이트해야 할 파티션을 판단할 수 없어 전체 새로 고침만 수행할 수 있습니다.

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

**문제 해결 단계**:

- **목표**: 구체화된 뷰가 추적하는 기본 테이블과 파티션 컬럼을 확인합니다.
- **명령**:

    ```sql
    SELECT * 
    FROM mv_infos('database'='db_name')
    WHERE Name = 'partition_mv' \G 
    ```

- **설명**: 결과에서 `MvPartitionInfo.partitionType`이 `FOLLOW_BASE_TABLE`이면 구체화된 뷰의 파티션이 기본 테이블의 파티션을 따른다는 뜻입니다. `relatedCol`이 `o_orderdate`이면 이 컬럼을 기준으로 파티셔닝한다는 뜻입니다.

    ```text
                    Id: 1752809156450
                  Name: partition_mv
               JobName: inner_mtmv_1752809156450
                 State: NORMAL
    SchemaChangeDetail: 
          RefreshState: SUCCESS
           RefreshInfo: BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 DAY STARTS "2024-12-01 20:30:00"
              QuerySql: SELECT
                        `internal`.`doc_db`.`orders`.`o_orderdate`,
                        `internal`.`doc_db`.`lineitem`.`l_orderkey`,
                        `internal`.`doc_db`.`lineitem`.`l_partkey`
                        FROM
                        `internal`.`doc_db`.`orders`
                        LEFT JOIN `internal`.`doc_db`.`lineitem` ON `internal`.`doc_db`.`lineitem`.`l_orderkey` = `internal`.`doc_db`.`orders`.`o_orderkey`
                        LEFT JOIN `internal`.`doc_db`.`partsupp` ON `internal`.`doc_db`.`partsupp`.`ps_partkey` = `internal`.`doc_db`.`lineitem`.`l_partkey`
                        and `internal`.`doc_db`.`lineitem`.`l_suppkey` = `internal`.`doc_db`.`partsupp`.`ps_suppkey`
       MvPartitionInfo: MTMVPartitionInfo{partitionType=EXPR, relatedTable=orders, relatedCol='o_orderdate', partitionCol='o_orderdate'}
    SyncWithBaseTables: 1
    ```

**해결 방법**:

변경된 데이터가 `lineitem` 또는 `partsupp` 테이블에 있고 이러한 변경이 구체화된 뷰에 영향을 주지 않는다면, `excluded_trigger_tables` 속성을 설정하여 해당 테이블의 변경으로 트리거되는 전체 새로 고침을 제외할 수 있습니다.

```sql
ALTER MATERIALIZED VIEW partition_mv set("excluded_trigger_tables"="lineitem,partsupp");
```

### Q16: IVM과 파티션 단위 증분 새로 고침의 차이는 무엇인가요? {#q16-what-is-the-difference-between-ivm-and-partitioned-incremental-refresh}

IVM은 `INCREMENTAL`에 해당하며 두 번의 새로 고침 사이에 발생한 기본 테이블의 행 수준 변경만 계산합니다. 파티션 단위 증분 새로 고침은 `PARTITIONS`에 해당하며, 영향을 받는 각 구체화된 뷰 파티션 전체를 다시 계산합니다. 변경된 행의 수가 영향을 받는 파티션의 행 수보다 훨씬 적으면 일반적으로 IVM이 계산량을 줄여 줍니다. 자세한 비교는 [증분 뷰 유지 관리(IVM)](incremental-materialized-view#differences-from-partition-level-incremental-refresh)를 참조하세요.

### Q17: IVM이 전체 새로 고침으로 폴백하는 이유는 무엇인가요? {#q17-why-does-an-ivm-fall-back-to-a-complete-refresh}

`INCREMENTAL FALLBACK`과 `AUTO`는 증분 결과를 안전하게 계산할 수 없을 때 폴백합니다. 예를 들어 삭제된 값으로 인해 `MIN` 또는 `MAX`가 변경되거나, 삭제가 Bitmap 집계에 영향을 주거나, 변경 로그의 연속성이 깨지거나, 델타 계획의 구조가 변경된 경우입니다. 정형화된 폴백 사유는 `IvmFallbackReason`에서 확인할 수 있으며, 이는 `tasks("type"="mv")`의 필드입니다. [새로 고침 및 폴백](incremental-materialized-view#refresh-and-fallback)을 참조하세요.

## 쿼리 및 투명한 재작성 {#query-and-transparent-rewrite}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Diagnosing materialized view hit rate and transparent rewrite failures -->

### Q1: 쿼리가 구체화된 뷰에 적중했는지 확인하는 방법 {#q1-how-to-confirm-whether-a-query-hits-the-materialized-view}

`explain query_sql`을 사용하면 구체화된 뷰 적중 상태의 요약을 확인할 수 있습니다.

**구체화된 뷰 예시**:

```sql
CREATE MATERIALIZED VIEW mv11
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
partition by(l_shipdate)
DISTRIBUTED BY HASH(l_orderkey) BUCKETS 10
AS
SELECT l_shipdate, l_orderkey, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE;
```

**explain 실행**:

```sql
explain
SELECT l_shipdate, l_orderkey, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE;
```

**결과 해석**:

구체화된 뷰 적중 정보는 계획의 마지막 부분에 있습니다. 주요 필드의 의미는 다음과 같습니다.

| 필드 | 의미 |
| --- | --- |
| `MaterializedViewRewriteSuccessAndChose` | 투명한 재작성에 성공하고 CBO가 최종적으로 사용하도록 선택한 구체화된 뷰 이름 목록 |
| `MaterializedViewRewriteSuccessButNotChose` | 투명한 재작성에는 성공했지만 CBO가 선택하지 않은 구체화된 뷰 이름 목록(실행 계획에서 사용하지 않음) |
| `MaterializedViewRewriteFail` | 투명한 재작성에 실패한 구체화된 뷰와 원인 요약 목록 |

`MaterializedView` 관련 정보가 `explain`의 끝부분에 나타나지 않으면, 구체화된 뷰가 사용 불가 상태이므로 투명한 재작성에 참여할 수 없습니다. 구체화된 뷰가 사용 불가 상태가 되는 상황은 사용법 및 실습 - 구체화된 뷰 상태 확인을 참조하세요.

**출력 예시**:

```text
| MaterializedView                                                                   |
| MaterializedViewRewriteSuccessAndChose:                                            |
| internal#regression_test_nereids_rules_p0_mv#mv11,                                 |
|                                                                                    |
| MaterializedViewRewriteSuccessButNotChose:                                         |
|                                                                                    |
| MaterializedViewRewriteFail:                                                       |
+------------------------------------------------------------------------------------+
```

### Q2: 구체화된 뷰에 적중하지 않는 이유는 무엇인가요? {#q2-what-are-the-reasons-for-a-materialized-view-not-being-hit}

먼저 [Q1](#q1-how-to-confirm-whether-a-query-hits-the-materialized-view)에 따라 적중 여부를 확인하세요.

```sql
explain
your_query_sql;
```

**미적중의 가능한 원인**:

1. Doris 2.1.3 이전 버전에서는 구체화된 뷰의 투명한 재작성 기능이 기본적으로 비활성화되어 있습니다. 투명한 재작성을 적용하려면 해당 스위치를 켜야 합니다. 구체적인 스위치는 비동기 구체화된 뷰 관련 스위치를 참조하세요.
2. 구체화된 뷰가 사용 불가 상태일 수 있습니다. 구체화된 뷰의 빌드 상태를 확인하려면 구체화된 뷰 상태 확인을 참조하세요.
3. 앞의 두 항목을 확인한 후에도 적중하지 않는다면, 구체화된 뷰 정의 SQL과 쿼리 SQL이 현재 투명한 재작성 기능의 지원 범위를 벗어날 수 있습니다. 자세한 내용은 [구체화된 뷰의 투명한 재작성 기능](../../../query-acceleration/materialized-view/async-materialized-view/functions-and-demands.md#22-transparent-query-rewrite)을 참조하세요.
4. 미적중에 대한 자세한 요약 정보와 설명은 [부록 1](#appendix-1-transparent-rewrite-failure-summary-information)을 참조하세요.

아래의 두 예시는 일반적인 투명한 재작성 실패 시나리오를 보여 줍니다.

#### 사례 1: 조인 순서 불일치로 인한 재작성 실패 {#case-1-inconsistent-join-order-causes-rewrite-failure}

**구체화된 뷰 생성**:

```sql
CREATE MATERIALIZED VIEW mv11
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
partition by(l_shipdate)
DISTRIBUTED BY HASH(l_orderkey) BUCKETS 10
PROPERTIES ('replication_num' = '1') 
AS
SELECT l_shipdate, l_orderkey, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE;
```

**쿼리 실행**:

```sql
explain
SELECT l_shipdate, l_linestatus, O_ORDERDATE, count(*)
FROM orders 
LEFT OUTER JOIN lineitem on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_linestatus, O_ORDERDATE;
```

**Explain 출력**:

```text
| MaterializedView                                                                                          |
| MaterializedViewRewriteSuccessAndChose:                                                                   |
|                                                                                                           |
| MaterializedViewRewriteSuccessButNotChose:                                                                |
|                                                                                                           |
| MaterializedViewRewriteFail:                                                                              |
|   Name: internal#doc_test#mv11                                                                            |
|   FailSummary: View struct info is invalid, The graph logic between query and view is not consistent      |
```

`MaterializedViewRewriteFail`에 포함된 실패 요약 `The graph logic between query and view is not consistent`는 쿼리와 구체화된 뷰의 조인 로직이 일치하지 않음을 나타냅니다. 조인 유형이나 조인되는 테이블이 서로 다르다는 뜻입니다. 이 예시에서는 쿼리와 구체화된 뷰의 테이블 조인 순서가 일치하지 않아 이 오류가 발생합니다. 전체 요약 설명은 [부록 1](#appendix-1-transparent-rewrite-failure-summary-information)을 참조하세요.

#### 사례 2: 구체화된 뷰가 쿼리의 차원을 포함하지 않음 {#case-2-dimensions-not-covered-by-the-materialized-view}

**쿼리 실행**:

```sql
explain
SELECT l_shipdate, l_linestatus, O_ORDERDATE, count(*)
FROM lineitem
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_linestatus, O_ORDERDATE;
```

**Explain 출력**:

```text
| MaterializedView                                                                                                          |
| MaterializedViewRewriteSuccessAndChose:                                                                                   |
|                                                                                                                           |
| MaterializedViewRewriteSuccessButNotChose:                                                                                |
|                                                                                                                           |
| MaterializedViewRewriteFail:                                                                                              |
|   Name: internal#doc_test#mv11                                                                                            |
|   FailSummary: View struct info is invalid, View dimensions doesn't not cover the query dimensions                        |
```

실패 요약 `View dimensions doesn't not cover the query dimensions`는 쿼리의 `group by` 컬럼을 구체화된 뷰의 `group by` 컬럼에서 얻을 수 없어 이 오류가 발생했음을 나타냅니다.

### Q3: 어떤 상황에서 구체화된 뷰의 상태가 변경되어 사용할 수 없게 되나요? {#q3-what-situations-cause-a-materialized-views-state-to-change-and-become-unavailable}

"사용 불가"란 **구체화된 뷰를 투명한 재작성에 사용할 수 없음**을 의미합니다. 구체화된 뷰 자체를 직접 쿼리하는 것은 가능합니다.

| 구체화된 뷰 유형 | 사용 불가를 유발하는 이벤트 | 영향 범위 |
| --- | --- | --- |
| 전체 구체화된 뷰 | 기본 테이블 데이터 변경 / 기본 테이블 스키마 변경 | 구체화된 뷰 전체가 사용 불가 |
| 파티션 구체화된 뷰 | 기본 테이블 데이터 변경 | 해당 파티션이 사용 불가 |
| 파티션 구체화된 뷰 | 기본 테이블 스키마 변경 | 구체화된 뷰 전체가 사용 불가 |

현재는 새로 고침에 실패해도 구체화된 뷰가 사용 불가 상태가 됩니다. 향후에는 새로 고침에 실패하더라도 기존 구체화된 뷰를 투명한 재작성에 계속 사용할 수 있도록 개선될 예정입니다.

### Q4: 구체화된 뷰를 직접 쿼리해도 데이터가 반환되지 않음 {#q4-direct-query-on-the-materialized-view-returns-no-data}

가능한 원인:

- 구체화된 뷰를 빌드 중입니다.
- 구체화된 뷰 빌드가 실패했습니다.

구체화된 뷰의 상태를 쿼리하여 확인할 수 있습니다. 자세한 내용은 구체화된 뷰 상태 확인을 참조하세요.

### Q5: 기본 테이블의 데이터가 변경되었지만 구체화된 뷰가 아직 새로 고침되지 않았다면 투명한 재작성은 어떻게 동작하나요? {#q5-when-base-table-data-changes-but-the-materialized-view-has-not-been-refreshed-what-is-the-transparent-rewrite-behavior}

비동기 구체화된 뷰의 데이터는 기본 테이블에 비해 일정한 지연이 있습니다. 투명한 재작성 동작은 기본 테이블 유형과 `grace_period` 임곗값에 따라 달라집니다.

**1. 내부 테이블 및 데이터 변경을 감지할 수 있는 외부 테이블(예: Hive)**:

`grace_period`는 구체화된 뷰와 기본 테이블의 데이터가 일치하지 않아도 허용되는 최대 시간입니다.

| `grace_period` 설정 | 재작성 동작 |
| --- | --- |
| `0` | 구체화된 뷰와 기본 테이블의 데이터가 완전히 일치해야 투명한 재작성에 사용할 수 있습니다. 데이터 변경을 감지할 수 없는 외부 테이블(Hive 이외)의 경우, 데이터의 최신 여부와 관계없이 구체화된 뷰를 투명한 재작성에 사용할 수 있습니다(데이터가 일치하지 않을 수 있음) |
| `10` (초) | 구체화된 뷰와 기본 테이블의 데이터 간에 최대 10초의 지연을 허용합니다. 지연이 10초 이내이면 구체화된 뷰를 투명한 재작성에 계속 사용할 수 있습니다 |

**2. 파티션 구체화된 뷰의 일부 파티션이 유효하지 않은 경우**:

- 쿼리가 유효하지 않은 파티션의 데이터를 사용하지 않으면 구체화된 뷰를 계속 사용할 수 있습니다.
- 쿼리가 유효하지 않은 파티션의 데이터를 사용하더라도 데이터 최신성이 `grace_period` 이내이면 구체화된 뷰를 계속 사용할 수 있습니다.
- 데이터 최신성이 `grace_period`를 초과하면 원본 테이블과 구체화된 뷰를 결합하여 쿼리를 처리할 수 있습니다. 이를 위해서는 union 재작성 스위치 `enable_materialized_view_union_rewrite`를 활성화해야 합니다. 이 스위치는 버전 2.1.5부터 기본적으로 활성화됩니다.

## 부록 {#appendix}

### 부록 1: 투명한 재작성 실패 요약 정보 {#appendix-1-transparent-rewrite-failure-summary-information}

<!-- Knowledge type: Reference table -->
<!-- Applicable scenarios: Locating the cause of transparent rewrite failure based on the FailSummary in explain output -->

| 요약 정보 | 설명 |
| --- | --- |
| View struct info is invalid | 구체화된 뷰의 구조 정보가 유효하지 않습니다. 현재 지원되는 재작성 SQL 패턴은 쿼리와 구체화된 뷰가 모두 조인인 경우, 또는 쿼리가 집계인 경우입니다. 후자의 경우 구체화된 뷰에 조인이 있을 필요는 없습니다. 각 투명한 재작성 규칙은 특정 SQL 패턴을 처리하며, 요구 사항에 맞지 않는 규칙이 적용되면 이 오류가 보고되므로 투명한 재작성 과정에서 이 문제가 자주 표시됩니다. 일반적으로 투명한 재작성 실패의 주된 원인은 아닙니다 |
| Materialized view rule exec fail | 투명한 재작성 규칙 실행 중 예외가 발생했습니다. `Explain memo plan query_sql`을 사용하여 구체적인 예외 스택을 확인하세요 |
| Match mode is invalid | 쿼리와 구체화된 뷰의 테이블 수가 일치하지 않습니다. 현재는 재작성이 지원되지 않습니다 |
| Query to view table mapping is null | 쿼리와 구체화된 뷰 간의 테이블 매핑 생성에 실패했습니다 |
| queryToViewTableMappings are over the limit and be intercepted | 쿼리에 자체 조인되는 테이블이 너무 많아 투명한 재작성의 탐색 공간이 지나치게 커졌으므로 투명한 재작성을 중단했습니다 |
| Query to view slot mapping is null | 쿼리 테이블과 구체화된 뷰 테이블 간의 슬롯 매핑 생성에 실패했습니다 |
| The graph logic between query and view is not consistent | 쿼리와 구체화된 뷰의 조인 유형이 다르거나 조인되는 테이블이 다릅니다 |
| Predicate compensate fail | 일반적으로 쿼리 조건의 범위가 구체화된 뷰의 범위를 벗어난 경우입니다. 예를 들어 쿼리는 `a > 10`이지만 구체화된 뷰는 `a > 15`인 경우입니다 |
| Rewrite compensate predicate by view fail | 조건식 보완에 실패했습니다. 일반적으로 쿼리에 구체화된 뷰보다 더 많은 조건이 있어 보완이 필요하지만, 해당 조건에 사용된 컬럼이 구체화된 뷰의 select 절에 없는 경우입니다 |
| Calc invalid partitions fail | 파티션 구체화된 뷰에서 쿼리가 사용하는 파티션의 유효성을 계산하는 데 실패했습니다 |
| mv can not offer any partition for query | 쿼리가 구체화된 뷰의 유효하지 않은 파티션만 사용합니다. `show partitions from mv_name`을 사용하여 파티션의 `SyncWithBaseTables` 필드가 true인지 확인하세요. false이면 해당 파티션을 수동으로 새로 고침하세요. 구체화된 뷰와 쿼리 데이터 사이에 일정한 지연을 허용할 수 있다면 구체화된 뷰의 `grace_period` 속성을 초 단위로 설정하세요 |
| Add filter to base table fail when union rewrite | 쿼리가 구체화된 뷰의 유효하지 않은 파티션을 사용했으며, 구체화된 뷰와 원본 테이블을 union all로 결합하려는 시도가 실패했습니다 |
| RewrittenPlan output logical properties is different with target group | 재작성이 완료되었지만 구체화된 뷰의 출력이 원래 쿼리와 일치하지 않습니다 |
| Rewrite expressions by view in join fail | 조인 재작성 중 쿼리에 사용된 필드나 표현식이 구체화된 뷰에 없습니다 |
| Rewrite expressions by view in scan fail | 단일 테이블 재작성 중 쿼리에 사용된 필드나 표현식이 구체화된 뷰에 없습니다 |
| Split view to top plan and agg fail, view doesn't not contain aggregate | 집계를 재작성할 때 구체화된 뷰에 집계가 없습니다 |
| Split query to top plan and agg fail | 집계를 재작성할 때 쿼리에 집계가 없습니다 |
| rewritten expression contains aggregate functions when group equals aggregate rewrite | 쿼리와 구체화된 뷰의 `group by` 절이 같은 경우, 재작성된 표현식에 집계 함수가 포함되어 있습니다 |
| Can not rewrite expression when no roll up | 쿼리와 구체화된 뷰의 `group by` 절이 같은 경우, 표현식 재작성에 실패했습니다 |
| Query function roll up fail | 집계 재작성 중 집계 함수의 rollup에 실패했습니다 |
| View dimensions do not cover the query dimensions | 쿼리의 `group by` 절에 사용된 일부 차원이 구체화된 뷰의 `group by` 절에 없습니다 |
| View dimensions don't not cover the query dimensions in bottom agg | 쿼리의 `group by` 절에 사용된 일부 차원이 구체화된 뷰의 `group by` 절에 없습니다 |
| View dimensions do not cover the query group set dimensions | 쿼리의 `group sets`에 사용된 일부 차원이 구체화된 뷰의 `group by` 절에 없습니다 |
| The only one of query or view is scalar aggregate and can not rewrite expression meanwhile | 쿼리에 `group by`가 있지만 구체화된 뷰에는 없습니다 |
| Both query and view have group sets, or query doesn't have but view has, not supported | 쿼리와 구체화된 뷰에 모두 `group sets`가 있거나, 쿼리에는 `group sets`가 없지만 구체화된 뷰에는 있습니다. 이 경우 투명한 재작성이 지원되지 않습니다 |

### 부록 2: 비동기 구체화된 뷰 파티션 빌드 실패 원인 {#appendix-2-async-materialized-view-partition-build-failure-causes}

<!-- Knowledge type: Reference table -->
<!-- Applicable scenarios: Locating causes when an error is reported while creating a partition materialized view -->

파티션 구체화된 뷰의 새로 고침은 파티션 증분 업데이트를 기반으로 동작합니다.

1. **1단계**: 구체화된 뷰의 파티션 컬럼을 기본 테이블의 파티션에 매핑할 수 있는지 계산합니다.
2. **2단계**: 구체적인 매핑 관계, 즉 파티션이 1:1인지 1:n인지 계산합니다.

| 요약 정보 | 설명 |
| --- | --- |
| partition column can not be found in the SQL select column | 구체화된 뷰 정의의 `partition by` 뒤에 사용된 컬럼은 구체화된 뷰 정의 SQL의 select 절에 있어야 합니다 |
| can't not find valid partition track column, because %s | 적합한 파티션 컬럼을 찾지 못했습니다. 구체적인 원인은 `because` 뒤에 표시됩니다 |
| partition track doesn't support mark join | 구체화된 뷰의 파티션 컬럼이 참조하는 컬럼이 mark join 입력 테이블의 파티션 컬럼입니다. 이는 지원되지 않습니다 |
| partition column is in un supported join null generate side | 구체화된 뷰의 파티션 컬럼이 참조하는 컬럼이 조인에서 null을 생성하는 쪽에 있습니다. 예를 들어 left join의 오른쪽에 있는 경우입니다 |
| relation should be LogicalCatalogRelation | 구체화된 뷰가 참조하는 파티션 기본 테이블의 스캔 유형은 `LogicalCatalogRelation`이어야 합니다. 다른 유형은 지원되지 않습니다 |
| self join doesn't support partition update | 자체 조인 SQL로 구체화된 뷰를 빌드하는 기능은 아직 지원되지 않습니다 |
| partition track already has a related base table column | 현재 구체화된 뷰가 참조하는 파티션 컬럼은 하나의 기본 테이블에 있는 파티션 컬럼만 참조할 수 있습니다 |
| relation base table is not MTMVRelatedTableIf | 구체화된 뷰가 참조하는 파티션 기본 테이블이 `MTMVRelatedTableIf`를 상속하지 않습니다. 이 인터페이스는 테이블의 파티셔닝 가능 여부를 나타냅니다 |
| The related base table is not partition table | 구체화된 뷰가 사용하는 기본 테이블이 파티션 테이블이 아닙니다 |
| The related base table partition column doesn't contain the mv partition | 구체화된 뷰의 `partition by` 뒤에서 참조한 컬럼이 파티션 기본 테이블에 없습니다 |
| group by sets is empty, doesn't contain the target partition | 구체화된 뷰 정의 SQL에 집계가 사용되었지만 `group by`가 비어 있습니다 |
| window partition sets don't contain the target partition | 윈도우 함수가 사용되었지만 구체화된 뷰가 참조하는 파티션 컬럼이 `partition by` 절에 없습니다 |
| Unsupported plan operate in track partition | 구체화된 뷰 정의 SQL에 `order by`와 같이 지원되지 않는 연산이 사용되었습니다 |
| context partition column should be slot from column | 윈도우 함수가 사용되었으며, 구체화된 뷰가 `partition by` 절에서 참조하는 파티션 컬럼이 단순 컬럼이 아닌 표현식입니다 |
| partition expressions use more than one slot reference | `group by` 또는 `partition by` 뒤의 파티션 컬럼이 단순 컬럼이 아니라 여러 컬럼을 포함하는 표현식입니다. 예를 들어 `group by partition_col + other_col`인 경우입니다 |
| column to check using invalid implicit expression | 구체화된 뷰의 파티션 컬럼에는 `date_trunc`만 사용할 수 있습니다. 파티션 컬럼에 적용하는 표현식은 `date_trunc` 및 이와 유사한 표현식으로 제한됩니다 |
| partition column time unit level should be greater than SQL select column | 구체화된 뷰의 `date_trunc`가 `partition by` 뒤에 사용될 때 그 시간 단위가 구체화된 뷰 정의 SQL의 select 절 뒤에 나타나는 시간 단위보다 작습니다. 예를 들어 구체화된 뷰는 `partition by(date_trunc(col, 'day'))`를 사용하지만, 구체화된 뷰 정의 SQL의 select 뒤에는 `date_trunc(col, 'month')`가 있는 경우입니다 |
