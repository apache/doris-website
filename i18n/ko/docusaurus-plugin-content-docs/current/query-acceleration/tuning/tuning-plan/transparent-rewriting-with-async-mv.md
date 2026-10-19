---
{
    "title": "비동기 구체화된 뷰를 사용한 투명한 재작성: 복잡한 쿼리 가속",
    "sidebar_label": "비동기 MV를 사용한 투명한 재작성",
    "language": "ko",
    "description": "Doris 비동기 구체화된 뷰로 투명한 재작성을 적용하려면 어떻게 해야 할까요? 이 문서에서는 복잡한 조인 및 집계 쿼리를 가속할 수 있도록 SPJG 기반 재작성 알고리즘, 실습 예제, 구체화된 뷰 사용 여부를 확인하는 방법을 소개합니다.",
    "keywords": ["Doris 비동기 구체화된 뷰", "투명한 재작성", "SPJG", "쿼리 가속", "explain shape plan", "구체화된 뷰 사용 여부"]
}
---

<!-- Knowledge type: Concept + How-to guide -->
<!-- Applicable scenario: Performance optimization for complex JOIN/aggregation queries -->

비동기 구체화된 뷰를 사용한 투명한 재작성이란 Doris가 쿼리 SQL의 구조를 자동으로 분석하고, 기존 구체화된 뷰를 활용하는 동등한 쿼리로 재작성하는 것을 뜻합니다. 이를 통해 미리 계산된 결과를 재사용하여 쿼리를 가속합니다.

## 읽기 전에 {#before-you-read}

- [비동기 구체화된 뷰](../../materialized-view/async-materialized-view/overview.md)의 기본 개념을 알고 있어야 합니다.
- SQL과 `EXPLAIN`을 사용한 경험이 있어야 합니다.
- 쿼리가 SPJG (SELECT-PROJECT-JOIN-GROUP-BY) 패턴을 따라야 합니다.
- 구체화된 뷰를 생성하고 테이블을 쿼리할 권한이 있어야 합니다.

## 개요 {#overview}

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Understanding the principles of transparent rewriting -->

[비동기 구체화된 뷰](../../materialized-view/async-materialized-view/overview.md)는 SPJG (SELECT-PROJECT-JOIN-GROUP-BY) 패턴에 기반한 투명한 재작성 알고리즘을 사용합니다.

이 알고리즘의 핵심 기능은 다음과 같습니다.

- **구조 분석**: 쿼리 SQL의 논리적 구조를 자동으로 파싱합니다.
- **뷰 매칭**: 기존 구체화된 뷰 중에서 사용할 수 있는 후보를 찾습니다.
- **투명한 재작성**: 원본 SQL을 수정하지 않고 쿼리를 구체화된 뷰를 활용하는 동등한 쿼리로 재작성합니다.
- **성능 향상**: 미리 계산된 결과를 재사용하여 쿼리 속도를 크게 높이고 연산 비용을 줄입니다.

## 적합한 사용 시나리오 {#applicable-scenarios}

<!-- Knowledge type: Decision reference -->
<!-- Applicable scenario: Deciding whether to use transparent rewriting -->

| 시나리오 특성 | 투명한 재작성 사용 권장 여부 | 설명 |
| --- | --- | --- |
| 복잡한 JOIN + GROUP BY 쿼리 | 권장 | SPJG 패턴에 잘 부합함 |
| 자주 반복되는 집계 쿼리 | 권장 | 사전 계산의 이점이 큼 |
| 데이터 변경이 드문 기본 테이블 | 권장 | 유지 관리 비용이 낮음 |
| 데이터 변경이 잦은 기본 테이블 | 권장하지 않음 | 구체화된 뷰의 새로 고침 오버헤드가 큼 |
| 단순 포인트 쿼리만 실행 | 권장하지 않음 | 사전 계산의 이점이 제한적임 |
| 저장 공간이 부족한 환경 | 신중하게 사용 | 구체화된 뷰에 추가 저장 공간이 필요함 |

## 실습 예제: 구체화된 뷰로 쿼리 가속하기 {#hands-on-example-accelerating-queries-with-a-materialized-view}

<!-- Knowledge type: How-to guide -->
<!-- Applicable scenario: End-to-end implementation of transparent rewriting -->

다음 예제에서는 TPC-H 데이터셋을 사용하여 투명한 재작성의 전체 과정을 보여 줍니다.

### 1단계: 기본 테이블 생성 {#step-1-create-the-base-tables}

**목표**: 실습에 사용할 `orders` 및 `lineitem` 테이블을 생성하고 데이터를 적재합니다.

**명령어**:

```sql
CREATE DATABASE IF NOT EXISTS tpch;
USE tpch;

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
    FROM ('2023-10-17') TO ('2023-10-20') INTERVAL 1 DAY
)
DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3
PROPERTIES ("replication_num" = "1");

INSERT INTO orders VALUES
    (1, 1, 'o', 99.5, '2023-10-17', 'a', 'b', 1, 'yy'),
    (2, 2, 'o', 109.2, '2023-10-18', 'c','d',2, 'mm'),
    (3, 3, 'o', 99.5, '2023-10-19', 'a', 'b', 1, 'yy');

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
(FROM ('2023-10-17') TO ('2023-10-20') INTERVAL 1 DAY)
DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3
PROPERTIES ("replication_num" = "1");

INSERT INTO lineitem VALUES
    (1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-17', '2023-10-17', '2023-10-17', 'a', 'b', 'yyyyyyyyy'),
    (2, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-18', '2023-10-18', '2023-10-18', 'a', 'b', 'yyyyyyyyy'),
    (3, 2, 3, 6, 7.5, 8.5, 9.5, 10.5, 'k', 'o', '2023-10-19', '2023-10-19', '2023-10-19', 'c', 'd', 'xxxxxxxxx');
```

**참고**: 두 테이블 모두 날짜별로 파티션이 나뉘어 있어 구체화된 뷰를 파티션 단위로 쉽게 새로 고칠 수 있습니다.

### 2단계: 비동기 구체화된 뷰 생성 {#step-2-create-an-async-materialized-view}

**목표**: 사전 집계된 비동기 구체화된 뷰 `mv1`을 `lineitem`과 `orders`를 기반으로 생성합니다.

**명령어**:

```sql
CREATE MATERIALIZED VIEW mv1
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
PARTITION BY(l_shipdate)
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES ('replication_num' = '1')
AS
SELECT l_shipdate, o_orderdate, l_partkey, l_suppkey, SUM(o_totalprice) AS sum_total
FROM lineitem
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
l_shipdate,
o_orderdate,
l_partkey,
l_suppkey;
```

**주요 매개변수**:

| 매개변수 | 값 | 설명 |
| --- | --- | --- |
| `BUILD IMMEDIATE` | 즉시 빌드 | 생성 직후 데이터를 구체화함 |
| `REFRESH COMPLETE ON MANUAL` | 수동 전체 새로 고침 | 사용자가 새로 고침을 트리거함 |
| `PARTITION BY(l_shipdate)` | 파티션 키로 파티션 분할 | 증분 유지 관리를 위해 기본 테이블의 파티션과 정렬함 |
| `DISTRIBUTED BY RANDOM BUCKETS 2` | 무작위 버킷 분할 | 데이터 분산 설정을 단순화함 |

### 3단계: 쿼리 실행 및 투명한 재작성 확인 {#step-3-run-the-query-and-verify-transparent-rewriting}

**목표**: 쿼리가 `mv1`을 활용하는 실행 계획으로 재작성되는지 확인합니다.

**명령어**:

```sql
mysql> explain shape plan SELECT l_shipdate, SUM(o_totalprice) AS total_price
    -> FROM lineitem
    -> LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
    -> WHERE l_partkey = 2 AND l_suppkey = 3
    -> GROUP BY l_shipdate;
+-------------------------------------------------------------------+
| Explain String(Nereids Planner)                                   |
+-------------------------------------------------------------------+
| PhysicalResultSink                                                |
| --PhysicalDistribute[DistributionSpecGather]                      |
| ----PhysicalProject                                               |
| ------hashAgg[GLOBAL]                                             |
| --------PhysicalDistribute[DistributionSpecHash]                  |
| ----------hashAgg[LOCAL]                                          |
| ------------PhysicalProject                                       |
| --------------filter((mv1.l_partkey = 2) and (mv1.l_suppkey = 3)) |
| ----------------PhysicalOlapScan[mv1]                             |
+-------------------------------------------------------------------+
```

**참고**: 실행 계획의 끝에 `PhysicalOlapScan[mv1]`이 표시됩니다. 이는 쿼리가 투명하게 재작성되어 `mv1`을 사용한다는 뜻입니다.

### 4단계: 재작성 상태의 세부 정보 확인 {#step-4-inspect-rewriting-status-details}

**목표**: `explain`을 사용하여 재작성 상태에 대한 더 자세한 정보를 확인합니다.

**명령어**:

```sql
| ========== MATERIALIZATIONS ==========                                            |
|                                                                                   |
| MaterializedView                                                                  |
| MaterializedViewRewriteSuccessAndChose:                                           |
|   internal.tpch.mv1 chose,                                                        |
|                                                                                   |
| MaterializedViewRewriteSuccessButNotChose:                                        |
|   not chose: none,                                                                |
|                                                                                   |
| MaterializedViewRewriteFail:                                                      |
```

**주요 필드**:

| 필드 | 의미 |
| --- | --- |
| `MaterializedViewRewriteSuccessAndChose` | 재작성에 성공했으며 옵티마이저가 해당 계획을 선택함 |
| `MaterializedViewRewriteSuccessButNotChose` | 재작성에 성공했지만 선택되지 않음(비용이 최적이 아님) |
| `MaterializedViewRewriteFail` | 재작성 실패 |

## 사용 권장 사항 {#usage-recommendations}

<!-- Knowledge type: Best practice -->
<!-- Applicable scenario: Materialized view design and operations -->

:::tip 사용 권장 사항

- **미리 계산된 결과**: 구체화된 뷰는 쿼리 결과를 미리 계산하여 저장하므로 쿼리를 실행할 때마다 같은 계산을 반복하지 않아도 됩니다. 자주 실행되는 복잡한 쿼리에 적합합니다.
- **조인 연산 감소**: 구체화된 뷰는 여러 테이블의 데이터를 하나의 뷰로 통합할 수 있어 쿼리 실행 시 조인 연산을 줄이고 쿼리 효율을 높입니다.
- **자동 업데이트**: 기본 테이블의 데이터가 변경되면 구체화된 뷰를 자동으로 업데이트하여 쿼리 결과에 최신 데이터 상태를 반영할 수 있습니다.
- **저장 공간 오버헤드**: 구체화된 뷰에는 추가 저장 공간이 필요합니다. 생성할 때 쿼리 성능과 저장 비용 사이의 균형을 고려해야 합니다.
- **유지 관리 비용**: 구체화된 뷰를 유지 관리하는 데는 시스템 리소스가 소모됩니다. 기본 테이블이 자주 업데이트되면 새로 고침 오버헤드가 커지므로 적절한 새로 고침 전략을 선택해야 합니다.
- **적합한 사용 시나리오**: 구체화된 뷰는 데이터 변경이 드물고 쿼리가 자주 실행되는 시나리오에 적합합니다. 데이터가 자주 변경된다면 실시간 계산이 더 적절할 수 있습니다.

:::

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: Troubleshooting rewriting misses and lower-than-expected performance -->

### Q1: 쿼리에 구체화된 뷰가 사용되지 않으면 어떻게 해야 하나요? {#q1-what-should-i-do-if-my-query-does-not-hit-a-materialized-view}

다음 순서로 원인을 확인합니다.

1. `explain`을 사용하여 `MATERIALIZATIONS` 섹션에 `RewriteFail` 정보가 있는지 확인합니다.
2. 쿼리가 SPJG (SELECT-PROJECT-JOIN-GROUP-BY) 패턴을 따르는지 확인합니다.
3. 구체화된 뷰의 필드에 쿼리에 필요한 모든 열이 포함되어 있는지 확인합니다.
4. 구체화된 뷰가 사용 가능한 상태인지 확인합니다(빌드가 완료되었고 무효화되지 않은 상태).

### Q2: 재작성에 성공했는데도 선택되지 않는 이유는 무엇인가요? {#q2-why-does-rewriting-succeed-but-does-not-get-chosen}

`MaterializedViewRewriteSuccessButNotChose`는 옵티마이저가 재작성된 계획의 비용이 원본 계획보다 높다고 판단했음을 뜻합니다. 다음 방법을 시도해 볼 수 있습니다.

- 구체화된 뷰의 파티션 및 버킷 분할 전략을 조정합니다.
- `ANALYZE`로 통계를 수집하여 옵티마이저가 비용을 정확하게 추정할 수 있도록 합니다.

### Q3: 구체화된 뷰의 새로 고침이 너무 느리면 어떻게 해야 하나요? {#q3-what-should-i-do-if-materialized-view-refresh-is-too-slow}

- 전체 새로 고침보다 증분 새로 고침을 우선 사용합니다.
- 구체화된 뷰의 파티션 키를 기본 테이블의 파티션 키와 맞추고 파티션 단위로 새로 고칩니다.
- 기본 테이블의 쓰기 빈도를 검토하고 사용량이 많은 시간대에는 새로 고침을 트리거하지 않도록 합니다.

### Q4: 재작성된 쿼리가 구체화된 뷰를 사용하는지 어떻게 확인하나요? {#q4-how-do-i-confirm-whether-a-rewrite-is-hit}

`EXPLAIN` 또는 `EXPLAIN SHAPE PLAN`을 실행하고 다음을 확인합니다.

- 계획에 `PhysicalOlapScan[mv name]`이 나타나는지 확인합니다.
- `RewriteSuccessAndChose` 항목(`MATERIALIZATIONS` 섹션)에 대상 구체화된 뷰가 포함되어 있는지 확인합니다.

### 자주 나타나는 오류 키워드 {#common-error-keywords}

- `MaterializedViewRewriteFail`: 재작성에 실패했습니다. 일반적으로 SQL이 SPJG 패턴과 일치하지 않거나 필요한 필드가 누락된 경우에 발생합니다.
- `not chose`: 재작성에 성공했지만 선택되지 않았습니다. 대개 비용 추정과 관련된 문제입니다.
- `MV is not in NORMAL state`: 구체화된 뷰가 비정상 상태입니다. 새로 고침 이력을 확인하세요.

## 요약 {#summary}

비동기 구체화된 뷰를 적절히 사용하면 대규모 데이터셋에 대한 복잡한 조인 및 집계 쿼리의 성능을 크게 높일 수 있습니다. 적용할 때는 저장 비용, 새로 고침 오버헤드, 데이터 최신성을 함께 고려하여 성능과 비용의 균형을 맞춰야 합니다.
