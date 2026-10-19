---
title: Query Cache 사용자 가이드
description: Apache Doris Query Cache로 반복되는 집계 쿼리를 어떻게 가속할 수 있을까요? 이 문서에서는 동작 원리, 구성 매개변수, 적중 조건, 무효화 메커니즘, 일반적인 문제 해결 절차를 설명합니다.
keywords:
    - Doris Query Cache
    - 쿼리 캐시
    - 집계 쿼리 가속
    - 태블릿 캐시
    - LRU-K
    - 캐시 적중률
    - 파이프라인 실행 엔진
language: ko
---

<!-- Knowledge type: concept + operation + troubleshooting -->
<!-- Applicable scenario: accelerating repeated aggregation queries in dashboards/BI/T+1 reports -->

# Query Cache {#query-cache}

Query Cache는 Apache Doris 파이프라인 실행 엔진에서 중간 집계 결과를 태블릿 단위로 캐싱하여 반복되는 집계 쿼리를 가속하는 메커니즘입니다.

## 사전 확인 체크리스트 {#pre-reading-checklist}

<!-- Knowledge type: prerequisite check -->
<!-- Applicable scenario: determining whether the current query can use the Query Cache -->

Query Cache를 사용하기 전에 다음 사항을 확인하세요.

-   [ ] 쿼리 대상이 **내부 OLAP 테이블**입니다(Hive/JDBC/Iceberg/Hudi/Paimon 같은 외부 테이블이 아님).
-   [ ] 쿼리가 **집계 쿼리**입니다(`GROUP BY` 또는 집계 함수 포함).
-   [ ] 쿼리 계획이 `AggregationNode → OlapScanNode` 패턴과 일치합니다.
-   [ ] 쿼리에 `JOIN`, `SORT`, `UNION`, `WINDOW` 노드가 없습니다.
-   [ ] 쿼리가 `now()`, `rand()`, `uuid()` 같은 비결정적 함수에 의존하지 않습니다.
-   [ ] `enable_query_cache = true`가 설정되어 있습니다.

## 한 문장으로 보는 정의 {#one-sentence-definition}

<!-- Knowledge type: concept definition -->

Query Cache는 파이프라인 실행 엔진에서 집계 결과를 태블릿 단위로 캐싱합니다. 이후 쿼리의 실행 컨텍스트가 같으면 캐시된 데이터를 바로 반환하여 반복적인 스캔과 계산을 방지합니다.

## Query Cache가 필요한 이유 {#why-query-cache-is-needed}

<!-- Knowledge type: background -->
<!-- Applicable scenario: dashboards/reports that repeatedly execute the same aggregation SQL -->

분석 환경에서는 기초 데이터가 바뀌지 않아도 동일한 집계 쿼리를 반복해서 실행하는 경우가 많습니다. 예를 들면 다음과 같습니다.

```sql
SELECT region, SUM(revenue) FROM orders WHERE dt = '2024-01-01' GROUP BY region;
SELECT region, SUM(revenue) FROM orders WHERE dt = '2024-01-01' GROUP BY region;
```

실행할 때마다 동일한 태블릿을 다시 스캔하고 결과를 다시 계산하므로 CPU와 I/O가 낭비됩니다. Query Cache는 중간 집계 결과를 캐싱하고 캐시 적중 시 바로 반환하여 지연 시간을 크게 줄입니다.

:::caution 주요 제한 사항
-   이 기능은 **내부 OLAP 테이블의 집계 쿼리**에만 적용됩니다. 단순 스캔, JOIN, 정렬 등의 연산은 Query Cache를 사용하지 않습니다.
-   **외부 테이블은 지원하지 않습니다**(Hive, JDBC, Iceberg, Hudi, Paimon 등).
:::

## 동작 원리 {#how-it-works}

<!-- Knowledge type: principle -->
<!-- Applicable scenario: understanding hit conditions and the invalidation mechanism -->

### 지원하는 쿼리 패턴 {#supported-query-patterns}

실행 계획 트리가 다음 패턴 중 하나와 일치하는 프래그먼트만 캐시를 사용할 수 있습니다.

-   `AggregationNode → OlapScanNode`: 스캔 바로 위에서 수행하는 단일 단계 집계입니다.
-   `AggregationNode → AggregationNode → OlapScanNode`: 스캔 위에서 수행하는 두 단계 집계입니다.

집계 노드와 스캔 노드 사이에는 `FilterNode`, `ProjectNode` 같은 중간 노드가 있어도 됩니다. 다만 캐시할 하위 트리에는 `JoinNode`, `SortNode`, `UnionNode`, `WindowNode`, `ExchangeNode`가 **포함되어서는 안 됩니다**.

### 캐시 키의 세 가지 구성 요소 {#the-three-components-of-the-cache-key}

| 구성 요소        | 설명                                                                                                                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SQL 다이제스트   | 정규화된 실행 계획 트리(집계 함수, 그룹화 표현식, 비파티션 필터 조건식, 프로젝션된 열, 결과에 영향을 주는 세션 변수)에서 계산한 SHA-256 해시입니다. 의미적으로 동등한 쿼리는 같은 다이제스트를 생성합니다. |
| 태블릿 ID 목록   | 현재 파이프라인 인스턴스에 할당된 태블릿 ID를 정렬한 목록입니다.                                                                                                                                                   |
| 태블릿 범위      | 파티션 조건식에서 도출한 각 태블릿의 유효 스캔 범위입니다([파티션 및 필터 동작](#partition-and-filter-behavior) 참조).                                                                            |

### 캐시 무효화 조건 {#cache-invalidation-conditions}

| 발생 조건          | 설명                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 데이터 변경        | INSERT, DELETE, UPDATE 또는 컴팩션으로 태블릿 버전 번호가 증가합니다. 이후 쿼리에서 버전을 비교하며, 일치하지 않으면 캐시 미스가 발생합니다. |
| 스키마 변경        | ALTER TABLE이 테이블 구조를 변경하면 실행 계획과 다이제스트가 바뀝니다.                                                  |
| LRU 제거           | 캐시 메모리가 한도를 초과하면 LRU-K (K=2)에 따라 항목을 제거합니다. 새 항목은 최소 두 번 접근된 후에야 캐시에 수용됩니다. |
| 만료 항목 정리     | 24시간이 지난 항목은 주기적인 정리 작업으로 자동 제거됩니다.                                                          |
| 강제 새로고침      | `query_cache_force_refresh = true`를 설정하면 캐시를 무시하고 쿼리를 다시 실행합니다.                                         |

### 실행 흐름 {#execution-flow}

**첫 실행(캐시 미스):**

1.  스캔 연산자가 평소와 같이 태블릿에서 데이터를 읽습니다.
2.  집계 연산자가 결과를 계산합니다.
3.  결과를 하위 소비자에게 보내고, 캐시에 기록할 준비를 위해 누적합니다.
4.  실행이 완료된 후 누적 결과가 항목별 크기 또는 행 수 한도를 초과하지 않으면 결과를 캐시에 기록합니다.

**이후 실행(캐시 적중):**

1.  스캔 연산자가 캐시 적중을 감지하고 스캔 범위를 건너뜁니다. 태블릿 데이터는 읽지 않습니다.
2.  집계 연산자는 입력이 없으므로 출력을 생성하지 않습니다.
3.  캐시 소스 연산자가 캐시된 데이터 블록을 바로 제공합니다.
4.  열 순서가 캐시 항목과 다르면(예를 들어 `SELECT a, b`와 `SELECT b, a`는 같은 다이제스트를 생성함) 열을 자동으로 재배열합니다.

## 파티션 및 필터 동작 {#partition-and-filter-behavior}

<!-- Knowledge type: principle -->
<!-- Applicable scenario: understanding how to improve cache hit rates across queries -->

높은 적중률을 얻으려면 파티션 조건식과 필터 표현식이 Query Cache와 어떻게 상호 작용하는지 이해해야 합니다.

### 단일 열 RANGE 파티션 조건식 {#single-column-range-partition-predicates}

**단일 열 RANGE 파티셔닝**을 사용하는 테이블에서는 파티션 조건식을 특별하게 처리합니다.

-   파티션 조건식을 다이제스트에서 **분리**합니다. 시스템은 조건식 범위와 각 파티션의 실제 범위 경계가 겹치는 구간을 계산하여 태블릿 범위 문자열로 캐시 키에 추가합니다.
-   파티션 필터 범위만 다른 두 쿼리는 공통 태블릿의 **캐시를 공유**할 수 있습니다.

**예시**: `orders` 테이블은 `dt` 열을 기준으로 일 단위로 파티셔닝됩니다.

```sql
-- Query A
SELECT region, SUM(revenue) FROM orders
WHERE dt >= '2024-01-01' AND dt < '2024-01-03' GROUP BY region;

-- Query B
SELECT region, SUM(revenue) FROM orders
WHERE dt >= '2024-01-02' AND dt < '2024-01-04' GROUP BY region;
```

-   쿼리 A는 `2024-01-01` 및 `2024-01-02` 파티션을 스캔합니다.
-   쿼리 B는 `2024-01-02` 및 `2024-01-03` 파티션을 스캔합니다.
-   `2024-01-02` 파티션의 태블릿 다이제스트와 범위가 같으므로 **쿼리 B는 `2024-01-02`에 대해 쿼리 A의 캐시를 재사용**하고 `2024-01-03` 파티션만 다시 계산하면 됩니다.

### 다중 열 RANGE / LIST / 파티셔닝하지 않은 테이블 {#multi-column-range--list--unpartitioned-tables}

**다중 열 RANGE 파티셔닝**, **LIST 파티셔닝**을 사용하거나 **파티셔닝하지 않은** 테이블에서는 파티션 조건식을 분리할 수 없으므로 다이제스트에 직접 포함합니다. 파티션 조건식에 작은 차이만 있어도 서로 다른 다이제스트가 생성되어 캐시 미스가 발생합니다.

### 비파티션 필터 표현식 {#non-partition-filter-expressions}

비파티션 필터 표현식(예: `WHERE status = 'active'`)은 정규화된 실행 계획 다이제스트에 포함됩니다. 두 쿼리는 정규화된 필터 표현식이 의미적으로 동일할 때만 캐시를 공유할 수 있습니다.

| 쿼리 1                                              | 쿼리 2                                              | 캐시 공유 여부           |
| --------------------------------------------------- | --------------------------------------------------- | ------------------------ |
| `WHERE status = 'active'`                           | `WHERE status = 'active'`                           | 예(같은 다이제스트)      |
| `WHERE status = 'active'`                           | `WHERE status = 'inactive'`                         | 아니요(서로 다른 다이제스트) |
| `WHERE status = 'active' AND region = 'ASIA'`       | `WHERE region = 'ASIA' AND status = 'active'`       | 예(정규화 후에는 순서와 무관) |

### 세션 변수 {#session-variables}

쿼리 결과에 영향을 주는 세션 변수(예: `time_zone`, `sql_mode`, `sql_select_limit`)는 다이제스트에 포함됩니다. 두 쿼리 사이에 이러한 변수 중 하나라도 변경되면 캐시 키가 달라져 캐시 미스가 발생합니다.

### Query Cache가 비활성화되는 조건 {#conditions-that-disable-the-query-cache}

<!-- Knowledge type: troubleshooting -->
<!-- Applicable scenario: investigating why the cache is not effective -->

| 조건                                                               | 이유                                                                                            |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| 프래그먼트가 런타임 필터의 대상인 경우                              | 계획 시점에는 런타임 필터 값을 알 수 없으므로 캐싱하면 잘못된 결과가 생성됩니다. |
| 비결정적 표현식(`rand()`, `now()`, `uuid()`, UDF 등)을 포함하는 경우 | 입력이 같아도 실행할 때마다 결과가 달라집니다.                                        |
| 캐시할 하위 트리에 JOIN, SORT, UNION 또는 WINDOW 노드가 있는 경우   | "집계-스캔" 패턴만 지원합니다.                                               |
| 스캔 노드가 `OlapScanNode`가 아닌 경우(예: 외부 테이블 스캔)        | 캐시는 태블릿 ID와 버전에 의존하며, 외부 테이블에는 이러한 정보가 없습니다.            |

## Query Cache가 외부 테이블을 지원하지 않는 이유 {#why-query-cache-does-not-support-external-tables}

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: users who want to use the cache with Hive/Iceberg and similar tables -->

Query Cache는 내부 OLAP 테이블에만 있는 세 가지 특성에 의존합니다.

1.  **태블릿 기반 데이터 구성**: 캐시 키에는 태블릿 ID와 각 태블릿의 스캔 범위가 포함됩니다. 외부 테이블은 HDFS, S3, JDBC 같은 외부 시스템에 저장되며 태블릿 개념이 없습니다.
2.  **버전 기반 무효화**: 각 내부 태블릿에는 단조 증가하는 버전 번호가 있으며, 캐시는 이를 사용하여 데이터가 오래되었는지 감지합니다. 외부 테이블은 이러한 버전 메커니즘을 Doris에 노출하지 않습니다.
3.  **OlapScanNode 요구 사항**: 실행 계획 정규화 로직은 집계 캐시 지점 아래의 유효한 스캔 노드로 `OlapScanNode`만 인식합니다.

외부 테이블에 캐싱이 필요하면 [SQL Cache](./sql-cache-manual.md)를 사용하세요.

## 구성 매개변수 {#configuration-parameters}

<!-- Knowledge type: parameter reference -->
<!-- Applicable scenario: tuning cache size and per-entry limits -->

### 세션 변수 (FE) {#session-variables-fe}

| 매개변수                      | 설명                                                                                                       | 기본값             |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------ |
| `enable_query_cache`          | Query Cache를 활성화하거나 비활성화하는 전체 스위치입니다.                                                | `false`            |
| `query_cache_force_refresh`   | `true`로 설정하면 캐시된 결과를 무시하고 쿼리를 다시 실행합니다. 새 결과는 계속 캐시에 기록됩니다. | `false`            |
| `query_cache_entry_max_bytes` | 단일 캐시 항목의 최대 크기(바이트)입니다. 프래그먼트 결과가 이 한도를 초과하면 캐싱하지 않습니다. | `5242880` (5 MB)   |
| `query_cache_entry_max_rows`  | 단일 캐시 항목의 최대 행 수입니다. 프래그먼트 결과가 이 한도를 초과하면 캐싱하지 않습니다. | `500000`           |

### BE 구성 (be.conf) {#be-configuration-beconf}

| 매개변수           | 설명                                                     | 기본값  |
| ------------------ | -------------------------------------------------------- | ------- |
| `query_cache_size` | 각 BE에서 Query Cache가 사용할 수 있는 총 메모리 용량(MB)입니다. | `512`   |

:::note
`query_cache_max_size_mb`와 `query_cache_elasticity_size_mb`는 `be.conf`에서 레거시 SQL Result Cache를 제어하는 설정입니다. 이 문서에서 설명하는 파이프라인 수준의 Query Cache를 제어하는 설정이 **아니므로** 혼동하지 마세요.
:::

## 사용 예시 {#usage-examples}

<!-- Knowledge type: operation -->
<!-- Applicable scenario: enabling, verifying, and forcibly refreshing the cache -->

### 1단계: Query Cache 활성화 {#step-1-enable-the-query-cache}

**목표**: Query Cache의 전체 스위치를 켭니다.

```sql
SET enable_query_cache = true;
```

**설명**: 이 변수는 세션 범위에 적용되므로 연결마다 활성화해야 합니다. 전역 FE 변수로 기본값을 설정할 수도 있습니다.

### 2단계: 일반적인 집계 쿼리 실행 {#step-2-run-a-typical-aggregation-query}

**목표**: 캐시 쓰기와 읽기를 유발합니다.

```sql
-- First execution: cache miss, compute the result and write it to the cache
SELECT region, SUM(revenue), COUNT(*)
FROM orders
WHERE dt = '2024-01-15' AND status = 'completed'
GROUP BY region;

-- Second execution: cache hit, return the result directly from the cache
SELECT region, SUM(revenue), COUNT(*)
FROM orders
WHERE dt = '2024-01-15' AND status = 'completed'
GROUP BY region;
```

**설명**: 두 번째 실행의 SQL 다이제스트, 태블릿 ID 목록, 태블릿 범위가 첫 번째 실행과 동일하므로 캐시 적중이 발생합니다.

### 3단계: 프로파일로 캐시 적중 확인 {#step-3-verify-the-hit-through-the-profile}

**목표**: 쿼리가 실제로 캐시를 사용하는지 확인합니다.

쿼리를 실행한 후 프로파일에서 `CacheSourceOperator` 섹션을 찾으세요.

| 프로파일 필드                              | 의미                                                     |
| ------------------------------------------ | -------------------------------------------------------- |
| `HitCache: true`                           | 쿼리가 캐시에서 결과를 가져왔습니다.           |
| `HitCache: false`, `InsertCache: true`     | 캐시 미스가 발생했지만 결과를 캐시에 성공적으로 기록했습니다. |
| `HitCache: false`, `InsertCache: false`    | 캐시 미스가 발생했고 결과가 너무 커서 캐싱하지 못했습니다.       |
| `CacheTabletId`                            | 캐시 항목이 다루는 태블릿 ID입니다.               |

### 4단계: 캐시 강제 새로고침 {#step-4-force-a-cache-refresh}

**목표**: 기존 캐시를 무시하고 결과를 다시 계산합니다(예: 캐시된 데이터가 잘못되었다고 의심되는 경우).

```sql
-- Force the next query to skip the cache and recompute the result
SET query_cache_force_refresh = true;

SELECT region, SUM(revenue) FROM orders WHERE dt = '2024-01-15' GROUP BY region;

-- Reset
SET query_cache_force_refresh = false;
```

**설명**: 강제로 새로고침한 후에도 새 결과는 캐시에 기록됩니다.

## 사용 사례 비교 {#use-case-comparison}

<!-- Knowledge type: decision -->
<!-- Applicable scenario: deciding whether the Query Cache is worth enabling -->

| 사용 사례                                               | 적용 가능 여부 | 이유                                                                         |
| ------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| 같은 집계 SQL을 반복 실행하는 대시보드 또는 BI 도구       | 예         | 다이제스트와 태블릿이 정확히 일치하므로 높은 적중률을 얻을 수 있습니다.                 |
| T+1 보고서(하루에 한 번 데이터 적재)                     | 예         | 같은 날 이후에 실행하는 쿼리에서 캐시 적중이 발생할 수 있습니다.                               |
| 날짜 범위가 겹치는 집계 쿼리                            | 예         | 단일 열 RANGE 파티셔닝을 사용하면 태블릿 수준에서 항목을 공유할 수 있습니다. |
| 단순 SELECT 스캔, JOIN, 정렬, 윈도 함수                  | 아니요     | "집계-스캔" 패턴만 지원합니다.                            |
| 외부 테이블(Hive, JDBC, Iceberg, Hudi, Paimon)            | 아니요     | 태블릿이나 버전 메커니즘이 없습니다. SQL Cache를 사용하세요.                       |
| 자주 업데이트되는 테이블                                | 아니요     | 태블릿 버전이 빠르게 바뀌어 적중률이 낮아집니다.                   |
| `now()`, `rand()`, `uuid()` 또는 UDF가 포함된 쿼리        | 아니요     | 비결정적 결과로 인해 캐시가 비활성화됩니다.                                 |
| 런타임 필터에 의존하는 쿼리                             | 아니요     | 계획 시점에는 런타임 필터 값을 알 수 없습니다.                          |

## 유의 사항 {#notes}

<!-- Knowledge type: limitation -->

-   **캐시는 영구 저장되지 않음**: Query Cache는 BE 메모리에 상주하며 BE가 재시작되면 지워집니다.
-   **메모리 사용량**: 캐시된 데이터 블록은 BE 메모리를 사용합니다. 메모리 사용량을 모니터링하고 필요에 따라 `query_cache_size`를 조정하세요.
-   **LRU-K 수용 정책**: 캐시가 가득 차면 새 항목은 최소 두 번(K=2) 접근된 후에야 캐시에 수용됩니다. 이를 통해 실행 빈도가 낮은 쿼리가 캐시를 오염시키는 것을 방지합니다.

## 문제 해결 {#troubleshooting}

<!-- Knowledge type: troubleshooting -->
<!-- Applicable scenario: common reasons for cache misses or write failures -->

| 증상                                                         | 가능한 원인                                                                     | 해결 방법                                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `HitCache: false`가 계속 표시됨                              | `enable_query_cache`가 활성화되지 않았습니다.                                   | `SET enable_query_cache = true`를 실행하세요.                                              |
| `HitCache: false`, `InsertCache: false`                      | 단일 항목의 결과가 너무 커서 `query_cache_entry_max_bytes` 또는 `_max_rows`를 초과합니다. | 해당 임계값을 높이거나 필터를 추가하여 결과 크기를 줄이세요.    |
| 계획에 `CacheSourceOperator`가 없음                         | 계획에 JOIN/SORT/UNION/WINDOW가 포함되어 있거나 런타임 필터의 대상입니다.        | "집계-스캔" 패턴에 맞도록 SQL을 다시 작성하세요.                          |
| 테이블이 외부 테이블임                                      | Query Cache는 외부 테이블을 지원하지 않습니다.                                  | [SQL Cache](./sql-cache-manual.md)를 사용하세요.                                           |
| 데이터가 바뀌지 않았는데도 캐시 미스가 발생함                 | 스키마 변경, 세션 변수 변경 또는 `query_cache_force_refresh = true` 설정 때문입니다. | ALTER 이력을 확인하고 세션 변수를 비교한 후 `query_cache_force_refresh`를 재설정하세요. |
| 캐시 적중률이 매우 낮음                                     | 태블릿이 자주 업데이트되거나 컴팩션됩니다.                                      | 쓰기 빈도를 줄이거나 업데이트 빈도가 낮은 테이블에만 캐시를 활성화하세요.           |
| BE 메모리 부담이 증가함                                     | `query_cache_size`가 너무 높게 설정되어 있습니다.                               | `query_cache_size`를 낮추고 BE를 재시작하세요.                                      |

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->

**Q1: Query Cache와 SQL Cache는 어떻게 다른가요?**

| 비교 항목          | Query Cache                                              | SQL Cache                                                |
| ------------------ | -------------------------------------------------------- | -------------------------------------------------------- |
| 캐시 단위          | 태블릿 단위의 중간 집계 결과입니다.                      | 전체 SQL 문의 최종 결과입니다.             |
| 적용 가능한 쿼리   | 내부 OLAP 테이블의 집계 쿼리만 해당합니다.                | 외부 테이블 쿼리를 포함한 모든 쿼리입니다.         |
| 공유 기능          | 서로 다른 SQL 문이 태블릿 수준에서 캐시 항목을 공유할 수 있습니다. | SQL 텍스트가 정확히 일치해야만 캐시 적중이 발생합니다.                    |
| 무효화             | 태블릿 버전이 바뀌는 즉시 무효화됩니다.                   | 파티션 버전 또는 시간을 기준으로 합니다.                     |

**Q2: 활성화하면 바로 캐시 적중이 발생하나요?**

아니요. 첫 실행에서는 "캐시 미스 후 캐시 기록"이 이루어지며, 두 번째 이후 실행부터 캐시 적중이 발생할 수 있습니다. 또한 LRU-K (K=2)에서는 새 항목에 최소 두 번 접근해야 실제로 캐시에 수용됩니다.

**Q3: JOIN이 포함된 집계도 캐싱할 수 있나요?**

아니요. 캐시할 하위 트리에 `JoinNode`가 있으면 해당 프래그먼트의 Query Cache가 비활성화됩니다. 먼저 집계한 후 JOIN하도록 쿼리를 다시 작성하거나 구체화된 뷰를 사용하는 방법을 고려하세요.

**Q4: BE 재시작 후 캐시 워밍업이 필요한가요?**

예. Query Cache는 메모리 내 캐시이므로 재시작하면 지워집니다. 사용량이 적은 시간대에 주요 집계 SQL을 실행하여 캐시를 워밍업할 수 있습니다.

**Q5: 실제로 캐시 적중이 발생했는지 어떻게 확인하나요?**

SQL 실행 후 프로파일에서 `HitCache` 필드를 확인하세요. 이 필드는 `CacheSourceOperator`에 있습니다.

## 요약 {#summary}

<!-- Knowledge type: summary -->

Query Cache는 중간 집계 결과를 태블릿 단위로 캐싱하는 Doris의 파이프라인 수준 최적화 메커니즘입니다. 주요 특징은 다음과 같습니다.

-   내부 OLAP 테이블의 **집계 쿼리**에**만 적용됩니다**.
-   태블릿 버전을 기준으로 캐시를 자동 무효화합니다.
-   파티션 조건식을 다이제스트에서 지능적으로 분리하여 파티션 범위가 겹치는 쿼리끼리 캐시를 공유할 수 있게 합니다.
-   항목별 크기 및 행 수 한도를 제공하여 지나치게 큰 결과가 캐시 메모리를 차지하는 것을 방지합니다.
-   LRU-K (K=2) 제거 정책으로 캐시 품질을 유지합니다.
